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

/* eslint-disable camelcase */

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
      title: 'call_service positive case 1: full fields',
      callServiceMsg: { op: 'call_service', id: 'call_service_id1', service: 'add_two_ints',
        args: {a: 1, b: 2},
        type: 'example_interfaces/AddTwoInts',
        fragment_size: 1, compression: 'none'
      },
      responseCount: 2,
      opStatus: 'none',
      expectedResponse: {op: 'service_response', result: true, sum: 3}
    },
    {
      title: 'call_service positive case 2: full fields with full service name',
      callServiceMsg: { op: 'call_service', id: 'call_service_id2', service: '/add_two_ints',
        args: {a: 1, b: 2},
        type: 'example_interfaces/AddTwoInts',
        fragment_size: 1, compression: 'none'
      },
      responseCount: 2,
      opStatus: 'none',
      expectedResponse: {op: 'service_response', result: true, sum: 3}
    },    
    {
      title: 'call_service positive case 3: no id field',
      callServiceMsg: { op: 'call_service', service: 'add_two_ints',
        args: {a: 3, b: 4},
        type: 'example_interfaces/AddTwoInts',
        fragment_size: 1, compression: 'none'
      },
      responseCount: 2,
      opStatus: 'none',
      expectedResponse: {op: 'service_response', result: true, sum: 7}
    },
    {
      title: 'call_service positive case 4: no fragment_size field',
      callServiceMsg: { op: 'call_service',  id: 'call_service_id4', service: 'add_two_ints',
        args: {a: 5, b: 6}, type: 'example_interfaces/AddTwoInts', compression: 'none'
      },
      responseCount: 2,
      opStatus: 'none',
      expectedResponse: {op: 'service_response', result: true, sum: 11}
    },
    {
      title: 'call_service positive case 5: no compression field',
      callServiceMsg: { op: 'call_service', id: 'call_service_id5', service: 'add_two_ints',
        args: {a: 7, b: 8}, type: 'example_interfaces/AddTwoInts', fragment_size: 1
      },
      responseCount: 2,
      opStatus: 'none',
      expectedResponse: {op: 'service_response', result: true, sum: 15}
    },
    {
      title: 'call_service negative case 1: args without type information',
      callServiceMsg: { op: 'call_service', id: 'call_service_id6', service: 'add_two_ints',
        args: {a: 9, b: 10}, fragment_size: 1, compression: 'none'},
      responseCount: 1,
      opStatus: 'error'
    },
    {
      title: 'call_service negative case 2: unknown service',
      callServiceMsg: { op: 'call_service', id: 'call_service_id7', service: 'add_two_float',
        args: {a: 11, b: 12}, type: 'example_interfaces/AddTwoInts',
        fragment_size: 1, compression: 'none'
      },
      responseCount: 1,
      opStatus: 'none'
    },
    {
      title: 'call_service field checking: invalid service',
      callServiceMsg: { op: 'call_service', id: 'call_service_id8', service: 42,
        args: {a: 13, b: 14}, type: 'example_interfaces/AddTwoInts',
        fragment_size: 1, compression: 'none'
      },
      responseCount: 1,
      opStatus: 'error'
    },
    {
      title: 'call_service field checking: invalid args',
      callServiceMsg: { op: 'call_service', id: 'call_service_id9', service: 'add_two_ints',
        args: 'invalid arguments', fragment_size: 1, compression: 'none'
      },
      responseCount: 1,
      opStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');

      ws.on('open', function() {
        ws.send(JSON.stringify(testData.callServiceMsg));
      });
      ws.on('message', function(data) {
        console.log(data);
        let response = JSON.parse(data);

        if (response.op === 'status') {
          assert.deepStrictEqual(response.level, testData.opStatus);
          ws.close();
          done();
        }
        if (testData.expectedResponse && response.op === testData.expectedResponse.op) {
          assert.deepStrictEqual(response.result, testData.expectedResponse.result);
          assert.deepEqual(response.values.sum, testData.expectedResponse.sum);
          ws.close();
          done();
        }
      });
    });
  });
};

