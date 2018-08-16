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

const RefCountingHandle = require('./ref_counting_handle.js');
const debug = require('debug')('ros2-web-bridge:SubscriptionManager');

class HandleWithCallbacks extends RefCountingHandle {
  constructor(object, destroyHandle) {
    super(object, destroyHandle);
    this._callbacks = new Map();
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
}

class SubscriptionManager {
  constructor(node) {
    this._subscripions = new Map();
    this._node = node;
  }

  getSubscriptionByTopicName(topicName) {
    return this._subscripions.get(topicName);
  }

  createSubscription(messageType, topicName, bridgeId, callback) {
    let handle = this._subscripions.get(topicName);

    if (!handle) {
      let subscription = this._node.createSubscription(messageType, topicName, {enableTypedArray: false}, (message) => {
        this._subscripions.get(topicName).callbacks.forEach(callback => {
          callback(topicName, message);
        });
      });
      handle = new HandleWithCallbacks(subscription, this._node.destroySubscription.bind(this._node));
      handle.addCallback(bridgeId, callback);
      this._subscripions.set(topicName, handle);
      debug(`Subscription has been created, and the topic name is ${topicName}.`);

      return handle.get();
    }

    handle.addCallback(bridgeId, callback);
    handle.retain();
    return handle.get();
  }

  destroySubscription(topicName, bridgeId) {
    if (this._subscripions.has(topicName)) {
      let handle = this._subscripions.get(topicName);
      if (handle.hasCallbackForId(bridgeId)) {
        handle.removeCallback(bridgeId);
        handle.release();
        if (handle.count === 0) {
          this._subscripions.delete(topicName);
        }
      }
    }
  }

  destroyForBridgeId(bridgeId) {
    this._subscripions.forEach(handle => {
      if (handle.hasCallbackForId(bridgeId)) {
        handle.removeCallback(bridgeId);
        handle.release();
        this._removeInvalidHandle();
      }
    });
  }

  _removeInvalidHandle() {
    this._subscripions.forEach((handle, topicName, map) => {
      if (handle.count === 0) {
        map.delete(topicName);
      }
    });
  }
}

let subscriptionManager = {
  _instance: undefined,

  init(node) {
    if (!this._instance) {
      this._instance = new SubscriptionManager(node);
    }
  },

  getInstance() {
    return this._instance;
  }
};

module.exports = subscriptionManager;
