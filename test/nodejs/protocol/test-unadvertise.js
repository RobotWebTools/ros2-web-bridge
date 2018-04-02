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
  let testCasesData = [
    {
      title: 'unadvertise positive case 1',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup1', topic: 'unadvertise_topic1', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id1', topic: 'unadvertise_topic1'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unadvertise positive case 2',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup2', topic: 'unadvertise_topic2', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id2', topic: 'unadvertise_topic2'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unadvertise positive case 3: ROS2 message type format',
      advertiseMsg: {op: 'advertise', id: 'advertise_ros2_msg_setup', topic: 'unadvertise_ros2_msg_topic',
        type: 'std_msgs/msg/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_ros2_msg_setup', topic: 'unadvertise_ros2_msg_topic'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'unadvertise negative case 1',
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id3', topic: 'unadvertise_topic3'},
      opCount: 1,
      finalStatus: 'warning'
    },
    {
      title: 'unadvertise field checking case 1: invalid topic',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup4', topic: 'unadvertise_topic4', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id4', topic: true},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise field checking case 2: topic cannot be empty',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup5', topic: 'unadvertise_topic5', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id5', topic: ''},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise field checking case 3: topic cannot contain single quote',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup6', topic: 'unadvertise_topic6', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id6', topic: "'single_advertise_topic'"},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise field checking case 3: topic cannot contain double quotes',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup7', topic: 'unadvertise_topic7', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id7', topic: '"double_advertise_topic"'},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'unadvertise field checking case 3: topic does not support unicode',
      advertiseMsg: {op: 'advertise', id: 'advertise_setup8', topic: 'unadvertise_topic8', type: 'std_msgs/String'},
      unadvertiseMsg: {op: 'unadvertise', id: 'unadvertise_id8', topic: '\u8bdd\u9898'},
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
          if (testData.advertiseMsg !== undefined) {
            ws.send(JSON.stringify(testData.advertiseMsg));
          } else {
            ws.send(JSON.stringify(testData.unadvertiseMsg));
          }  
          counter++;
        });
        ws.on('message', function(data) {
          if (counter === testData.opCount) {
            let response = JSON.parse(data);
            assert.deepStrictEqual(response.level, testData.finalStatus);
            counter++;
            ws.close();
            resolve();
          }
          if (counter === 1) {
            ws.send(JSON.stringify(testData.unadvertiseMsg));
            counter++;
          }
        });
      });
    });
  });
};
