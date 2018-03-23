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
      title: 'advertise_service positive case 1',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: 'add_two_ints'},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'advertise_service positive case 2',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: '/add_two_ints'},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'advertise_service positive case 3: ROS2 interface type format',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/srv/AddTwoInts', service: 'add_two_ints'},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'advertise_service negative case 1: unknown type',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/Foo', service: 'add_two_ints'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: invalid type',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 42, service: 'add_two_ints'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: invalid service',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: true},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: empty service',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: ''},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: invalid service: with single quote',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: "'add_two_ints'"},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: invalid service: with double quotes',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: '"add_two_ints"'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise_service field checking: invalid service: unicode',
      advertiseServiceMsg: {
        op: 'advertise_service', type: 'example_interfaces/AddTwoInts', service: '\u8bdd\u9898'},
      opCount: 1,
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function(done) {
      let ws = new WebSocket('ws://127.0.0.1:9090');

      ws.on('open', function() {
        ws.send(JSON.stringify(testData.advertiseServiceMsg));
      });
      ws.on('message', function(data) {
        let response = JSON.parse(data);
        assert.deepStrictEqual(response.level, testData.finalStatus);
        ws.close();
        done();
      });
    });
  });
};
