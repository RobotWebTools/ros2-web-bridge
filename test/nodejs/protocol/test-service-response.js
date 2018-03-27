// Copyright (c) 2017 Intel Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const assert = require('assert');
const rclnodejs = require('rclnodejs');
const WebSocket = require('ws');

module.exports = function() {
  before(function() {
    return rclnodejs.init().then(() => {
      var node = rclnodejs.createNode('service');
      var wsservice = node.createService('example_interfaces/srv/AddTwoInts', 'add_two_ints',
        (request, response) => {
          let result = response.template;
          result.sum = request.a + request.b;
          response.send(result);
        });
      rclnodejs.spin(node);
    });
  });

  after(function() {
    rclnodejs.shutdown();
  });

  let testCasesData = [
    {
      title: 'service_response positive case 1',
      serviceResponseMsg: {
        op: 'service_response', id: 'service_response_id1', service: '/add_two_ints',
        values: {sum: 1}, result: true},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response positive case 2',
      serviceResponseMsg: {
        op: 'service_response', id: 'service_response_id2', service: 'add_two_ints',
        values: {sum: 2}, result: true},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response positive case 3',
      serviceResponseMsg: {
        op: 'service_response', service: 'add_two_ints', values: {sum: 3}, result: true},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response positive case 4',
      serviceResponseMsg: {
        op: 'service_response', id: 'service_response_id4', service: 'add_two_ints', result: true},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response positive case 5',
      serviceResponseMsg: {
        op: 'service_response', service: 'add_two_ints', result: true},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response positive case 6',
      serviceResponseMsg: {
        op: 'service_response', service: '/add_two_ints', result: true},
      opCount: 1,
      finalStatus: 'none'
    },    
    {
      title: 'service_response negative case 1',
      serviceResponseMsg: {
        op: 'service_response', values: {sum: 6}, result: false},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'service_response negative case 2',
      serviceResponseMsg: {
        op: 'service_response', service: 'add_two_ints', values: {sum: 7}},
      opCount: 1,
      finalStatus: 'none'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');
      let count = 0;

      ws.on('open', function() {
        ws.send(JSON.stringify(testData.serviceResponseMsg));
        count++;
      });
      ws.on('message', function(data) {
        // console.log(`${count}`, data);
        let response = JSON.parse(data);

        if (testData.opCount === 1) {
          assert.deepStrictEqual(response.level, testData.finalStatus);
          ws.close();
          done();
        }
        count++;
      });
    });
  });
};
