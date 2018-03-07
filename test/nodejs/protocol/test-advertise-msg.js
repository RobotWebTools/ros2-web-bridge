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
  let finalStatus = 'none';
  let testCasesData = [
    {
      title: 'advertise topic with message type: Bool',
      advertiseMsg: {op: 'advertise', id: 'advertise_bool', topic: 'advertise_bool_topic', type: 'std_msgs/Bool'}
    },
    {
      title: 'advertise topic with message type: Byte',
      advertiseMsg: {op: 'advertise', id: 'advertise_byte', topic: 'advertise_byte_topic', type: 'std_msgs/Byte'}
    },
    {
      title: 'advertise topic with message type: Char',
      advertiseMsg: {op: 'advertise', id: 'advertise_char', topic: 'advertise_char_topic', type: 'std_msgs/Char'}
    },
    {
      title: 'advertise topic with message type: String',
      advertiseMsg: {op: 'advertise', id: 'advertise_string', topic: 'advertise_string_topic', type: 'std_msgs/String'}
    },
    {
      title: 'advertise topic with message type: Int8',
      advertiseMsg: {op: 'advertise', id: 'advertise_int8', topic: 'advertise_int8_topic', type: 'std_msgs/Int8'}
    },
    {
      title: 'advertise topic with message type: UInt8',
      advertiseMsg: {op: 'advertise', id: 'advertise_uint8', topic: 'advertise_uint8_topic', type: 'std_msgs/UInt8'}
    },
    {
      title: 'advertise topic with message type: Int16',
      advertiseMsg: {op: 'advertise', id: 'advertise_int16', topic: 'advertise_int16_topic', type: 'std_msgs/Int16'}
    },
    {
      title: 'advertise topic with message type: UInt16',
      advertiseMsg: {op: 'advertise', id: 'advertise_uint16', topic: 'advertise_uint16_topic', type: 'std_msgs/UInt16'}
    },
    {
      title: 'advertise topic with message type: Int32',
      advertiseMsg: {op: 'advertise', id: 'advertise_int32', topic: 'advertise_int32_topic', type: 'std_msgs/Int32'}
    },
    {
      title: 'advertise topic with message type: UInt32',
      advertiseMsg: {op: 'advertise', id: 'advertise_uint32', topic: 'advertise_uint32_topic', type: 'std_msgs/UInt32'}
    },
    {
      title: 'advertise topic with message type: Int64',
      advertiseMsg: {op: 'advertise', id: 'advertise_int64', topic: 'advertise_int64_topic', type: 'std_msgs/Int64'}
    },
    {
      title: 'advertise topic with message type: UInt64',
      advertiseMsg: {op: 'advertise', id: 'advertise_uint64', topic: 'advertise_uint64_topic', type: 'std_msgs/UInt64'}
    },
    {
      title: 'advertise topic with message type: Float32',
      advertiseMsg:
        {op: 'advertise', id: 'advertise_float32', topic: 'advertise_float32_topic', type: 'std_msgs/Float32'}
    },
    {
      title: 'advertise topic with message type: Float64',
      advertiseMsg:
        {op: 'advertise', id: 'advertise_float64', topic: 'advertise_float64_topic', type: 'std_msgs/Float64'}
    },
    {
      title: 'advertise topic with message type: ColorRGBA',
      advertiseMsg:
        {op: 'advertise', id: 'advertise_colorrgba', topic: 'advertise_colorrgba_topic', type: 'std_msgs/ColorRGBA'}
    },
    {
      title: 'advertise topic with message type: Header',
      advertiseMsg: {op: 'advertise', id: 'advertise_header', topic: 'advertise_header_topic', type: 'std_msgs/Header'}
    },
    {
      title: 'advertise topic with message type: JointState',
      advertiseMsg:
      { op: 'advertise', id: 'advertise_jointstate', 
        topic: 'advertise_jointstate_topic', type: 'sensor_msgs/JointState'}
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.advertiseMsg));
        });
        ws.on('message', function(data) {
          let response = JSON.parse(data);
          assert.deepStrictEqual(response.level, finalStatus);
          ws.close();
          resolve();
        });
      });
    });
  });
};
