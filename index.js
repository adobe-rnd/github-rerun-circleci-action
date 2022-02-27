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
  console.log(JSON.stringify(github.context, null, 2));
  const { payload, eventName } = github.context;
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

  const circleToken = new github.GitHub(
    core.getInput('circleci-token', {required: true})
  );
  console.log('token length', circleToken.length)

  const { 'workflow-id': workflowId } = JSON.parse(payload.check_run.external_id);
  const url = `https://circleci.com/api/v2/workflow/${workflowId}/job`;

  console.log('requesting', url);
  const resp = await fetch(url, {
    headers: {
      'circle-token': circleToken,
    }
  });
  if (resp.ok) {
    console.log(await resp.json());
  } else {
    core.warning(`Unable to fetch workflow job: ${resp.status} ${await resp.text()}`);
  }
}

run().catch((error) => {
  console.error(error);
  core.setFailed(error.message);
});

