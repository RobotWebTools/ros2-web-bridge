#!/usr/bin/env node

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

const rosbridge = require('../index.js');
const app = require('commander');
const pkg = require('../package.json');

app
  .version(pkg.version)
  .option('-p, --port [port_number]', 'Listen port, default to :9090')
  .option('-a, --address [address_string]', 'Remote server address (client mode); server mode if unset')
  .option('-r, --retry_startup_delay [delay_ms]', 'Retry startup delay in millisecond')
  .option('-o, --fragment_timeout [timeout_ms]', 'Fragment timeout in millisecond')
  .option('-d, --delay_between_messages [delay_ms]', 'Delay between messages in millisecond')
  .option('-m, --max_message_size [byte_size]', 'Max message size')
  .option('-t, --topics_glob [glob_list]', 'A list or None')
  .option('-s, --services_glob [glob_list]', 'A list or None')
  .option('-g, --params_glob [glob_list]', 'A list or None')
  .option('-b, --bson_only_mode', 'Unsupported in WebSocket server, will be ignored')
  .option('-l, --status_level [level_string]', 'Status level (one of "error", "warning", "info", "none"; default "error")')
  .parse(process.argv);

rosbridge.createServer(app);
