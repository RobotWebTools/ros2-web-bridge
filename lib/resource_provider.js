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

const SubscriptionManager = require('./subscription_manager.js');
const RefCountingHandle = require('./ref_counting_handle.js');
const debug = require('debug')('ros2-web-bridge:ResourceProvider');

class ResourceProvider {
  constructor(node, bridgeId) {
    SubscriptionManager.init(node);
    this._bridgeId = bridgeId;
    this._node = node;
    this._publishers = new Map();
    this._clients = new Map();
    this._services = new Map();
  }

  getPublisherByTopicName(topicName) {
    return this._publishers.get(topicName).get();
  }

  getSubscriptionByTopicName(topicName) {
    return SubscriptionManager.getInstance().getSubscriptionByTopicName(topicName).get();
  }

  getClientByServiceName(serviceName) {
    return this._clients.get(serviceName).get();
  }

  getServiceByServiceName(serviceName) {
    return this._services.get(serviceName).get();
  }

  createPublisher(messageType, topicName) {
    let handle = this._publishers.get(topicName);
    if (!handle) {
      handle = new RefCountingHandle(this._node.createPublisher(messageType, topicName),
        this._node.destroyPublisher.bind(this._node));
      this._publishers.set(topicName, handle);
      debug(`Publisher has been created, and the topic name is ${topicName}.`);
    } else {
      handle.retain();
    }
    return handle.get();
  }

  createSubscription(messageType, topicName, callback) {
    return SubscriptionManager.getInstance().createSubscription(messageType, topicName, this._bridgeId, callback);
  }

  createClient(serviceType, serviceName) {
    let handle = this._clients.get(serviceName);
    if (!handle) {
      handle = new RefCountingHandle(this._node.createClient(serviceType, serviceName, {enableTypedArray: false}),
        this._node.destroyClient.bind(this._node));
      this._clients.set(serviceName, handle);
      debug(`Client has been created, and the service name is ${serviceName}.`);
    } else {
      handle.retain();
    }
    return handle.get();
  }

  createService(serviceType, serviceName, callback) {
    let handle = this._services.get(serviceName);
    if (!handle) {
      handle = new RefCountingHandle(this._node.createService(serviceType, serviceName, {enableTypedArray: false},
        (request, response) => {
          callback(request, response);
        }), this._node.destroyService.bind(this._node));
      this._services.set(serviceName, handle);
      debug(`Service has been created, and the service name is ${serviceName}.`);
    } else {
      handle.retain();
    }
    return handle.get();
  }

  destroyPublisher(topicName) {
    if (this._publishers.has(topicName)) {
      let handle = this._publishers.get(topicName);
      handle.release();
      this._removeInvalidHandle(this._publishers, handle, topicName);
    }
  }

  destroySubscription(topicName) {
    SubscriptionManager.getInstance().destroySubscription(topicName, this._bridgeId);
  }

  _destroySubscriptionForBridge() {
    SubscriptionManager.getInstance().destroyForBridgeId(this._bridgeId);
  }

  destroyClient(serviceName) {
    if (this._clients.has(serviceName)) {
      let handle = this._clients.get(serviceName);
      handle.release();
      this._removeInvalidHandle(this._clients, handle, serviceName);
    }
  }

  destroyService(serviceName) {
    if (this._services.has(serviceName)) {
      let handle = this._services.get(serviceName);
      handle.release();
      this._removeInvalidHandle(this._services, handle, serviceName);
    }
  }

  hasService(serviceName) {
    return this._services.has(serviceName);
  }

  hasSubscription(topicName) {
    return SubscriptionManager.getInstance().getSubscriptionByTopicName(topicName) !== undefined;
  }

  clean() {
    this._cleanHandleInMap(this._publishers);
    this._cleanHandleInMap(this._services);
    this._cleanHandleInMap(this._clients);
    this._destroySubscriptionForBridge();
  }

  _removeInvalidHandle(map, handle, name) {
    if (handle.count === 0) {
      map.delete(name);
    }
  }

  _cleanHandleInMap(map) {
    map.forEach(handle => {
      handle.destroy();
    });
    map.clear();
  }
}

module.exports = ResourceProvider;
