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
const WebSocket = require('ws');

module.exports = function() {
  let testCasesData = [
    { 
      title: 'publish positive case 1',
      advertiseMsg: {op: 'advertise', id: 'publish_advertise_setup1', topic: 'publish_topic1', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_id1', topic: 'publish_topic1', msg: {data: 'hello world!'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish positive case 2',
      advertiseMsg: {op: 'advertise', topic: 'publish_topic2', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', topic: 'publish_topic2', msg: {data: 'hello world!'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish positive case 3: ROS2 message type format',
      advertiseMsg: {op: 'advertise', topic: 'publish_ros2_msg_topic', type: 'std_msgs/msg/String'},
      publishMsg: {op: 'publish', topic: 'publish_ros2_msg_topic', msg: {data: 'hello world!'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish negative case 1: topic not exist',
      publishMsg: {op: 'publish', id: 'publish_id3', topic: 'publish_topic3', msg: {data: 'Hello World!'}},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'publish negative case 2: inconsistent message type',
      advertiseMsg:
        {op: 'advertise', id: 'publish_advertise_setup4', topic: 'publish_topic4', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_id4', topic: 'publish_topic4', msg: {data: 42}},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'publish negative case 3: msg is subset of type',
      advertiseMsg: {op: 'advertise', id: 'publish_advertise_setup5', topic: 'publish_topic5', type: 'std_msgs/Header'},
      publishMsg: {op: 'publish', id: 'publish_id5', topic: 'publish_topic5', msg: {
        stamp: {sec: 123456, nanosec: 789}
      }},
      opCount: 2,
      // incompatible with the spec
      finalStatus: 'error'
    },
    {
      title: 'publish field checking case 1: invalid id',
      advertiseMsg: 
        {op: 'advertise', id: 'publish_advertise_setup6', topic: 'publish_topic6', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 42, topic: 'publish_topic6', msg: {data: 'Hello World!'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish field checking case 1: invalid topic',
      advertiseMsg: {op: 'advertise', id: 'publish_advertise_setup7', topic: 'publish_topic7', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_id7', topic: 42, msg: {data: 'Hello World!'}},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'publish field checking case 2: msg is not a JSON object',
      advertiseMsg: 
        { op: 'advertise', id: 'publish_advertise_setup8', topic: 'publish_topic8', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_id8', topic: 'publish_topic8', msg: 42},
      opCount: 2,
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        var counter = 0;

        ws.on('open', function() {
          if (testData.advertiseMsg !== undefined) {
            ws.send(JSON.stringify(testData.advertiseMsg));            
          }
          counter++;
          if (testData.opCount === 1) {
            ws.send(JSON.stringify(testData.publishMsg));
            counter++;
          }
        });
        ws.on('message', function(data) {
          if (counter === 2) {
            let response = JSON.parse(data);
            assert.deepStrictEqual(response.level, testData.finalStatus);
            ws.close();
            resolve();
          }
          if (counter === 1) {
            ws.send(JSON.stringify(testData.publishMsg));
            counter++;
          }
        });
      });
    });
  });
};
