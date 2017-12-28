#!/bin/bash
set -e

GIT_STATUS=$(git status)
#GIT_PARAM=$(git rev-parse HEAD)

if [[ $(./wpt test-jobs --includes $JOB; echo $?) -eq 0 ]]; then
    export RUN_JOB=1
    #git submodule update --init --recursive 2>&1
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start 2>&1
    # For uploading the manifest
    #export WPT_MANIFEST_FILE=$HOME/meta/MANIFEST-$(git rev-parse HEAD).json
else
    export RUN_JOB=0
fi
