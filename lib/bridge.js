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

const rclnodejs = require('rclnodejs');
const debug = require('debug')('ros2-web-bridge:Bridge');
const EventEmitter = require('events');
const uuidv4 = require('uuid/v4');

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
  constructor(nodeManager, ws) {
    super();
    this._nodeManager = nodeManager;
    this._ws = ws;
    this._parser = new MessageParser();
    this._bridgeId = this._generateRandomId();
    this._servicesResponse = new Map();
    this._closed = false;

    this._registerConnectionEvent(ws);
  }

  _registerConnectionEvent(ws) {
    ws.on('message', (message) => {
      this._receiveMessage(message);
    });

    ws.on('close', () => {
      this.close();
      this.emit('close', this._bridgeId);
      debug('Web socket connection closed');
    });

    ws.on('error', (error) => {
      error.bridge = this;
      this.emit('error', error);
      debug(`Web socket connection error: ${error}`);
    });
  }

  close() {
    if (!this._closed) {
      this._nodeManager.cleanResourceByBridgeId(this._bridgeId);
      this._servicesResponse.clear();
      this._closed = true;
    }
  }

  _generateRandomId() {
    return uuidv4();
  }

  _exractMessageType(type) {
    const splitted = type.split('/');
    return splitted[0] + '/msg/' + splitted[1];
  }

  _exractServiceType(type) {
    const splitted = type.split('/');
    return splitted[0] + '/srv/' + splitted[1];
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

  executeCommand(command) {
    try {
      if (command.op === 'advertise') {
        debug(`advertise a topic: ${command.topic}`);
        this._nodeManager.createPublisher(this._exractMessageType(command.type), command.topic, this._bridgeId);
      }

      if (command.op === 'unadvertise') {
        debug(`unadvertise a topic: ${command.topic}`);
        this._nodeManager.destroyPublisher(command.topic, this._bridgeId);
      }

      if (command.op === 'publish') {
        debug(`Publish a topic named ${command.topic} with ${JSON.stringify(command.msg)}`);

        let publisher = this._nodeManager.getPublisherByTopic(command.topic, this._bridgeId);
        if (publisher) {
          publisher.publish(command.msg);
        }
      }

      if (command.op === 'subscribe') {
        debug(`subscribe a topic named ${command.topic}`);

        this._nodeManager.createSubscription(this._exractMessageType(command.type),
                                             command.topic,
                                             this._bridgeId,
                                             this._sendSubscriptionResponse.bind(this));
      }

      if (command.op === 'unsubscribe') {
        debug(`unsubscribe a topic named ${command.topic}`);
        this._nodeManager.destroySubscription(command.topic, this._bridgeId);
      }

      if (command.op === 'call_service') {
        let serviceName = command.service;
        let client =
          this._nodeManager.createClient(this._exractServiceType(command.args.type), serviceName, this._bridgeId);

        if (client) {
          client.sendRequest(command.args.request, (response) => {
            let serviceResponse =
              {op: 'service_response', service: command.service, values: response, id: command.id, result: true};

            this._ws.send(JSON.stringify(serviceResponse));
          });
        }
      }

      if (command.op === 'advertise_service') {
        let serviceName = command.service;
        let service = this._nodeManager.createService(
          this._exractServiceType(command.type),
          serviceName, this._bridgeId,
          (request, response) => {
            let id = this._generateRandomId();
            let serviceRequest = {op: 'call_service', service: command.service, args: request, id: id};
            this._servicesResponse.set(id, response);
            this._ws.send(JSON.stringify(serviceRequest));
          });
      }

      if (command.op === 'service_response') {
        let serviceName = command.service;
        let id = command.id;
        let response = this._servicesResponse.get(id);
        if (response) {
          response.send(command.values);
          this._servicesResponse.delete(id);
        }
      }

      if (command.op === 'unadvertise_service') {
        this._nodeManager.destroyService(command.service, bridgeId);
      }
    }
    catch (error) {
      error.id = command.id;
      error.op = command.op;
      this._sendBackOperationError(error);
    }
  }

  _sendSubscriptionResponse(topicName, message) {
    debug('Send message to subscription.');
    let response = {op: 'publish', topic: topicName, msg: message};
    this._ws.send(JSON.stringify(response));
  }

  _sendBackOperationError(error) {
    if (error) {
      let command = {op: 'set_level', id: error.id, level: 'error'};
      debug(`Error: ${error} happened when executing command ${error.op}`);
      this._ws.send(JSON.stringify(command));
    }
  }

  get ws() {
    return this._ws;
  }
}

module.exports = Bridge;
