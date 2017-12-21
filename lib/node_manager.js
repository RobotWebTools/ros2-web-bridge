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

const rclnodejs = require('rclnodejs');
const debug = require('debug')('ros2bridge:NodeManager');

class HandleWithCallbacks {
  constructor(handle) {
    this._handle = handle;
    this._callbacks = new Map();
    this._count = 1;
  }

  get handle() {
    return this._handle;
  }

  addCallback(id, callback) {
    this._callbacks.set(id, callback);
  }

  removeCallback(id) {
    this._callbacks.delete(id);
  }

  get callbacks() {
    return Array.from(this._callbacks.values());
  }

  release() {
    this._count--;
  }

  retain() {
    this._count++;
  }

  get count() {
    return this._count;
  }
}

class NodeManager {
  constructor(node) {
    this._node = node;
    this._publishers = new Map();
    this._subscriptions = new Map();
    this._clients = new Map();
    this._services = new Map();
  }

  createPublisher(messageType, topicName) {
    let handleWithCallbacks = this._publishers.get(topicName);
    if (!handleWithCallbacks) {
      let publisher = this._node.createPublisher(messageType, topicName);
      handleWithCallbacks = new HandleWithCallbacks(publisher);
      this._publishers.set(topicName, handleWithCallbacks);
      debug(`Publisher has been created, and the topic is ${topicName}.`);
    } else {
      handleWithCallbacks.retain();
    }

    return handleWithCallbacks.handle;
  }

  createSubscription(messageType, topicName, bridgeId, callback) {
    let handleWithCallbacks = this._subscriptions.get(topicName);
    if (!handleWithCallbacks) {
      let subscription = this._node.createSubscription(messageType, topicName, (message) => {
        this._subscriptions.get(topicName).callbacks.forEach(callback => {
          callback(topicName, message);
        });
      });

      debug(`Subscription has been created, and the topic is ${topicName}.`);
      handleWithCallbacks = new HandleWithCallbacks(subscription);
      handleWithCallbacks.addCallback(bridgeId, callback);
      this._subscriptions.set(topicName, handleWithCallbacks);
    } else {
      handleWithCallbacks.retain();
      handleWithCallbacks.addCallback(bridgeId, callback);
    }

    return handleWithCallbacks.handle;
  }

  createClient(serviceType, serviceName) {
    let client = this._clients.get(serviceName);
    if (!client) {
      client = this._node.createClient(serviceType, serviceName);
      this._clients.set(serviceName, client);
    }
    return client;
  }

  createService(serviceType, serviceName, bridgeId, callback) {
    let service = this._services.get(serviceName);
    if (!service) {
      service = this._node.createService(serviceType, serviceName, (request, response) => {
        callback(request, response);
      });

      this._services.set(serviceName, service);
      return service;
    }

    throw Error(`There is already service named ${serviceName}`);
  }

  getPublishByTopic(topicName) {
    if (this._publishers.has(topicName)) {
      return this._publishers.get(topicName).handle;
    }
  }

  getSubscriptionByTopic(topicName) {
    if (this._subscriptions.has(topicName)) {
      return this._subscriptions.get(topicName).handle;
    }
  }

  destroyPublisher(topicName) {
    let handleWithCallbacks = this._publishers.get(topicName);
    if (handleWithCallbacks) {
      handleWithCallbacks.release();
      if (handleWithCallbacks.count === 0) {
        this._node.destroyPublisher(handleWithCallbacks.handle);
        debug(`Publisher has been destroyed, and the topic is ${topicName}.`);
        this._publishers.delete(topicName);
      }
    }
  }

  destroySubscription(topicName, bridgeId) {
    let handleWithCallbacks = this._subscriptions.get(topicName);
    if (handleWithCallbacks) {
      handleWithCallbacks.release();
      handleWithCallbacks.removeCallback(bridgeId);

      if (handleWithCallbacks.count === 0) {
        this._node.destroySubscription(handleWithCallbacks.handle);
        debug(`Subscription has been destroyed, and the topic is ${topicName}.`);
        this._subscriptions.delete(topicName);
      }
    }
  }

  destroyService(serviceName) {
    let service = this._services.get(serviceName);
    if (service) {
      this._node.destroyService(service);
    }
  }

  start() {
    rclnodejs.spin(this._node);
  }

  shutdown() {
    rclnodejs.shutdown(this._node);
    this._node = undefined;
    this._publishers.clear();
    this._subscriptions.clear();
    this._clients.clear();
    this._services.clear();
  }

  get node() {
    return this._node;
  }
}

module.exports = NodeManager;
