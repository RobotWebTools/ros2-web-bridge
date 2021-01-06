// Copyright (c) 2017 Intel Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const ResourceProvider = require('./resource_provider.js');
const debug = require('debug')('ros2-web-bridge:Bridge');
const EventEmitter = require('events');
const uuidv4 = require('uuid/v4');
const {validator} = require('rclnodejs');

const STATUS_LEVELS = ['error', 'warning', 'info', 'none'];

class MessageParser {
  constructor() {
    this._buffer = '';
  }

  process(message) {
    // The logic below is translated from the current implementation of rosbridge_suit,
    // see https://github.com/RobotWebTools/rosbridge_suite/blob/develop/rosbridge_library/src/rosbridge_library/protocol.py
    this._buffer += message;
    let msg = null;
    try {
      msg = JSON.parse(this._buffer);
      this._buffer = '';
    }
    catch (e) {
      if (e instanceof SyntaxError) {
        let openingBrackets = this._buffer.indexOf('{');
        let closingBrackets = this._buffer.indexOf('}');

        for (let start = 0; start <= openingBrackets; start++) {
          for (let end = 0; end <= closingBrackets; end++) {
            try {
              msg = JSON.parse(this._buffer.substring(start, end + 1));
              if (msg.op) {
                self._buffer = self._buffer.substr(end + 1, this._buffer.length);
                break;
              }
            }
            catch (e) {
              if (e instanceof SyntaxError) {
                continue;
              }
            }
          }
          if (msg) {
            break;
          }
        }
      }
    }
    return msg;
  }
}

class Bridge extends EventEmitter {

  constructor(node, ws, statusLevel) {
    super();
    this._ws = ws;
    this._parser = new MessageParser();
    this._bridgeId = this._generateRandomId();
    this._servicesResponse = new Map();
    this._closed = false;
    this._resourceProvider = new ResourceProvider(node, this._bridgeId);
    this._registerConnectionEvent(ws);
    this._rebuildOpMap();
    this._topicsPublished = new Map();
    this._setStatusLevel(statusLevel || 'error');
    debug(`Web bridge ${this._bridgeId} is created`);
  }

  _registerConnectionEvent(ws) {
    ws.on('message', (message) => {
      this._receiveMessage(message);
    });

    ws.on('close', () => {
      this.close();
      this.emit('close', this._bridgeId);
      debug(`Web bridge ${this._bridgeId} is closed`);
    });

    ws.on('error', (error) => {
      this.emit('error', error);
      debug(`Web socket of bridge ${this._bridgeId} error: ${error}`);
    });
  }

  close() {
    if (!this._closed) {
      this._resourceProvider.clean();
      this._servicesResponse.clear();
      this._topicsPublished.clear();
      this._closed = true;
    }
  }

  _generateRandomId() {
    return uuidv4();
  }

  _exractMessageType(type) {
    if (type.indexOf('/msg/') === -1) {
      const splitted = type.split('/');
      return splitted[0] + '/msg/' + splitted[1];
    }
    return type;
  }

  _exractServiceType(type) {
    if (type.indexOf('/srv/') === -1) {
      const splitted = type.split('/');
      return splitted[0] + '/srv/' + splitted[1];
    }
    return type;
  }

  _receiveMessage(message) {
    const command = this._parser.process(message);
    if (!command) return;

    debug(`JSON command received: ${JSON.stringify(command)}`);
    this.executeCommand(command);
  }

  get bridgeId() {
    return this._bridgeId;
  }

  get closed() {
    return this._closed;
  }

  _registerOpMap(opCode, callback) {
    this._opMap = this._opMap || {};

    if (this._opMap[opCode]) {
      debug(`Warning: existing callback of '${opCode}'' will be overwritten by new callback`);
    }
    this._opMap[opCode] = callback;
  }

  _rebuildOpMap() {
    this._registerOpMap('set_level', (command) => {
      if (STATUS_LEVELS.indexOf(command.level) === -1) {
        throw new Error(`Invalid status level ${command.level}; must be one of ${STATUS_LEVELS}`);
      }
      this._setStatusLevel(command.level);
    });

    this._registerOpMap('advertise', (command) => {
      let topic = command.topic;
      if (this._topicsPublished.has(topic) && (this._topicsPublished.get(topic) !== command.type)) {
        throw new Error(`The topic ${topic} already exists with a different type ${this._topicsPublished.get(topic)}.`);
      }
      debug(`advertise a topic: ${topic}`);
      this._topicsPublished.set(topic, command.type);
      this._resourceProvider.createPublisher(this._exractMessageType(command.type), topic);
    });

    this._registerOpMap('unadvertise', (command) => {
      let topic = command.topic;
      this._validateTopicOrService(command.topic);

      if (!this._topicsPublished.has(topic)) {
        let error = new Error(`The topic ${topic} does not exist`);
        error.level = 'warning';
        throw error;
      }
      debug(`unadvertise a topic: ${topic}`);
      this._topicsPublished.delete(topic);
      this._resourceProvider.destroyPublisher(topic);
    });

    this._registerOpMap('publish', (command) => {
      debug(`Publish a topic named ${command.topic} with ${JSON.stringify(command.msg)}`);

      if (!this._topicsPublished.has(command.topic)) {
        let error = new Error(`The topic ${command.topic} does not exist`);
        error.level = 'error';
        throw error;
      }
      let publisher = this._resourceProvider.getPublisherByTopicName(command.topic);
      if (publisher) {
        publisher.publish(command.msg);
      }
    });

    this._registerOpMap('subscribe', (command) => {
      debug(`subscribe a topic named ${command.topic}`);

      this._resourceProvider.createSubscription(this._exractMessageType(command.type),
        command.topic,
        this._sendSubscriptionResponse.bind(this));
    });

    this._registerOpMap('unsubscribe', (command) => {
      let topic = command.topic;
      this._validateTopicOrService(topic);

      if (!this._resourceProvider.hasSubscription(topic)) {
        let error = new Error(`The topic ${topic} does not exist.`);
        error.level = 'warning';
        throw error;
      }
      debug(`unsubscribe a topic named ${topic}`);
      this._resourceProvider.destroySubscription(command.topic);
    });

    this._registerOpMap('call_service', (command) => {
      let serviceName = command.service;
      let client =
        this._resourceProvider.createClient(this._exractServiceType(command.type), serviceName);

      if (client) {
        client.sendRequest(command.args, (response) => {
          let serviceResponse =
            {op: 'service_response', service: command.service, values: response, id: command.id, result: true};

          this._ws.send(JSON.stringify(serviceResponse));
        });
      }
    });

    this._registerOpMap('advertise_service', (command) => {
      let serviceName = command.service;
      let service = this._resourceProvider.createService(
        this._exractServiceType(command.type),
        serviceName,
        (request, response) => {
          let id = this._generateRandomId();
          let serviceRequest = {op: 'call_service', service: command.service, args: request, id: id};
          this._servicesResponse.set(id, response);
          this._ws.send(JSON.stringify(serviceRequest));
        });
    });

    this._registerOpMap('service_response', (command) => {
      let serviceName = command.service;
      let id = command.id;
      let response = this._servicesResponse.get(id);
      if (response) {
        response.send(command.values);
        this._servicesResponse.delete(id);
      }
    });

    this._registerOpMap('unadvertise_service', (command) => {
      let serviceName = command.service;
      this._validateTopicOrService(serviceName);

      if (!this._resourceProvider.hasService(serviceName)) {
        let error = new Error(`The service ${serviceName} does not exist.`);
        error.level = 'warning';
        throw error;
      }
      debug(`unadvertise a service: ${serviceName}`);
      this._resourceProvider.destroyService(command.service);
    });
  }

  executeCommand(command) {
    try {
      const op = this._opMap[command.op];
      if (!op) {
        throw new Error(`Operation ${command.op} is not supported`);
      }
      op.apply(this, [command]);
      this._sendBackOperationStatus(command.id, 'none', 'OK');
    } catch (e) {
      e.id = command.id;
      e.op = command.op;
      this._sendBackErrorStatus(e);
    }
  }

  _sendSubscriptionResponse(topicName, message) {
    debug('Send message to subscription.');
    let response = {op: 'publish', topic: topicName, msg: message};
    this._ws.send(JSON.stringify(response));
  }

  _sendBackErrorStatus(error) {
    const msg = `${error.op}: ${error}`;
    return this._sendBackOperationStatus(error.id, error.level || 'error', msg);
  }

  _sendBackOperationStatus(id, level, msg) {
    let command = {
      op: 'status', 
      level: level || 'none',
      msg: msg || '',
      id: id,
    };
    if (this._statusLevel < STATUS_LEVELS.indexOf(level)) {
      debug('Suppressed: ' + JSON.stringify(command));
      return;
    }
    debug('Response: ' + JSON.stringify(command));
    this._ws.send(JSON.stringify(command));
  }

  _setStatusLevel(level) {
    this._statusLevel = STATUS_LEVELS.indexOf(level);
    debug(`Status level set to ${level} (${this._statusLevel})`);
  }

  _validateTopicOrService(name) {
    if (name.startsWith('/')) {
      validator.validateFullTopicName(name);
    } else {
      validator.validateTopicName(name);
    }
  }

  get ws() {
    return this._ws;
  }
}

module.exports = Bridge;
