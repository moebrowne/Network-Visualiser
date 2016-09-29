#!/bin/bash

OUTPUTFILE="data-01.csv"

inotifywait -e modify -m "$OUTPUTFILE" | while read data; do

    # Split the combined CSVs into the APs and the clients
    csplit "$OUTPUTFILE" "/Station MAC,/" "{*}" --prefix=airmondata- -s

    # Rename the files to have more human names
    cat airmondata-00 | tail -n +2 > airmondata-APs.csv
    cat airmondata-01 > airmondata-clients.csv

    echo "Files changed"

done