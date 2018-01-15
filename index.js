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
const {Server} = require('ws');
const Bridge = require('./lib/bridge.js');
const debug = require('debug')('ros2-web-bridge:index');

function createServer(options) {
  options = options || {};
  options.port = options.port || 9090;
  let server = new Server({port: options.port});

  return rclnodejs.init().then(() => {
    let node = rclnodejs.createNode('ros2_web_bridge');
    let bridgeMap = new Map();

    function closeAllBridges() {
      bridgeMap.forEach((bridge, bridgeId) => {
        bridge.close();
      });
    }

    server.on('connection', (ws) => {
      let bridge = new Bridge(node, ws);
      bridgeMap.set(bridge.bridgeId, bridge);

      bridge.on('error', (error) => {
        let bridge = error.bridge;
        if (bridge) {
          debug(`Error happened, the bridge ${error.bridge.bridgeId} will be closed.`);
          bridge.close();
          bridgeMap.delete(bridge.bridgeId);
        } else {
          debug(`Unknown error happened: ${error}.`);
        }
      });

      bridge.on('close', (bridgeId) => {
        bridgeMap.delete(bridgeId);
      });
    });

    server.on('error', (error) => {
      closeAllBridges();
      rclnodejs.shutdown();
      debug(`WebSocket server error: ${error}, the module will be terminated.`);
    });

    rclnodejs.spin(node);
    debug('The ros2-web-bridge has started.');
    console.log(`The web socket server started on ws://localhost:${options.port}`);
  }).catch(error => {
    debug(`Unknown error happened: ${error}, the module will be terminated.`);
    server.close();
    rclnodejs.shutdown();
  });
}

module.exports = {
  createServer: createServer,
};
