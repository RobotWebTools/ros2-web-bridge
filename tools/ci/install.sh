#!/bin/bash
set -ex

SCRIPT_DIR=$(dirname $(readlink -f "$0"))
WPT_ROOT=$(readlink -f $SCRIPT_DIR/../..)
cd $WPT_ROOT

export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start 1>&2
# For uploading the manifest
export WPT_MANIFEST_FILE=$HOME/meta/MANIFEST-$(git rev-parse HEAD).json

pip install -U setuptools
pip install -U requests
