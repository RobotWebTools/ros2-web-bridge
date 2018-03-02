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
      title: 'publish message with type: Bool',
      advertiseMsg: {op: 'advertise', id: 'advertise_bool_setup', topic: 'publish_bool_topic', type: 'std_msgs/Bool'},
      publishMsg: {op: 'publish', id: 'publish_bool', topic: 'publish_bool_topic', msg: {data: true}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Byte',
      advertiseMsg: {op: 'advertise', id: 'advertise_byte_setup', topic: 'publish_byte_topic', type: 'std_msgs/Byte'},
      publishMsg: {op: 'publish', id: 'publish_byte', topic: 'publish_byte_topic', msg: {data: 0xff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Char',
      advertiseMsg: {op: 'advertise', id: 'advertise_char_setup', topic: 'publish_char_topic', type: 'std_msgs/Char'},
      publishMsg: {op: 'publish', id: 'publish_char', topic: 'publish_char_topic', msg: {data: 'A'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: String',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_string_setup', topic: 'publish_string_topic', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_string', topic: 'publish_string_topic', msg: {data: 'hello world!'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Int8',
      advertiseMsg: {op: 'advertise', id: 'advertise_int8_setup', topic: 'publish_int8_topic', type: 'std_msgs/Int8'},
      publishMsg: {op: 'publish', id: 'publish_int8', topic: 'publish_int8_topic', msg: {data: 0x7f}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: UInt8',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint8_setup', topic: 'publish_uint8_topic', type: 'std_msgs/UInt8'},
      publishMsg: {op: 'publish', id: 'publish_uint8', topic: 'publish_uint8_topic', msg: {data: 0xff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Int16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int16_setup', topic: 'publish_int16_topic', type: 'std_msgs/Int16'},
      publishMsg: {op: 'publish', id: 'publish_int16', topic: 'publish_int16_topic', msg: {data: 0x7fff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: UInt16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint16_setup', topic: 'publish_uint16_topic', type: 'std_msgs/UInt16'},
      publishMsg: {op: 'publish', id: 'publish_uint16', topic: 'publish_uint16_topic', msg: {data: 0xffff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Int32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int32_setup', topic: 'publish_int32_topic', type: 'std_msgs/Int32'},
      publishMsg: {op: 'publish', id: 'publish_int32', topic: 'publish_int32_topic', msg: {data: 0x7fffffff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: UInt32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint32_setup', topic: 'publish_uint32_topic', type: 'std_msgs/UInt32'},
      publishMsg: {op: 'publish', id: 'publish_uint32', topic: 'publish_uint32_topic', msg: {data: 0xffffffff}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Int64', 
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int64_setup', topic: 'publish_int64_topic', type: 'std_msgs/Int64'},
      publishMsg: {
        op: 'publish', id: 'publish_int64', topic: 'publish_int64_topic', msg: {data: Number.MIN_SAFE_INTEGER}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: UInt64',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint64_setup', topic: 'publish_uint64_topic', type: 'std_msgs/UInt64'},
      publishMsg: {
        op: 'publish', id: 'publish_uint64', topic: 'publish_uint64_topic', msg: {data: Number.MAX_SAFE_INTEGER}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Float32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_float32_setup', topic: 'publish_float32_topic', type: 'std_msgs/Float32'},
      publishMsg: {op: 'publish', id: 'publish_float32', topic: 'publish_float32_topic', msg: {data: 3.14}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Float64',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_float64_setup', topic: 'publish_float64_topic', type: 'std_msgs/Float64'},
      publishMsg: {op: 'publish', id: 'publish_float64', topic: 'publish_float64_topic', msg: {data: Number.MAX_VALUE}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: ColorRGBA',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_colorrgba_setup', topic: 'publish_colorrgba_topic',
        type: 'std_msgs/ColorRGBA'},
      publishMsg: {
        op: 'publish', id: 'publish_colorrgba', topic: 'publish_colorrgba_topic',
        msg: {a: 0.5, r: 255, g: 255, b: 255}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: Header',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_header_setup', topic: 'publish_header_topic', type: 'std_msgs/Header'},
      publishMsg: {
        op: 'publish', id: 'publish_header', topic: 'publish_header_topic',
        /* eslint-disable camelcase */
        msg: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'}},
      opCount: 2,
      finalStatus: 'none'
    },
    {
      title: 'publish message with type: JointState',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_jointstate_setup', topic: 'publish_jointstate_topic',
        type: 'sensor_msgs/JointState'},
      publishMsg: {
        op: 'publish', id: 'publish_jointstate', topic: 'publish_jointstate_topic',
        msg: {header: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'}, 
          name: ['Tom', 'Jerry'], position: [1, 2], velocity: [2, 3]},
      },
      opCount: 2,
      finalStatus: 'none'
    }
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        let counter = 0;

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.advertiseMsg));
          counter++;
        });
        ws.on('message', function(data) {
          let response = JSON.parse(data);
          assert.deepStrictEqual(response.level, testData.finalStatus);

          if (counter === testData.opCount) {
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
