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
const debug = require('debug')('ros2bridge:Bridge');

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

class Bridge {
  constructor(nodeManager, ws) {
    this._nodeManager = nodeManager;
    this._ws = ws;
    this._parser = new MessageParser();
    this._bridgeId = this._generateRandomId();
    this._servicesResponse = new Map();
  }

  _generateRandomId() {
    return Math.floor(Math.random() * Number.MAX_VALUE).toString();
  }

  _exractMessageType(type) {
    const splitted = type.split('/');
    return splitted[0] + '/msg/' + splitted[1];
  }

  _exractServiceType(type) {
    const splitted = type.split('/');
    return splitted[0] + '/srv/' + splitted[1];
  }

  get bridgeId() {
    return this._bridgeId;
  }

  receiveMessage(message) {
    const command = this._parser.process(message);
    if (!command) return;

    debug(`JSON command received: ${JSON.stringify(command)}`);
    this.executeCommand(command);
  }

  executeCommand(command) {
    if (command.op === 'advertise') {
      debug(`advertise a topic: ${command.topic}`);
      this._nodeManager.createPublisher(this._exractMessageType(command.type), command.topic);
    }

    if (command.op === 'unadvertise') {
      debug(`unadvertise a topic: ${command.topic}`);
      this._nodeManager.destroyPubliser(command.topic);
    }

    if (command.op === 'publish') {
      debug(`Publish a topic named ${command.topic} with ${JSON.stringify(command.msg)}`);

      let publisher = this._nodeManager.getPublishByTopic(command.topic);
      if (publisher) {
        publisher.publish(command.msg);
      }
    }

    if (command.op === 'subscribe') {
      debug(`subscribe a topic named ${command.topic}`);

      this._nodeManager.createSubscription(
        this._exractMessageType(command.type), command.topic, this._bridgeId, this.sendSubscriptionResponse.bind(this));
    }

    if (command.op === 'unsubscribe') {
      debug(`unsubscribe a topic named ${command.topic}`);
      this._nodeManager.destroySubscription(command.topic);
    }

    if (command.op === 'call_service') {
      let serviceName = command.service;
      let client = this._nodeManager.createClient(this._exractServiceType(command.args.type), serviceName);

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
      this._nodeManager.destroyService(command.service);
    }


  }

  clean() {
    // TODO: destroy the resource when the socket connection is closed.
  }

  sendSubscriptionResponse(topicName, message) {
    debug(`Send subscription response: ${message}`);
    let response = {op: 'publish', topic: topicName, msg: message};
    this._ws.send(JSON.stringify(response));
  }

  sendBackCommandStatus(id, error) {
    let command;
    if (!error) {
      command = {op: 'set_level', id: id, level: 'none'};
    } else {
      command = {op: 'set_level', id: id, level: 'error'};
    }
    debug(`Status message: ${JSON.stringify(command)}`);
    this._ws.send(JSON.stringify(command));
  }
}

module.exports = Bridge;
