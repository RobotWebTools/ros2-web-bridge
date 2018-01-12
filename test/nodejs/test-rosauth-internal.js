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
const rosauth = require('../../lib/rosauth.js');
const {sha512} = require('js-sha512');

function getJavaScriptTime() {
  const t = new Date().getTime();
  return {sec: Math.floor(t / 1000), nanosec: (t % 1000) * 1000 * 1000};
}

describe('Test rosauth module internally/directly', function() {
  this.timeout(60 * 1000);

  before(function() {
    rosauth.setSecretFile('../data/example.secret');
  });

  after(function() {
  });

  it('Test authenticate() method directly, correct MAC', function() {
    const t = getJavaScriptTime();
    let msg = {
      mac: '',
      client: '192.168.1.101',
      dest: '192.168.1.111',
      rand: 'xyzabc',
      t: {sec: t.sec, nanosec: t.nanosec},
      level: 'admin',
      end: {sec: t.sec + 120, nanosec: t.nanosec},
    };

    msg.mac = sha512('relaxthisain\'tmyfirstrodeo' +
        msg.client + msg.dest + msg.rand + msg.t.sec + msg.level + msg.end.sec);

    assert.ok(rosauth.authenticate(msg), 'Should return true for correct MAC');
  });

  it('Test authenticate() method directly, no MAC', function() {
    const t = getJavaScriptTime();
    let msg = {
      mac: '',
      client: '192.168.1.101',
      dest: '192.168.1.111',
      rand: 'xyzabc',
      t: {sec: t.sec, nanosec: t.nanosec},
      level: 'admin',
      end: {sec: t.sec + 120, nanosec: t.nanosec},
    };

    assert(!rosauth.authenticate(msg), 'Should NOT return true for incorrect MAC');
  });

  it('Test authenticate() method directly, wrong MAC', function() {
    const t = getJavaScriptTime();
    let msg = {
      mac: '',
      client: '192.168.1.101',
      dest: '192.168.1.111',
      rand: 'xyzabc',
      t: {sec: t.sec, nanosec: t.nanosec},
      level: 'admin',
      end: {sec: t.sec + 120, nanosec: t.nanosec},
    };

    msg.mac = sha512('relaxthisain\'tmyfirstrodeo--' +
        msg.client + msg.dest + msg.rand + msg.t.sec + msg.level + msg.end.sec);

    assert(!rosauth.authenticate(msg), 'Should NOT return true for incorrect MAC');
  });

  [
    {secDelta: -Number.MAX_VALUE, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: -Number.MAX_SAFE_INTEGER, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: -6, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: -7, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: -5, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},

    {secDelta: 5, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: 6, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: 7, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: Number.MAX_SAFE_INTEGER, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},
    {secDelta: Number.MAX_VALUE, nanosecDelta: 0, secDeltaEnd: 120, nanosecDeltaEnd: 0},

    {secDelta: Number.NaN, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: Number.NaN, secDeltaEnd: 0, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: Number.NaN, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: Number.NaN},

    {secDelta: 0, nanosecDelta: 1000 * 1000 * 1000, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: Number.MAX_VALUE, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 1000 * 1000 * 1000},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: Number.MAX_VALUE},

    {secDelta: -getJavaScriptTime().sec - 10, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: -Number.MAX_VALUE, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -Number.MAX_VALUE, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -getJavaScriptTime().sec - 10, nanosecDeltaEnd: 0},

    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -0, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -1, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -2, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -3, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -4, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -100, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -100000, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -Number.MAX_SAFE_INTEGER, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: -Number.MAX_VALUE, nanosecDeltaEnd: 0},

    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -1},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -2},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -1000},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -2000},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 0, nanosecDeltaEnd: -3000},
  ].forEach((testData, index) => {
    it('Test authenticate() method directly, correct MAC, wrong timestamp, case#' + index, function() {
      const t = getJavaScriptTime();
      let msg = {
        mac: '',
        client: '192.168.1.101',
        dest: '192.168.1.111',
        rand: 'xyzabc',
        t: {sec: t.sec + testData.secDelta, nanosec: t.nanosec + testData.nanosecDelta},
        level: 'admin',
        end: {sec: t.sec + testData.secDeltaEnd, nanosec: t.nanosec + testData.nanosecDeltaEnd},
      };

      msg.mac = sha512('relaxthisain\'tmyfirstrodeo' +
          msg.client + msg.dest + msg.rand + msg.t.sec + msg.level + msg.end.sec);

      assert(!rosauth.authenticate(msg), 'Should return false for correct MAC + wrong timestamp');
    });
  });

  [
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: -1, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: -2, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: -3, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: -4, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},

    {secDelta: 1, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 2, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 3, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 4, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},

    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 5, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: 10, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: Number.MAX_SAFE_INTEGER, nanosecDeltaEnd: 0},
    {secDelta: 0, nanosecDelta: 0, secDeltaEnd: Number.MAX_VALUE, nanosecDeltaEnd: 0},
  ].forEach((testData, index) => {
    it('Test authenticate() method directly, correct MAC, correct timestamp, case#' + index, function() {
      const t = getJavaScriptTime();
      let msg = {
        mac: '',
        client: '192.168.1.101',
        dest: '192.168.1.111',
        rand: 'xyzabc',
        t: {sec: t.sec, nanosec: t.nanosec},
        level: 'admin',
        end: {sec: t.sec + 120, nanosec: t.nanosec},
      };

      msg.mac = sha512('relaxthisain\'tmyfirstrodeo' +
          msg.client + msg.dest + msg.rand + msg.t.sec + msg.level + msg.end.sec);

      assert.ok(rosauth.authenticate(msg), 'Should return true for correct MAC');
    });
  });

});
