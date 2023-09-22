/******/ var __webpack_modules__ = ({

/***/ 331:
/***/ ((__webpack_module__, __unused_webpack___webpack_exports__, __nccwpck_require__) => {

__nccwpck_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__) => {
/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const core = require('@actions/core');
const github = require('@actions/github');
const { context } = require('@adobe/helix-fetch');

async function run(fetch) {
  const { payload, eventName, actor } = github.context;
  // console.log(`[4] Event name: ${eventName}`);
  // console.log(JSON.stringify(payload, null, 2));
  const action = payload.action;
  if (action !== 'completed' || (eventName !== 'check_run' && eventName !== 'check_suite')) {
    core.warning(`Invalid configuration. This action should only be triggered on "check_run:completed" or "check_suite:completed" events (was ${eventName}:${action})`);
    return;
  }
  const users = (core.getInput('users') || 'renovate[bot]')
    .split(',')
    .map((s) => s.trim());

  core.info(`validation if actor '${actor}' is valid user: ${users}`);
  if (!users.includes(actor)) {
    core.info('ignoring non valid actor');
    return;
  }

  const name = payload.check_run?.app.name || payload.check_suite?.app.name;
  if (name !== 'CircleCI Checks') {
    core.info(`ignoring non circleci check: ${name}`);
    return;
  }

  let { check_run } = payload;
  if (eventName === 'check_suite') {
    // find relevant check run
    const client = new github.GitHub(
      core.getInput('repo-token', {required: true})
    );
    const { id } = payload.check_suite;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const ret = await client.checks.listForSuite({
      check_suite_id: id,
      owner,
      repo,
    });
    // console.log(JSON.stringify(ret, null, 2));
    const check_runs = ret.data.check_runs;
    check_run = check_runs.find(({ status, conclusion }) => status === 'completed' && conclusion === 'failure');
    if (!check_run) {
      core.info('no failed check_run found check_suite');
      return;
    }
  } else {
    const { conclusion } = check_run;
    if (conclusion !== 'failure') {
      core.info(`ignoring check run with conclusion: ${conclusion}`);
      return;
    }
  }

  const circleToken =  core.getInput('circleci-token', {required: true});

  const { 'workflow-id': workflowId } = JSON.parse(check_run.external_id);

  if (!workflowId) {
    core.warning(`Invalid event. check_run does not include information about workflow-id`);
    return;
  }

  let url = `https://circleci.com/api/v2/workflow/${workflowId}`;
  console.log('GET', url);
  let resp = await fetch(url, {
    headers: {
      'circle-token': circleToken,
    }
  });
  if (!resp.ok) {
    core.warning(`Unable to fetch workflow: ${resp.status} ${await resp.text()}`);
    return;
  }

  let body = await resp.json();
  console.log(body);

  // check if any of the status is `unauthorized`
  if (body.status !== 'unauthorized') {
    core.info(`workflow status is: ${body.status}. ignoring.`);
    return;
  }
  core.info('workflow was unauthorized. try to rerun.');

  url = `https://circleci.com/api/v2/workflow/${workflowId}/rerun`;
  console.log('POST', url);
  resp = await fetch(url, {
    method: 'POST',
    headers: {
      'circle-token': circleToken,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from_failed: true,
    }),
  });
  if (!resp.ok) {
    core.warning(`Unable to rerun workflow job: ${resp.status} ${await resp.text()}`);
  }
  body = await resp.json();
  console.log(body);
}

const fetchContext = context();
try {
  await run();
  run(fetchContext.fetch);
} catch (e) {
  console.error(error);
  core.setFailed(error.message);
} finally {
  await fetchContext.reset();
}



__webpack_handle_async_dependencies__();
}, 1);

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/async module */
/******/ (() => {
/******/ 	var webpackThen = typeof Symbol === "function" ? Symbol("webpack then") : "__webpack_then__";
/******/ 	var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 	var completeQueue = (queue) => {
/******/ 		if(queue) {
/******/ 			queue.forEach((fn) => (fn.r--));
/******/ 			queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 		}
/******/ 	}
/******/ 	var completeFunction = (fn) => (!--fn.r && fn());
/******/ 	var queueFunction = (queue, fn) => (queue ? queue.push(fn) : completeFunction(fn));
/******/ 	var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 		if(dep !== null && typeof dep === "object") {
/******/ 			if(dep[webpackThen]) return dep;
/******/ 			if(dep.then) {
/******/ 				var queue = [];
/******/ 				dep.then((r) => {
/******/ 					obj[webpackExports] = r;
/******/ 					completeQueue(queue);
/******/ 					queue = 0;
/******/ 				});
/******/ 				var obj = {};
/******/ 											obj[webpackThen] = (fn, reject) => (queueFunction(queue, fn), dep['catch'](reject));
/******/ 				return obj;
/******/ 			}
/******/ 		}
/******/ 		var ret = {};
/******/ 							ret[webpackThen] = (fn) => (completeFunction(fn));
/******/ 							ret[webpackExports] = dep;
/******/ 							return ret;
/******/ 	}));
/******/ 	__nccwpck_require__.a = (module, body, hasAwait) => {
/******/ 		var queue = hasAwait && [];
/******/ 		var exports = module.exports;
/******/ 		var currentDeps;
/******/ 		var outerResolve;
/******/ 		var reject;
/******/ 		var isEvaluating = true;
/******/ 		var nested = false;
/******/ 		var whenAll = (deps, onResolve, onReject) => {
/******/ 			if (nested) return;
/******/ 			nested = true;
/******/ 			onResolve.r += deps.length;
/******/ 			deps.map((dep, i) => (dep[webpackThen](onResolve, onReject)));
/******/ 			nested = false;
/******/ 		};
/******/ 		var promise = new Promise((resolve, rej) => {
/******/ 			reject = rej;
/******/ 			outerResolve = () => (resolve(exports), completeQueue(queue), queue = 0);
/******/ 		});
/******/ 		promise[webpackExports] = exports;
/******/ 		promise[webpackThen] = (fn, rejectFn) => {
/******/ 			if (isEvaluating) { return completeFunction(fn); }
/******/ 			if (currentDeps) whenAll(currentDeps, fn, rejectFn);
/******/ 			queueFunction(queue, fn);
/******/ 			promise['catch'](rejectFn);
/******/ 		};
/******/ 		module.exports = promise;
/******/ 		body((deps) => {
/******/ 			if(!deps) return outerResolve();
/******/ 			currentDeps = wrapDeps(deps);
/******/ 			var fn, result;
/******/ 			var promise = new Promise((resolve, reject) => {
/******/ 				fn = () => (resolve(result = currentDeps.map((d) => (d[webpackExports]))));
/******/ 				fn.r = 0;
/******/ 				whenAll(currentDeps, fn, reject);
/******/ 			});
/******/ 			return fn.r ? promise : result;
/******/ 		}).then(outerResolve, reject);
/******/ 		isEvaluating = false;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module used 'module' so it can't be inlined
/******/ var __webpack_exports__ = __nccwpck_require__(331);
/******/ __webpack_exports__ = await __webpack_exports__;
/******/ 
