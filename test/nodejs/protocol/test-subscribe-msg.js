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
      title: 'subscribe message with type: Bool',
      msg0: {op: 'subscribe', id: 'subscribe_bool', topic: 'subscribe_bool_topic', type: 'std_msgs/Bool'},
      msg1: {op: 'advertise', id: 'advertise_setup_bool', topic: 'subscribe_bool_topic', type: 'std_msgs/Bool'},
      msg2: {op: 'publish', id: 'publish_setup_bool', topic: 'subscribe_bool_topic', msg: {data: true}},
      expectedData: true
    },
    {
      title: 'subscribe message with type: Byte',
      msg0: {op: 'subscribe', id: 'subscribe_byte', topic: 'subscribe_byte_topic', type: 'std_msgs/Byte'},
      msg1: {op: 'advertise', id: 'advertise_setup_byte', topic: 'subscribe_byte_topic', type: 'std_msgs/Byte'},
      msg2: {op: 'publish', id: 'publish_setup_byte', topic: 'subscribe_byte_topic', msg: {data: 0xff}},
      expectedData: 255
    },
    {
      title: 'subscribe message with type: Char',
      msg0: {op: 'subscribe', id: 'subscribe_char', topic: 'subscribe_char_topic', type: 'std_msgs/Char'},
      msg1: {op: 'advertise', id: 'advertise_setup_char', topic: 'subscribe_char_topic', type: 'std_msgs/Char'},
      msg2: {op: 'publish', id: 'publish_setup_char', topic: 'subscribe_char_topic', msg: {data: 'A'}},
      expectedData: 65
    },
    {
      title: 'subscribe message with type: String',
      msg0: {op: 'subscribe', id: 'subscribe_string', topic: 'subscribe_string_topic', type: 'std_msgs/String'},
      msg1: {op: 'advertise', id: 'advertise_setup_string', topic: 'subscribe_string_topic', type: 'std_msgs/String'},
      msg2: {op: 'publish', id: 'publish_setup_string', topic: 'subscribe_string_topic', msg: {data: 'hello world!'}},
      expectedData: 'hello world!'
    },
    {
      title: 'subscribe message with type: Int8',
      msg0: {op: 'subscribe', id: 'advertise_int8', topic: 'subscribe_int8_topic', type: 'std_msgs/Int8'},
      msg1: {op: 'advertise', id: 'advertise_setup_int8', topic: 'subscribe_int8_topic', type: 'std_msgs/Int8'},
      msg2: {op: 'publish', id: 'publish_setup_int8', topic: 'subscribe_int8_topic', msg: {data: -0x80}},
      expectedData: -128
    },
    {
      title: 'subscribe message with type: UInt8',
      msg0: {op: 'subscribe', id: 'subscribe_uint8', topic: 'subscribe_uint8_topic', type: 'std_msgs/UInt8'},
      msg1: {op: 'advertise', id: 'advertise_setup_uint8', topic: 'subscribe_uint8_topic', type: 'std_msgs/UInt8'},
      msg2: {op: 'publish', id: 'publish_setup_uint8', topic: 'subscribe_uint8_topic', msg: {data: 0xff}},
      expectedData: 255
    },
    {
      title: 'subscribe message with type: Int16',
      msg0: {op: 'subscribe', id: 'subscribe_int16', topic: 'subscribe_int16_topic', type: 'std_msgs/Int16'},
      msg1: {op: 'advertise', id: 'advertise_setup_int16', topic: 'subscribe_int16_topic', type: 'std_msgs/Int16'},
      msg2: {op: 'publish', id: 'publish_setup_int16', topic: 'subscribe_int16_topic', msg: {data: -0x8000}},
      expectedData: -0x8000
    },
    {
      title: 'subscribe message with type: UInt16',
      msg0: {op: 'subscribe', id: 'subscribe_uint16', topic: 'subscribe_uint16_topic', type: 'std_msgs/UInt16'},
      msg1: {op: 'advertise', id: 'advertise_setup_uint16', topic: 'subscribe_uint16_topic', type: 'std_msgs/UInt16'},
      msg2: {op: 'publish', id: 'publish_setup_uint16', topic: 'subscribe_uint16_topic', msg: {data: 0xffff}},
      expectedData: 0xffff
    },
    {
      title: 'subscribe message with type: Int32',
      msg0: {op: 'subscribe', id: 'subscribe_int32', topic: 'subscribe_int32_topic', type: 'std_msgs/Int32'},
      msg1: {op: 'advertise', id: 'advertise_setup_int32', topic: 'subscribe_int32_topic', type: 'std_msgs/Int32'},
      msg2: {op: 'publish', id: 'publish_setup_int32', topic: 'subscribe_int32_topic', msg: {data: -0x80000000}},
      expectedData: -0x80000000
    },
    {
      title: 'subscribe message with type: UInt32',
      msg0: {op: 'subscribe', id: 'subscribe_uint32', topic: 'subscribe_uint32_topic', type: 'std_msgs/UInt32'},
      msg1: {op: 'advertise', id: 'advertise_setup_uint32', topic: 'subscribe_uint32_topic', type: 'std_msgs/UInt32'},
      msg2: {op: 'publish', id: 'publish_setup_uint32', topic: 'subscribe_uint32_topic', msg: {data: 0xffffffff}},
      expectedData: 0xffffffff
    },
    {
      title: 'subscribe message with type: Int64',
      msg0: {op: 'subscribe', id: 'subscribe_int64', topic: 'subscribe_int64_topic', type: 'std_msgs/Int64'},
      msg1: {op: 'advertise', id: 'advertise_setup_int64', topic: 'subscribe_int64_topic', type: 'std_msgs/Int64'},
      msg2: {
        op: 'publish', id: 'publish_setup_int64', topic: 'subscribe_int64_topic',
        msg: {data: Number.MIN_SAFE_INTEGER}},
      expectedData: Number.MIN_SAFE_INTEGER
    },
    {
      title: 'subscribe message with type: UInt64',
      msg0: {op: 'subscribe', id: 'subscribe_uint64', topic: 'subscribe_uint64_topic', type: 'std_msgs/UInt64'},
      msg1: {op: 'advertise', id: 'advertise_setup_uint64', topic: 'subscribe_uint64_topic', type: 'std_msgs/UInt64'},
      msg2: {
        op: 'publish', id: 'publish_setup_uint64', topic: 'subscribe_uint64_topic',
        msg: {data: Number.MAX_SAFE_INTEGER}
      },
      expectedData: Number.MAX_SAFE_INTEGER
    },
    {
      title: 'subscribe message with type: Float32',
      msg0: {op: 'subscribe', id: 'subscribe_float32', topic: 'subscribe_float32_topic', type: 'std_msgs/Float32'},
      msg1: {
        op: 'advertise', id: 'advertise_setup_float32', topic: 'subscribe_float32_topic', type: 'std_msgs/Float32'},
      msg2: {op: 'publish', id: 'publish_setup_float32', topic: 'subscribe_float32_topic', msg: {data: 3.14}},
      msgType: 'float',
      expectedData: 3.14,
      precision: 0.01
    },
    {
      title: 'subscribe message with type: Float64',
      msg0: {op: 'subscribe', id: 'subscribe_float64', topic: 'subscribe_float64_topic', type: 'std_msgs/Float64'},
      msg1: {
        op: 'advertise', id: 'advertise_setup_float64', topic: 'subscribe_float64_topic', type: 'std_msgs/Float64'},
      msg2: {op: 'publish', id: 'publish_setup_float64', topic: 'subscribe_float64_topic', msg: {data: 3.1415926}},
      msgType: 'float',
      expectedData: 3.1415926,
      precision: 0.0000001
    },
    {
      title: 'subscribe message with type: ColorRGBA',
      msg0: {
        op: 'subscribe', id: 'subscribe_colorrgba', topic: 'subscribe_colorrgba_topic', type: 'std_msgs/ColorRGBA'},
      msg1: {
        op: 'advertise', id: 'advertise_setup_colorrgba', topic: 'subscribe_colorrgba_topic',
        type: 'std_msgs/ColorRGBA'},
      msg2: {
        op: 'publish', id: 'publish_setup_colorrgba', topic: 'subscribe_colorrgba_topic',
        msg: {a: 0.5, r: 255, g: 255, b: 255}},
      msgType: 'compound',
      expectedData: {a: 0.5, r: 255, g: 255, b: 255}
    },
    {
      title: 'subscribe message with type: Header',
      msg0: {op: 'subscribe', id: 'subscribe_header', topic: 'subscribe_header_topic', type: 'std_msgs/Header'},
      msg1: {op: 'advertise', id: 'advertise_setup_header', topic: 'subscribe_header_topic', type: 'std_msgs/Header'},
      msg2: {op: 'publish', id: 'publish_setup_header', topic: 'subscribe_header_topic',
        msg: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'}},
      msgType: 'compound',
      expectedData: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'}
    },
    {
      title: 'subscribe message with type: JointState',
      msg0: {
        op: 'subscribe', id: 'subscribe_jointstate', topic: 'subscribe_jointstate_topic', 
        type: 'sensor_msgs/JointState'},
      msg1: {op: 'advertise', id: 'advertise_setup_jointstate', topic: 'subscribe_jointstate_topic',
        type: 'sensor_msgs/JointState'},
      msg2: {op: 'publish', id: 'publish_setup_jointstate', topic: 'subscribe_jointstate_topic',
        msg: {header: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'},
          name: ['Tom', 'Jerry'], position: [1, 2], velocity: [2, 3], effort: [4, 5, 6]}},
      msgType: 'compound',
      expectedData: {header: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'},
        name: ['Tom', 'Jerry'], position: [1, 2], velocity: [2, 3], effort: [4, 5, 6]}
    }
  ];
  let testResults = {respCount: 4, finalStatus: 'none'};

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
          if (counter < testResults.respCount) {
            assert.deepStrictEqual(response.level, testResults.finalStatus);
          }
          if (counter === testResults.respCount) {
            if (testData.msgType === 'float') {
              assert.ok(Math.abs(response.msg.data - testData.expectedData) < testData.precision);
            } else if (testData.msgType === 'compound') {
              assert.deepEqual(response.msg, testData.expectedData);
            } else {
              assert.deepStrictEqual(response.msg.data, testData.expectedData);
            }
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
            ws.send(JSON.stringify(testData.msg1));
            counter++;
          }
        });
      });
    });
  });
};
