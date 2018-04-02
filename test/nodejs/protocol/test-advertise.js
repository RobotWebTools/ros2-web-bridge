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
      title: 'advertise positive case 1',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id1', topic: 'advertise_topic1', type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'advertise positive case 2',
      advertiseMsg1: {op: 'advertise', topic: 'advertise_topic2', type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'none'
    },
    {
      title: 'advertise positive case 3',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id3', topic: 'advertise_topic3', type: 'std_msgs/String'},
      advertiseMsg2: {op: 'advertise', id: 'advertise_id4', topic: 'advertise_topic3', type: 'std_msgs/String'},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'advertise positive case 4: ROS2 message type format',
      advertiseMsg1: {
        op: 'advertise', id: 'advertise_ros2_msg', topic: 'advertise_ros2_msg_topic', type: 'std_msgs/msg/Byte'},
      opCount: 1,
      finalStatus: 'none'
    },    
    {
      title: 'advertise negative case 1',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id5', topic: 'advertise_topic5', type: 'std_msgs/String'},
      advertiseMsg2: {op: 'advertise', id: 'advertise_id6', topic: 'advertise_topic5', type: 'std_msgs/Char'},
      opCount: 2,
      finalStatus: 'error'
    },
    {
      title: 'advertise negative case 2',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id7', topic: 'advertise_topic7', type: 'std_msgs/Foo'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 1: invalid topic',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id8', topic: 42, type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 2: invalid type',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id9', topic: 'advertise_topic9', type: true},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 3: topic cannot be empty',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id10', topic: '', type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 4: topic cannot contain single quote',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id11', topic: "'single_advertise_topic11'",
        type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 5: topic cannot contain double quotes',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id12', topic: '"double_advertise_topic12"',
        type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'error'
    },
    {
      title: 'advertise field checking case 6: topic does not support unicode',
      advertiseMsg1: {op: 'advertise', id: 'advertise_id12', topic: '\u8bdd\u9898',
        type: 'std_msgs/String'},
      opCount: 1,
      finalStatus: 'error'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        let counter = 0;

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.advertiseMsg1));
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
            if (testData.advertiseMsg2 !== undefined) {
              ws.send(JSON.stringify(testData.advertiseMsg2));
            }   
            counter++;
          }
        });
      });
    });
  });
};
