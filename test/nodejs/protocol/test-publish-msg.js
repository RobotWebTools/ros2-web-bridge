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
      publishMsg: {op: 'publish', id: 'publish_bool', topic: 'publish_bool_topic', msg: {data: true}}
    },
    {
      title: 'publish message with type: Byte',
      advertiseMsg: {op: 'advertise', id: 'advertise_byte_setup', topic: 'publish_byte_topic', type: 'std_msgs/Byte'},
      publishMsg: {op: 'publish', id: 'publish_byte', topic: 'publish_byte_topic', msg: {data: 0xff}}
    },
    {
      title: 'publish message with type: Char',
      advertiseMsg: {op: 'advertise', id: 'advertise_char_setup', topic: 'publish_char_topic', type: 'std_msgs/Char'},
      publishMsg: {op: 'publish', id: 'publish_char', topic: 'publish_char_topic', msg: {data: 'A'}}
    },
    {
      title: 'publish message with type: String',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_string_setup', topic: 'publish_string_topic', type: 'std_msgs/String'},
      publishMsg: {op: 'publish', id: 'publish_string', topic: 'publish_string_topic', msg: {data: 'hello world!'}}
    },
    {
      title: 'publish message with type: Int8',
      advertiseMsg: {op: 'advertise', id: 'advertise_int8_setup', topic: 'publish_int8_topic', type: 'std_msgs/Int8'},
      publishMsg: {op: 'publish', id: 'publish_int8', topic: 'publish_int8_topic', msg: {data: 0x7f}}
    },
    {
      title: 'publish message with type: UInt8',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint8_setup', topic: 'publish_uint8_topic', type: 'std_msgs/UInt8'},
      publishMsg: {op: 'publish', id: 'publish_uint8', topic: 'publish_uint8_topic', msg: {data: 0xff}}
    },
    {
      title: 'publish message with type: Int16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int16_setup', topic: 'publish_int16_topic', type: 'std_msgs/Int16'},
      publishMsg: {op: 'publish', id: 'publish_int16', topic: 'publish_int16_topic', msg: {data: 0x7fff}}
    },
    {
      title: 'publish message with type: UInt16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint16_setup', topic: 'publish_uint16_topic', type: 'std_msgs/UInt16'},
      publishMsg: {op: 'publish', id: 'publish_uint16', topic: 'publish_uint16_topic', msg: {data: 0xffff}}
    },
    {
      title: 'publish message with type: Int32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int32_setup', topic: 'publish_int32_topic', type: 'std_msgs/Int32'},
      publishMsg: {op: 'publish', id: 'publish_int32', topic: 'publish_int32_topic', msg: {data: 0x7fffffff}}
    },
    {
      title: 'publish message with type: UInt32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint32_setup', topic: 'publish_uint32_topic', type: 'std_msgs/UInt32'},
      publishMsg: {op: 'publish', id: 'publish_uint32', topic: 'publish_uint32_topic', msg: {data: 0xffffffff}}
    },
    {
      title: 'publish message with type: Int64', 
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int64_setup', topic: 'publish_int64_topic', type: 'std_msgs/Int64'},
      publishMsg: {
        op: 'publish', id: 'publish_int64', topic: 'publish_int64_topic', msg: {data: Number.MIN_SAFE_INTEGER}}
    },
    {
      title: 'publish message with type: UInt64',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint64_setup', topic: 'publish_uint64_topic', type: 'std_msgs/UInt64'},
      publishMsg: {
        op: 'publish', id: 'publish_uint64', topic: 'publish_uint64_topic', msg: {data: Number.MAX_SAFE_INTEGER}}
    },
    {
      title: 'publish message with type: Float32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_float32_setup', topic: 'publish_float32_topic', type: 'std_msgs/Float32'},
      publishMsg: {op: 'publish', id: 'publish_float32', topic: 'publish_float32_topic', msg: {data: 3.14}}
    },
    {
      title: 'publish message with type: Float64',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_float64_setup', topic: 'publish_float64_topic', type: 'std_msgs/Float64'},
      publishMsg: {op: 'publish', id: 'publish_float64', topic: 'publish_float64_topic', msg: {data: Number.MAX_VALUE}}
    },
    {
      title: 'publish message with type: ColorRGBA',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_colorrgba_setup', topic: 'publish_colorrgba_topic',
        type: 'std_msgs/ColorRGBA'},
      publishMsg: {
        op: 'publish', id: 'publish_colorrgba', topic: 'publish_colorrgba_topic',
        msg: {a: 0.5, r: 255, g: 255, b: 255}}
    },
    {
      title: 'publish message with type: Header',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_header_setup', topic: 'publish_header_topic', type: 'std_msgs/Header'},
      publishMsg: {
        op: 'publish', id: 'publish_header', topic: 'publish_header_topic',
        /* eslint-disable camelcase */
        msg: {stamp: {sec: 123456, nanosec: 789}, frame_id: 'main frame'}}
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
      }
    }
  ];
  let testResults = {opCount: 2, finalStatus: 'none'};

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
          assert.deepStrictEqual(response.level, testResults.finalStatus);

          if (counter === testResults.opCount) {
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

  let testCasesNegData = [
    {
      title: 'publish message negatively with type: Byte',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_byte_setup_neg', topic: 'publish_byte_neg_topic', type: 'std_msgs/Byte',
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_byte_neg1', topic: 'publish_byte_neg_topic', msg: {data: -1}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_byte_neg2', topic: 'publish_byte_neg_topic', msg: {data: 0x100}
      }
    },
    {
      title: 'publish message negatively with type: Char',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_char_setup_neg', topic: 'publish_char_neg_topic', type: 'std_msgs/Char'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_char_neg1', topic: 'publish_char_neg_topic', msg: {data: -0x81}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_char_neg2', topic: 'publish_char_neg_topic', msg: {data: 0x80}
      }
    },
    {
      title: 'publish message negatively with type: Int8',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int8_setup_neg', topic: 'publish_int8_neg_topic', type: 'std_msgs/Int8'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_int8_neg1', topic: 'publish_int8_neg_topic', msg: {data: -0x81}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_int8_neg2', topic: 'publish_int8_neg_topic', msg: {data: 0x80}
      }
    },
    {
      title: 'publish message negatively with type: UInt8',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint8_setup_neg', topic: 'publish_uint8_neg_topic', type: 'std_msgs/UInt8'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_uint8_neg1', topic: 'publish_uint8_neg_topic', msg: {data: -0x1}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_uint8_neg2', topic: 'publish_uint8_neg_topic', msg: {data: 0x100}
      }
    },
    {
      title: 'publish message negatively with type: Int16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int16_setup_neg', topic: 'publish_int16_neg_topic', type: 'std_msgs/Int16'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_int16_neg1', topic: 'publish_int16_neg_topic', msg: {data: -0x8001}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_int16_neg2', topic: 'publish_int16_neg_topic', msg: {data: 0x8000}
      }
    },
    {
      title: 'publish message negatively with type: UInt16',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint16_setup_neg', topic: 'publish_uint16_neg_topic', type: 'std_msgs/UInt16'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_uint16_neg1', topic: 'publish_uint16_neg_topic', msg: {data: -0x1}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_uint16_neg2', topic: 'publish_uint16_neg_topic', msg: {data: 0x10000}
      }
    },
    {
      title: 'publish message negatively with type: Int32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_int32_setup_neg', topic: 'publish_int32_neg_topic', type: 'std_msgs/Int32'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_int32_neg1', topic: 'publish_int32_neg_topic', msg: {data: -0x80000001}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_int32_neg2', topic: 'publish_int32_neg_topic', msg: {data: 0x80000000}
      }
    },
    {
      title: 'publish message negatively with type: UInt32',
      advertiseMsg: {
        op: 'advertise', id: 'advertise_uint32_setup_neg', topic: 'publish_uint32_neg_topic', type: 'std_msgs/UInt32'
      },
      publishNegMsg1: {
        op: 'publish', id: 'publish_uint32_neg1', topic: 'publish_uint32_neg_topic', msg: {data: -0x1}
      },
      publishNegMsg2: {
        op: 'publish', id: 'publish_uint32_neg2', topic: 'publish_uint32_neg_topic', msg: {data: 0x100000000}
      }
    }
  ];
  let testNegResults = {opCount: 3, finalStatus: 'error'};

  testCasesNegData.forEach((testNegData, index) => {
    it(testNegData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        var counter = 0;

        ws.on('open', function() {
          ws.send(JSON.stringify(testNegData.advertiseMsg));
          counter++;
        });
        ws.on('message', function(data) {
          let response = JSON.parse(data);

          if (counter === testNegResults.opCount) {
            assert.deepStrictEqual(response.level, testNegResults.finalStatus);
            ws.close();
            resolve();
          }
          if (counter === 2) {
            assert.deepStrictEqual(response.level, testNegResults.finalStatus);
            ws.send(JSON.stringify(testNegData.publishNegMsg2));
            counter++;
          }
          if (counter === 1) {
            assert.deepStrictEqual(response.level, 'none');
            ws.send(JSON.stringify(testNegData.publishNegMsg1));
            counter++;
          }
        });
      });
    });
  });
};
