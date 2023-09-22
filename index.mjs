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
import core from '@actions/core';
import github from '@actions/github';
import { context } from '@adobe/helix-fetch';

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
  await run(fetchContext.fetch);
} catch (e) {
  console.error(e);
  core.setFailed(e.message);
} finally {
  await fetchContext.reset();
}


