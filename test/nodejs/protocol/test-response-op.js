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
  before(function() {
    return new Promise((resolve, reject) => {
      rclnodejs.init().then(() => {
        var node = rclnodejs.createNode('service');
        var wsservice = node.createService('example_interfaces/srv/AddTwoInts', 'add_two_ints_resp',
          (request, response) => {
            let result = response.template;
            result.sum = request.a + request.b;
            response.send(result);
          });
        rclnodejs.spin(node);
        setTimeout(() => {
          resolve();
        }, 2000);
      });
    });
  });

  after(function() {
    rclnodejs.shutdown();
  });

  let testCasesData = [
    {
      title: 'Common responses should contain set_level field',
      msg: {
        op: 'advertise', id: 'advertise_topic_resp_id1', topic: 'advertise_topic_resp', type: 'std_msgs/String'},
      opType: 'common',
      respCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response status field checking',
      msg: {op: 'call_service', service: 'add_two_ints_resp', id: 'call_service_id1',
        args: {a: 1, b: 2}, type: 'example_interfaces/AddTwoInts'},
      opType: 'service',
      respCount: 2,
      expectedResponse: {op: 'service_response',  result: true, sum: 3}
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');
      let count = 0;
      ws.on('open', function() {
        ws.send(JSON.stringify(testData.msg));
        count++;
      });
      ws.on('message', function(data) {
        let response = JSON.parse(data);
        if (testData.opType === 'common' && testData.respCount === 1) {
          assert.deepStrictEqual(response.op, 'set_level');
          assert.deepStrictEqual(typeof response.level, 'string');
          ws.close();
          done();
        }

        if (testData.opType === 'service' && response.op === testData.expectedResponse.op) {
          assert.deepStrictEqual(response.op, 'service_response');
          assert.deepStrictEqual(typeof response.service, 'string');
          assert.deepStrictEqual(typeof response.result, 'boolean');
          ws.close();
          done();
        }
      });
    });
  });
};
