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
const { fetch } = require('@adobe/helix-fetch');

async function run() {
  // console.log(JSON.stringify(github.context, null, 2));
  const { payload, eventName, actor } = github.context;
  const action = payload.action;
  if (action !== 'completed' || eventName !== 'check_run') {
    core.warning(`Invalid configuration. This action should only be triggered on "check_run:completed" events (was ${eventName}:${action})`);
    return;
  }

  const conclusion = payload?.check_run?.conclusion;
  if (conclusion !== 'failure') {
    console.log(`ignoring check run with conclusion: ${conclusion}`);
    return;
  }

  if (actor !== 'renovate[bot]') { // todo: to be configured
    console.log(`ignoring check run with actor: ${actor}`);
    return;
  }

  const details_url = payload.check_run.details_url || '';
  if (!details_url.startsWith('https://circleci.com/workflow-run/')) {
    console.log(`ignoring non circleci check run: ${details_url}`);
    return;
  }

  const circleToken =  core.getInput('circleci-token', {required: true});

  const { 'workflow-id': workflowId } = JSON.parse(payload.check_run.external_id);

  if (!workflowId) {
    core.warning(`Invalid event. check_run does not include information about workflow-id`);
    return;
  }

  let url = `https://circleci.com/api/v2/workflow/${workflowId}/job`;
  console.log('GET', url);
  let resp = await fetch(url, {
    headers: {
      'circle-token': circleToken,
    }
  });
  if (!resp.ok) {
    core.warning(`Unable to fetch workflow job: ${resp.status} ${await resp.text()}`);
    return;
  }

  let body = await resp.json();
  console.log(body);

  // check if any of the status is `unauthorized`
  const failed = body.items.find((item) => item.status === 'unauthorized');
  if (!failed) {
    core.info('non of the circleci jobs failed due to unauthorized status. ignoring.');
    return;
  }

  core.info(`circleci job '${failed.name}' has status '${failed.status}'. try to rerun.`);

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

run().catch((error) => {
  console.error(error);
  core.setFailed(error.message);
});

