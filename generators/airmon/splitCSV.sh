#!/bin/bash

csplit airmondatafull.csv "/Station MAC,/" "{*}"

tail -n +1 xx00 > xx00temp
mv xx00temp xx00

node airmon-parse.js