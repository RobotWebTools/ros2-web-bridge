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
const rclnodejs = require('rclnodejs');
const WebSocket = require('ws');

module.exports = function() {

  let testCasesData = [
    {
      title: 'Negative operation case 1: unknown operation',
      msg: { op: 'foo'},
      finalStatus: 'error'
    },
    {
      title: 'Negative operation case 2: no necessary operation',
      msg: { op: 'advertise', bar: 'bar'},
      finalStatus: 'error'
    },
    {
      title: 'Negative operation case 3: no op field',
      msg: { baz: 'baz'},
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');
      let counter = 0;

      ws.on('open', function() {
        ws.send(JSON.stringify(testData.msg));
      });
      ws.on('message', function(data) {
        let response = JSON.parse(data);

        assert.deepStrictEqual(response.level, 'error');
        ws.close();
        done();
      });
    });
  });
};
