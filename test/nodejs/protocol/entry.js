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
const child = require('child_process');
const path = require('path');
const WebSocket = require('ws');

var rosbridge = path.resolve(__dirname, '../../../bin/rosbridge.js');

describe('Rosbridge v2.0 protocol testing', function() {
  var webSocketServer;
  this.timeout(5 * 1000);

  before(function(done) {
    webSocketServer = child.fork(rosbridge, ['-l', 'none'], {silent: true});
    webSocketServer.stdout.on('data', function(data) {
      done();
    });
  });

  after(function() {
    webSocketServer.kill();
  });

  describe('sanity', function() {
    require('./test-ros2-protocol-workflow.js')();
  });

  describe('advertise operation', function() {
    require('./test-advertise.js')();
  });

  describe('advertise topic with message types', function() {
    require('./test-advertise-msg.js')();
  });

  describe('unadvertise operation', function() {
    require('./test-unadvertise.js')();
  });

  describe('publish operation', function() {
    require('./test-publish.js')();
  });

  describe('publish message with types', function() {
    require('./test-publish-msg.js')();
  });

  describe('subscribe operation', function() {
    require('./test-subscribe.js')();
  });

  describe('subscribe message with types', function() {
    require('./test-subscribe-msg.js')();
  });

  describe('unsubscribe operation', function() {
    require('./test-unsubscribe.js')();
  });
  describe('call_service operation', function() {
    require('./test-call-service.js')();
  });

  describe('advertise_service operation', function() {
    require('./test-advertise-service.js')();
  });

  describe('unadvertise_service operation', function() {
    require('./test-unadvertise-service.js')();
  });

  describe('set_level operation', function() {
    require('./test-set-level.js')();
  });

  // Disable this case temporarily, sine it gets stuck on Windows CI.
  // describe('response operations', function() {
  //   require('./test-response-op.js')();
  // });

  describe('fuzzing operations', function() {
    require('./test-op-neg.js')();
  });
  describe('service_response operation', function() {
    require('./test-service-response.js')();
  });  
});

