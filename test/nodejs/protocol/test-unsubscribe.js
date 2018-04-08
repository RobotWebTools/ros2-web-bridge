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
      title: 'unsubscribe positive case 1',
      subscribeMsg1: {op: 'subscribe', id: 'subscribe_setup_id1', topic: 'unsubscribe_topic1', type: 'std_msgs/String'},
      unsubscribeMsg: {op: 'unsubscribe', id: 'subscribe_setup_id1', topic: 'unsubscribe_topic1'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unsubscribe positive case 2',
      subscribeMsg1: {op: 'subscribe', id: 'subscribe_setup_id2', topic: 'unsubscribe_topic2', type: 'std_msgs/Bool'},
      subscribeMsg2: {op: 'subscribe', id: 'subscribe_setup_id3', topic: 'unsubscribe_topic2', type: 'std_msgs/Bool'},
      unsubscribeMsg: {op: 'unsubscribe', topic: 'unsubscribe_topic2'},
      opCount: 3,
      finalStatus: 'none'
    },
    {
      title: 'unbscribe negative case 1: unknown topic',
      subscribeMsg1: {op: 'subscribe', id: 'subscribe_setup_id4', topic: 'unsubscribe_topic4', type: 'std_msgs/Byte'},
      unsubscribeMsg: {op: 'unsubscribe', id: 'subscribe_setup_id4', topic: 'unsubscribe_topic4x'},
      opCount: 2,
      finalStatus: 'warning'
    },
    {
      title: 'unsubscribe negative case 2: unknown id',
      subscribeMsg1: {op: 'subscribe', id: 'subscribe_setup_id5', topic: 'unsubscribe_topic5', type: 'std_msgs/Char'},
      unsubscribeMsg: {op: 'unsubscribe', id: 'subscribe_setup_id5x', topic: 'unsubscribe_topic5'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unsubscribe field checking case 1: invalid id',
      subscribeMsg1: {op: 'subscribe', id: 'subscribe_setup_id6', topic: 'subscribe_topic6', type: 'std_msgs/Header'},
      unsubscribeMsg: {op: 'unsubscribe', id: 42, topic: 'subscribe_topic6'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unsubscribe field checking case 2: invalid topic',
      subscribeMsg1: {
        op: 'subscribe', id: 'subscribe_setup_id7', topic: 'subscribe_topic7', type: 'std_msgs/ColorRGBA'},
      unsubscribeMsg: {op: 'unsubscribe', id: 'subscribe_setup_id7', topic: 42},
      opCount: 2,
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        let counter = 0;

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.subscribeMsg1));
          counter++;
        });
        ws.on('message', function(data) {
          let response = JSON.parse(data);

          if (counter === testData.opCount) {
            assert.deepStrictEqual(response.level, testData.finalStatus);
            ws.close();
            resolve();
          }
          if (counter === 2 && testData.opCount > 2) {
            ws.send(JSON.stringify(testData.unsubscribeMsg));
            counter++;
          }
          if (counter === 1) {
            if (testData.opCount === 2) {
              ws.send(JSON.stringify(testData.unsubscribeMsg));
            } else if (testData.opCount === 3) {
              ws.send(JSON.stringify(testData.subscribeMsg2));
            }            
            counter++;
          }
        });
      });
    });
  });
};
