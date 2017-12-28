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
const debug = require('debug')('ros2-web-bridge:NodeManager');

class HandleWithCallbacks {
  constructor(handle) {
    if (handle) {
      this._handle = handle;
      this._callbacks = new Map();
      this._count = 1;
    }
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

  hasCallbackForId(id) {
    return this._callbacks.has(id);
  }

  get callbacks() {
    return Array.from(this._callbacks.values());
  }

  release() {
    if (this._count > 0) {
      this._count--;
    }
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

  createPublisher(messageType, topicName, bridgeId) {
    let map = this._publishers.get(bridgeId);
    if (!map) {
      map = new Map();
      this._publishers.set(bridgeId, map);
    }

    let publisherHandle = map.get(topicName);
    if (!publisherHandle) {
      publisherHandle = new HandleWithCallbacks(this._node.createPublisher(messageType, topicName));
      map.set(topicName, publisherHandle);
      debug(`Publisher has been created, and the topic is ${topicName}.`);
    } else {
      publisherHandle.retain();
    }
    return publisherHandle.handle;
  }

  createSubscription(messageType, topicName, bridgeId, callback) {
    let subscriptionHandle = this._subscriptions.get(topicName);
    if (!subscriptionHandle) {
      let subscription = this._node.createSubscription(messageType, topicName, (message) => {
        this._subscriptions.get(topicName).callbacks.forEach(callback => {
          callback(topicName, message);
        });
      });

      subscriptionHandle = new HandleWithCallbacks(subscription);
      subscriptionHandle.addCallback(bridgeId, callback);
      this._subscriptions.set(topicName, subscriptionHandle);
      debug(`Subscription has been created, and the topic is ${topicName}.`);
      return subscriptionHandle.handle;
    }

    if (!subscriptionHandle.hasCallbackForId(bridgeId)) {
      subscriptionHandle.addCallback(bridgeId, callback);
      subscriptionHandle.retain();
      return subscriptionHandle.handle;
    }
  }

  createClient(serviceType, serviceName, bridgeId) {
    let map = this._clients.get(bridgeId);
    if (!map) {
      map = new Map();
      this._clients.set(bridgeId, map);
    }

    let clientHandle = map.get(serviceName);
    if (!clientHandle) {
      clientHandle = new HandleWithCallbacks(this._node.createClient(serviceType, serviceName));
      map.set(serviceName, clientHandle);
      debug(`Client has been created, and the service name is ${serviceName}.`);
    } else {
      clientHandle.retain();
    }
    return clientHandle.handle;
  }

  createService(serviceType, serviceName, bridgeId, callback) {
    let map = this._services.get(bridgeId);
    if (!map) {
      map = new Map();
      this._services.set(bridgeId, map);
    }

    if (!map.has(serviceName)) {
      let service = this._node.createService(serviceType, serviceName, (request, response) => {
        callback(request, response);
      });
      map.set(serviceName, service);
      return service;
    }
  }

  getPublisherByTopic(topicName, bridgeId) {
    let map = this._publishers.get(bridgeId);
    if (map) {
      if (map.has(topicName)) {
        return map.get(topicName).handle;
      }
    }
  }

  getSubscriptionByTopic(topicName) {
    if (this._subscripions.has(topicName)) {
      return this._subscripions.get(topicName);
    }
  }

  destroyPublisher(topicName, bridgeId) {
    let map = this._publishers.get(bridgeId);
    if (map) {
      let publisherHandle = map.get(topicName);
      if (publisherHandle) {
        publisherHandle.release();
        if (handle.count === 0) {
          this._node.destroyPublisher(publisherHandle.handle);
          map.delete(topicName);
          debug(`Publisher is destroyed, and the topic name is ${topicName}.`);
        }
      }
    }
  }

  destroySubscription(topicName, bridgeId) {
    let subscriptionHandle = this._subscriptions.get(topicName);
    if (subscriptionHandle) {
      if (subscriptionHandle.hasCallbackForId(bridgeId)) {
        subscriptionHandle.removeCallback(bridgeId);
        subscriptionHandle.release();
      }

      if (subscriptionHandle.count === 0) {
        this._node.destroySubscription(subscriptionHandle.handle);
        debug(`Subscription is destroyed, and the topic name is ${topicName}.`);
      }
    }
  }

  destroyClient(serviceName, bridgeId) {
    let map = this._clients.get(bridgeId);
    if (map) {
      let clientHandle = map.get(serviceName);
      if (clientHandle) {
        clientHandle.release();
        if (clientHandle.count === 0) {
          this._node.destroyClient(clientHandle.handle);
          map.delete(serviceName);
          debug(`Client is destroyed, and the service name is ${serviceName}.`);
        }
      }
    }
  }

  destroyService(serviceName, bridgeId) {
    let map = this._services.get(bridgeId);
    if (map && map.has(serviceName)) {
      this._node.destroyService(this._services.get(serviceName));
      map.delete(serviceName);
      debug(`Service is destroyed, and the service name is ${serviceName}.`);
    }
  }

  cleanResourceByBridgeId(bridgeId) {
    if (this._clients.has(bridgeId)) {
      this._clients.get(bridgeId).forEach(clientHandle => {
        this._node.destroyClient(clientHandle.handle);
        debug(`Client is destroyed for bridge ${bridgeId}.`);
      });
      this._clients.delete(bridgeId);
    }

    if (this._publishers.has(bridgeId)) {
      this._publishers.get(bridgeId).forEach(publisherHandle => {
        this._node.destroyPublisher(publisherHandle.handle);
        debug(`Publisher is destroyed for bridge ${bridgeId}.`);
      });
      this._publishers.delete(bridgeId);
    }

    if (this._services.has(bridgeId)) {
      this._services.get(bridgeId).forEach(service => {
        this._node.destroyService(service);
        debug(`Service is destroyed for bridge ${bridgeId}.`);
      });
      this._publishers.delete(bridgeId);
    }

    this._subscriptions.forEach(subscriptionHandle => {
      if (subscriptionHandle.hasCallbackForId(bridgeId)) {
        subscriptionHandle.removeCallback(bridgeId);
        subscriptionHandle.release();
        if (subscriptionHandle.count === 0) {
          this._node.destroySubscription(subscriptionHandle.handle);
          this._subscriptions.delete(subscriptionHandle.handle._topic);
          debug(`Subscription is destroyed for bridge ${bridgeId}.`);
        }
      }
    });

    debug(`The bridge ${bridgeId} has been cleaned.`);
  }

  get node() {
    return this._node;
  }

  set node(node) {
    this._node = node;
  }
}

module.exports = NodeManager;
