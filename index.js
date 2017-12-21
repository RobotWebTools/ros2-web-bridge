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
const NodeManager = require('./lib/node_manager.js');
const Bridge = require('./lib/bridge.js');
const debug = require('debug')('ros2bridge:index');

rclnodejs.init().then(() => {
  let node = rclnodejs.createNode('ros2bridge_node');
  let nodeManager = new NodeManager(node);
  let bridgeMap = new Map();
  let server = new Server({port: 9090});

  server.on('connection', (ws) => {
    let bridge = new Bridge(nodeManager, ws);
    bridgeMap.set(bridge.bridgeId, {ws: ws, bridge: bridge});

    ws.on('message', (message) => {
      bridge.receiveMessage(message);
    });
    ws.on('close', () => {
      let bridge = bridgeMap.get(ws);
      bridgeMap.delete(ws);
      debug('disconnected');
    });
  });

  server.on('error', (error) => {
    nodeManager.shutdown();
    debug('WebSocket error: ' + error);
  });

  rclnodejs.spin(node);
});
