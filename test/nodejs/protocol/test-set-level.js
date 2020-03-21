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
      title: 'set_level to error',
      ops: [
        {
          payload: {op: 'set_level', id: 'id1', level: 'error'},
          status: null
        }
      ],
    },
    {
      title: 'set_level to warning',
      ops: [
        {
          payload: {op: 'set_level', id: 'id1', level: 'warning'},
          status: null
        }
      ],
    },
    {
      title: 'set_level to info',
      ops: [
        {
          payload: {op: 'set_level', id: 'id1', level: 'info'},
          status: null
        }
      ],
    },
    {
      title: 'set_level to none',
      ops: [
        {
          payload: {op: 'set_level', id: 'id1', level: 'none'},
          status: 'none'
        }
      ],
    },
    {
      title: 'set_level to invalid',
      ops: [
        {
          payload: {op: 'set_level', id: 'id1', level: 'invalid'},
          status: 'error'
        }
      ],
    },
  ];

  testCasesData.forEach((testData, index) => {
    it(testData.title, function() {
      return new Promise((resolve, reject) => {
        let ws = new WebSocket('ws://127.0.0.1:9090');
        let counter = 0;
        let timeout = null;

        function handleMessage(data) {
          if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
          }
          if (data !== null || testData.ops[counter].status !== null) {
            let response = JSON.parse(data);
            assert.deepStrictEqual(response.level, testData.ops[counter].status);
          }

          counter++;
          if (counter === testData.ops.length) {
            ws.close();
            resolve();
          } else {
            ws.send(JSON.stringify(testData.ops[counter].payload));
          }
        }
        ws.on('message', handleMessage);

        ws.on('open', function() {
          ws.send(JSON.stringify(testData.ops[0].payload));
          if (testData.ops[0].status === null) {
            timeout = setTimeout(() => handleMessage(null), 100);
          }
        });
      });
    });
  });
};
