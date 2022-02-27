# GitHub Rerun CircleCI Action

This action reruns a circleci workflow if one of its steps has a status `unauthorized`.
this is useful when renovate-bot runs the CI and doesn't have access to run the jobs.

## Inputs

### `circleci-token`

**Required** the CircleCI token to access its API

## Example usage

```
on:
  check_run:
    types: [ completed ]
    branches-ignore:
      - 'main'

jobs:
  ci_trigger:
    runs-on: ubuntu-latest
    name: Rerun failed CircleCI
    steps:
      - name: Run
        id: run
        uses: adobe-rnd/github-rerun-circleci-action@main
        with:
          circleci-token: ${{ secrets.CIRCLECI_TOKEN }}
```

# Development

## build and deploy

```sh-session
$ npm run build
$ git commit -am"...."
$ npm release
```


