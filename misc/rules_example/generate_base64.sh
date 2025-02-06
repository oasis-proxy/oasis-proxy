#!/bin/bash

BASE_FOLDER=$(cd "$(dirname "$0")";pwd)
echo $BASE_FOLDER
cat "$BASE_FOLDER/raw_rules.txt" | base64 | fold -w 64

cat "$BASE_FOLDER/raw_rules.txt" | base64 | fold -w 64 > "$BASE_FOLDER/base64_rules.txt"