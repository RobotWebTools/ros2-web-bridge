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

var rosbridge = path.resolve(__dirname, '../../../bin/rosbridge.js');

describe('ROS2 protocol testing', function () {
  var webSocketServer;
  this.timeout(60 * 1000);

  before(function(done) {
    webSocketServer = child.fork(rosbridge, {silent: true});
    webSocketServer.stdout.on('data', function(data) {
      done();
    });
  });

  after(function() {
    webSocketServer.kill('SIGINT');
  });

  it('Protocol testing workflow', function() {
    return new Promise((resolve, reject) => {
      var ws = new WebSocket('ws://127.0.0.1:9090');
      ws.on('open', function() {
        const msg = '{"op":"publish", \
                      "id":"publish:/example_topic:2", \
                      "topic":"/example_topic", \
                      "msg":{"data":"hello from ros2bridge 0"}, \
                      "latch":false}';
        ws.send(msg);
      });
      ws.on('message', function(data) {
        var response = JSON.parse(data);
        assert.deepStrictEqual(response['op'], 'set_level');
        assert.deepStrictEqual(response['level'], 'error');
        resolve();
      });
    });
  });  
});
