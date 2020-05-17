#! /usr/bin/env bash
set -euxo pipefail

cat output.tap | ../bin/junit-bark.js
