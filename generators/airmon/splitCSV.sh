#!/bin/bash

csplit $HOME/output-03.csv "/Station MAC,/" "{*}"

tail -n +1 xx00 > xx00temp
mv xx00temp xx00

node airmon-parse.js