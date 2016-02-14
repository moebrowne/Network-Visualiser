#!/bin/bash

OUTPUTFILE="$HOME/output-05.csv"

inotifywait -e modify -m "$OUTPUTFILE" | while read data; do

    csplit "$OUTPUTFILE" "/Station MAC,/" "{*}"

    tail -n +2 xx00 > xx00temp
    mv xx00temp xx00

    node airmon-parse.js

done