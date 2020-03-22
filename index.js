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
const WebSocket = require('ws');
const Bridge = require('./lib/bridge.js');
const debug = require('debug')('ros2-web-bridge:index');

// rclnodejs node
let node;

// Websocket server (or client if client mode set via --address)
let server;
let connectionAttempts = 0;

// Map of bridge IDs to Bridge objects
let bridgeMap = new Map();

function closeAllBridges() {
  bridgeMap.forEach((bridge, bridgeId) => {
    bridge.close();
  });
}

function shutDown(error) {
  // Closing the server triggers the individual connections to be closed.
  if (server) {
    server.close();
  }
  if (!rclnodejs.isShutdown()) {
    rclnodejs.shutdown();
  }
  if (error) {
    throw error;
  }
}

function createServer(options) {
  options = options || {};
  options.address = options.address || null;
  process.on('exit', () => {
    debug('Application will exit.');
    shutDown();
  });
  return rclnodejs.init()
    .then(() => {
      node = rclnodejs.createNode('ros2_web_bridge');
      rclnodejs.spin(node);
      debug('ROS2 node started');
      createConnection(options);
    })
    .catch(error => shutDown(error));
}

function createConnection(options) {
  if (options.address != null) {
    debug('Starting in client mode; connecting to ' + options.address);
    server = new WebSocket(options.address);
  } else {
    options.port = options.port || 9090;
    debug('Starting server on port ' + options.port);
    server = new WebSocket.Server({port: options.port});
  }

  const makeBridge = (ws) => {
    let bridge = new Bridge(node, ws, options.status_level);
    bridgeMap.set(bridge.bridgeId, bridge);

    bridge.on('error', (error) => {
      debug(`Bridge ${bridge.bridgeId} closing with error: ${error}`);
      bridge.close();
      bridgeMap.delete(bridge.bridgeId);
    });

    bridge.on('close', (bridgeId) => {
      bridgeMap.delete(bridgeId);
    });
  };

  server.on('open', () => {
    debug('Connected as client');
    connectionAttempts = 0;
  });
  
  if (options.address) {
    makeBridge(server);
  } else {
    server.on('connection', makeBridge);
  }

  server.on('error', (error) => {
    closeAllBridges();
    debug(`WebSocket error: ${error}`);
  });

  server.on('close', (event) => {
    debug(`Websocket closed: ${event}`);
    if (options.address) {
      closeAllBridges();
      connectionAttempts++;
      // Gradually increase reconnection interval to prevent
      // overwhelming the server, up to a maximum delay of ~1 minute
      // https://en.wikipedia.org/wiki/Exponential_backoff
      const delay = Math.pow(1.5, Math.min(10, Math.floor(Math.random() * connectionAttempts)));
      debug(`Reconnecting to ${options.address} in ${delay.toFixed(2)} seconds`);
      setTimeout(() => createConnection(options), delay*1000);
    }
  });

  let wsAddr = options.address || `ws://localhost:${options.port}`;
  console.log(`Websocket started on ${wsAddr}`);
}

module.exports = {
  createServer: createServer,
};
