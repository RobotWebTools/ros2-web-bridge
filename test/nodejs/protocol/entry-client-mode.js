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

const assert = require('assert');
const child = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const TEST_PORT = 9091;

var rosbridge = path.resolve(__dirname, '../../../bin/rosbridge.js');

describe('Rosbridge client mode', function() {
  var server;
  var bridgeClient;
  this.timeout(5 * 1000);

  function startBridge() {
    bridgeClient = child.fork(rosbridge, 
      ['--address=ws://localhost:'+TEST_PORT],
      {silent: true}
    );
  }

  after(function() {
    if (bridgeClient) {
      bridgeClient.kill();
    }
    server.close();
  });

  it('can connect to ws server and run command', function() {
    return new Promise((resolve, reject) => {
      server = new WebSocket.Server({port: TEST_PORT}, function() {
        server.on('error', (err) => {
          console.log(err);
        });
        server.on('connection', function(ws) {
          let msg = {
            op: 'publish',
            id: 'publish:/example_topic:1',
            topic: '/example_topic',
            msg: {
              data: 'hello from ros2bridge 0'
            },
            latch: false
          };
          ws.on('message', function(data) {
            var response = JSON.parse(data);
            assert.deepStrictEqual(response.level, 'error');
            ws.close();
            resolve();
          });
          // A long-standing race condition in WS handling of
          // new connections prevents us from sending messages
          // immediately after startup
          // More details at https://github.com/websockets/ws/issues/1393
          setTimeout(() => ws.send(JSON.stringify(msg)), 10);
        });
        startBridge();
      });
    });
  });
});

