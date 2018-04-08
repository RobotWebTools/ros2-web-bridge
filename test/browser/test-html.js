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
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const async = require('async');
const Mocha = require('mocha');
const htmlTests = require('./html_list.json').htmls;

let bridgePath = path.join(`{__dirname}/../`, 'bin', 'rosbridge.js');
let bridge = child.fork(bridgePath);
let server = child.fork(`${__dirname}/server.js`, {cwd: `${__dirname}`});

let browserTestResults = [];
async.each(htmlTests, async function (html, callback) {
  let browser = await puppeteer.launch({args: ['--no-sandbox']});
  let page = await browser.newPage();
  await page.setViewport({width: 1280, height: 960});
  await page.goto('http://127.0.0.1:8080/' + html.suite, {waitUntil: 'load'});
  await page.waitFor(html.waitingTime);

  let results = await page.evaluate(() => {
    return document.querySelector('#results').outerHTML;
  });

  let dom = new jsdom.JSDOM(results, { contentType: 'text/html'});
  let testSuite = {};
  testSuite['suite'] = html.suite;
  testSuite['results'] = [];
  for (let i = 0; i < dom.window.document.querySelector('tbody').rows.length; i++) {
    let testResult = {};
    testResult['caseId'] = dom.window.document.querySelector('tbody').rows[i].cells[1].textContent;
    testResult['result'] = dom.window.document.querySelector('tbody').rows[i].cells[0].textContent;
    testResult['message'] = dom.window.document.querySelector('tbody').rows[i].cells[2].textContent;

    testResult['component'] = 'roslibjs';
    testResult['purpose'] = '';
    testResult['type'] = 'auto';
    testResult['comment'] = '';

    testSuite['results'].push(testResult);
  }

  browserTestResults.push(testSuite);
  await browser.close();
}, function () {
  server.kill('SIGINT');
  bridge.kill('SIGINT');

  let testBrowser = "'use strict';\n";
  testBrowser += "const assert = require('assert');\n\n";
  testBrowser += "describe('Roslibjs API testing over ros2-web-bridge', function() {\n";
  browserTestResults.forEach((thisSuite, index) => {
    testBrowser += "  describe('" + thisSuite.suite + "', function() {\n";
    thisSuite['results'].forEach((thisResult, index) => {
      testBrowser += "   it('" + thisResult.caseId + "', function() {\n";
      testBrowser += "     assert.strictEqual('" + thisResult.result
                  + "', 'Pass', String.raw`"
                  + thisResult.message + "`);\n";
      testBrowser += "   });\n";
    });
    testBrowser += "  });\n\n";
  });
  testBrowser += "});\n";

  fs.writeFile(path.join(`${__dirname}`, 'test-browser.js'), testBrowser, 'utf8',  (err) => {
    if (err) throw err;

    let mocha = new Mocha();
    mocha.addFile(path.join(`${__dirname}`, 'test-browser.js'));
    mocha.run(function(failures){
      process.on('exit', function () {
        process.exit(failures);
      });
    });
  });
});
