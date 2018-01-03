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

const debug = require('debug')('ros2-web-bridge:RefCountingHandle');

class RefCountingHandle {
  constructor(object, destroyHandle) {
    if (object) {
      this._object = object;
      this._count = 1;
      this._destroyHandle = destroyHandle;
    }
  }

  get() {
    return this._object;
  }

  release() {
    if (this._count > 0) {
      if (--this._count === 0) {
        this._destroyHandle(this._object);
        this._object = undefined;
        debug('Handle is destroyed.');
      }
    }
  }

  retain() {
    this._count++;
  }

  destroy() {
    if (this._count > 0) {
      this._destroyHandle(this._object);
      this._count = 0;
      this._object = undefined;
      debug('Handle is destroyed.');
    }
  }

  get count() {
    return this._count;
  }
}

module.exports = RefCountingHandle;
