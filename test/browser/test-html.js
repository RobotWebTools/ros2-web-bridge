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
const child = require('child_process');
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');

var server = child.fork(`${__dirname}/server.js`, {cwd: `${__dirname}`});
// var htmlTests = fs.readdirSync(__dirname).filter((file) => {
//   return (file.startsWith('test-')) && (file.endsWith('.js'));
// });

var testResults = [];
(async (html) => {
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width: 1280, height: 960});
    await page.goto('http://127.0.0.1:8080/' + html, {waitUntil: 'load'});

    var results = await page.evaluate(() => {
        testCasesResult = document.querySelector('#results').outerHTML;
        return testCasesResult;
    });

    var dom = new jsdom.JSDOM(results, { contentType: 'text/html'});
    for (let i = 0; i < dom.window.document.querySelector('tbody').rows.length; i++) {
        var testResult = {};
        testResult['caseId'] = dom.window.document.querySelector('tbody').rows[i].cells[1].textContent;
        testResult['result'] = dom.window.document.querySelector('tbody').rows[i].cells[0].textContent;
        testResult['message'] = dom.window.document.querySelector('tbody').rows[i].cells[2].textContent;

        testResult['component'] = 'roslibjs';
        testResult['purpose'] = '';
        testResult['type'] = 'auto';
        testResult['comment'] = '';
        testResult['suite'] = html;

        testResults.push(testResult);
    }

    console.log(testResults);
    browser.close();
    server.kill('SIGINT');
    testResults.forEach((testResult) => {
      assert.deepStrictEqual(testResult['result'], 'Pass');
    });
})(process.argv[2]);
