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
const WebSocket = require('ws');

module.exports = function() {
  it('Protocol testing general workflow', function() {
    return new Promise((resolve, reject) => {
      let ws = new WebSocket('ws://127.0.0.1:9090');
      ws.on('open', function() {
        let msg = {
          op: 'publish',
          id: 'publish:/example_topic:1',
          topic: '/example_topic',
          msg: {
            data: 'hello from ros2bridge 0'
          },
          latch: false
        };
        ws.send(JSON.stringify(msg));
      });
      ws.on('message', function(data) {
        var response = JSON.parse(data);
        assert.deepStrictEqual(response.level, 'error');
        ws.close();
        resolve();
      });
    });
  });
};
