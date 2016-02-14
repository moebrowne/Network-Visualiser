#!/bin/bash

OUTPUTFILE="$HOME/output-05.csv"

inotifywait -e modify -m "$OUTPUTFILE" | while read data; do

    # Split the combined CSVs into the APs and the clients
    csplit "$OUTPUTFILE" "/Station MAC,/" "{*}" --prefix=airmondata-

    # Rename the files to have more human names
    mv airmondata-00 airmondata-APs
    mv airmondata-01 airmondata-clients

    # Strip the preceding white space out of the CSV as it borks the parser
    tail -n +2 airmondata-APs > airmondata-APs-temp
    mv airmondata-APs-temp airmondata-APs

    # Get Node to parse the data
    node airmon-parse.js

done