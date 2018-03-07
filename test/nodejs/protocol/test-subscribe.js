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
const WebSocket = require('ws');

module.exports = function() {

  let testCasesData = [
    {
      title: 'subscribe positive case 1: full fields',
      msg0: {op: 'subscribe', id: 'subscribe_id1', topic: 'subscribe_topic1', type: 'std_msgs/String',
        throttle_rate: 0, queue_length: 0, fragment_size: 1, compression: 'none'},
      msg1: {op: 'advertise', id: 'advertise_setup_id1', topic: 'subscribe_topic1', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id1', topic: 'subscribe_topic1', msg: {data: 'subscribe operation'}},
    },
    {
      title: 'subscribe positive case 2: no field id',
      msg0: {op: 'subscribe', topic: 'subscribe_topic2', type: 'std_msgs/String',
        throttle_rate: 0, queue_length: 0, fragment_size: 1, compression: 'none'},
      msg1: {op: 'advertise', id: 'advertise_setup_id2', topic: 'subscribe_topic2', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id2', topic: 'subscribe_topic2', msg: {data: 'subscribe operation'}},
    },
    {
      title: 'subscribe positive case 3: no field throttle_rate',
      msg0: {op: 'subscribe', id: 'subscribe_id3', topic: 'subscribe_topic3', type: 'std_msgs/String',
        queue_length: 0, fragment_size: 1, compression: 'none'},
      msg1: {op: 'advertise', id: 'advertise_setup_id3', topic: 'subscribe_topic3', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id3', topic: 'subscribe_topic3', msg: {data: 'subscribe operation'}},
    },
    {
      title: 'subscribe positive case 4: no field queue_length',
      msg0: {op: 'subscribe', id: 'subscribe_id4', topic: 'subscribe_topic4', type: 'std_msgs/String',
        throttle_rate: 0, fragment_size: 1, compression: 'none'},
      msg1: {op: 'advertise', id: 'advertise_setup_id4', topic: 'subscribe_topic4', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id4', topic: 'subscribe_topic4', msg: {data: 'subscribe operation'}},
    },
    {
      title: 'subscribe positive case 5: no field fragment_size',
      msg0: {op: 'subscribe', id: 'advertise_id5', topic: 'subscribe_topic5', type: 'std_msgs/String',
        throttle_rate: 0, queue_length: 0, compression: 'none'},
      msg1: {op: 'advertise', id: 'advertise_setup_id5', topic: 'subscribe_topic5', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id5', topic: 'subscribe_topic5', msg: {data: 'subscribe operation'}},
    },
    {
      title: 'subscribe positive case 6: no field compression',
      msg0: {op: 'subscribe', id: 'subscribe_id6', topic: 'subscribe_topic6', type: 'std_msgs/String',
        throttle_rate: 0, queue_length: 0, fragment_size: 1},
      msg1: {op: 'advertise', id: 'advertise_setup_id6', topic: 'subscribe_topic6', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_id6', topic: 'subscribe_topic6', msg: {data: 'subscribe operation'}},
    }
  ];
  let testResults = {respCount: 4, finalStatus: 'none', data: 'subscribe operation'};

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        let counter = 0;

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.msg0));
          counter++;
        });

        ws.on('message', function(data) {
          let response = JSON.parse(data);
          if (counter === testResults.respCount) {
            assert.deepStrictEqual(response.msg.data, testResults.data);
            ws.close();
            resolve();
          }
          if (counter === 3) {
            counter++;
          }
          if (counter === 2) {
            ws.send(JSON.stringify(testData.msg2));
            counter++;
          }
          if (counter === 1) {
            assert.deepStrictEqual(response.level, testResults.finalStatus);
            ws.send(JSON.stringify(testData.msg1));
            counter++;
          }
        });
      });
    });
  });

  let testCasesNegData = [
    {
      title: 'subscribe negative case 1: topic not exist',
      subscribeMsg: {op: 'subscribe', id: 'subscribe_neg_id1', topic: 'subscribe_neg_topic1', type: 'std_msgs/Foo'},
      finalStatus: 'error'
    },
    {
      // Incompatible with rosbridge v2 protocol
      title: 'subscribe negative case 2: type cannot be inferred',
      subscribeMsg: {op: 'subscribe', id: 'subscribe_neg_id2', topic: 'subscribe_neg_topic2'},
      finalStatus: 'error'
    },
    {
      title: 'subscribe field checking case 1: invalid topic',
      subscribeMsg: {op: 'subscribe', id: 'subscribe_neg_id3', topic: 42, type: 'std_msgs/String'},
      finalStatus: 'error'
    },
    {
      title: 'subscribe field checking case 1: invalid type',
      subscribeMsg: {op: 'subscribe', id: 'subscribe_neg_id3', topic: 'subscribe_neg_topic4', type: true},
      finalStatus: 'error'
    }
  ];

  testCasesNegData.forEach((testNegData, index) => {
    it(testNegData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');

        ws.on('open', function() {
          ws.send(JSON.stringify(testNegData.subscribeMsg));
        });

        ws.on('message', function(data) {
          let response = JSON.parse(data);
          assert.deepStrictEqual(response.level, testNegData.finalStatus);
          ws.close();
          resolve();
        });
      });
    });
  });
};
