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
      title: 'unadvertise_service positive case 1',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: 'add_two_ints'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unadvertise_service positive case 2',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: '/add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: '/add_two_ints'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unadvertise_service negative case 1: invalid service type',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: 42},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise_service field checking case 1: empty service',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: ''},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise_service field checking case 1: with single quote',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: "'add_two_ints'"},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise_service field checking case 1: with double quote',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: '"add_two_ints"'},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise_service field checking case 1: unicode',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      unadvertiseServiceMsg: {op: 'unadvertise_service', service: '\u8bdd\u9898'},
      opCount: 2,
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');
      let count = 0;

      ws.on('open', function() {
        ws.send(JSON.stringify(testData.advertiseServiceMsg));
        count++;
      });
      ws.on('message', function(data) {
        let response = JSON.parse(data);

        if (count === testData.opCount) {
          assert.deepStrictEqual(response.level, testData.finalStatus);
          ws.close();
          done();
        }
        if (count === 1) {
          ws.send(JSON.stringify(testData.unadvertiseServiceMsg));
          count++;
        }
      });
    });
  });
};
