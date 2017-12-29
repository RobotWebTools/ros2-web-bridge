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

// Same authentication logic with https://github.com/GT-RAIL/rosauth/blob/develop/src/ros_mac_authentication.cpp

const crypto = require('crypto');

let secretFile = '';

function sha512(text) {
  const hash = crypto.createHash('sha512');
  hash.update(text);
  return hash.digest('hex');
}

function getSecret() {
  const path = require('path');
  const fs = require('fs');
  const file = path.resolve(__dirname, secretFile);
  // eslint-disable-next-line
  const content = fs.readFileSync(file).toString();
  getSecret = function() { return content; };
  return content;
}

function gt(l, s) {
  return (l.sec == s.sec && l.nanosec > s.nanosec) || l.sec > s.sec;
}

const NANOSEC_IN_A_SEC = 1000 * 1000 * 1000;

function diffTime(l, s) {
  let nanodiff = l.nanosec - s.nanosec;
  let secdiff = l.sec - s.sec;
  if (l.nanosec < s.nanosec) {
    nanodiff += NANOSEC_IN_A_SEC;
    secdiff += 1;
  }
  return secdiff + nanodiff / NANOSEC_IN_A_SEC;
}

function getJavaScriptTime() {
  const t = new Date().getTime();
  return {sec: Math.floor(t / 1000), nanosec: (t % 1000) * 1000 * 1000};
}

function authenticate(msg) {
  if (Number.isNaN(msg.t.sec) || Number.isNaN(msg.t.nanosec) ||
      Number.isNaN(msg.end.sec) || Number.isNaN(msg.end.nanosec) ||
      msg.t.sec < 0 || msg.end.sec < 0 ||
      msg.t.nanosec >= NANOSEC_IN_A_SEC || msg.end.nanosec >= NANOSEC_IN_A_SEC ||
      msg.t.nanosec < 0 || msg.end.nanosec < 0) {
    return false;
  }

  // We don't get time from ROS system
  //  because it might not be a system-clock timestamp
  const t = getJavaScriptTime();
  let diff;
  if (gt(msg.t, t)) {
    diff = diffTime(msg.t, t);
  } else {
    diff = diffTime(t, msg.t);
  }

  if (diff < 5 && gt(msg.end, t)) {
    const text = getSecret() + msg.client + msg.dest + msg.rand + msg.t.sec + msg.level + msg.end.sec;
    const hash = sha512(text);
    return msg.mac === hash;
  }

  return false;
}

function setSecretFile(file) {
  secretFile = file;
}

module.exports = {
  authenticate,
  setSecretFile,
};
