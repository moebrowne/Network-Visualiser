#!/bin/bash

OUTPUTFILE="data-01.csv"

inotifywait -e modify -m "$OUTPUTFILE" | while read data; do

    # Split the combined CSVs into the APs and the clients
    csplit "$OUTPUTFILE" "/Station MAC,/" "{*}" --prefix=airmondata- -s

    # Rename the files to have more human names
    mv airmondata-00 airmondata-APs.csv
    mv airmondata-01 airmondata-clients.csv

    # Strip the preceding white space out of the CSV as it borks the parser
    tail -n +2 airmondata-APs.csv > airmondata-APs-temp.csv
    mv airmondata-APs-temp.csv airmondata-APs.csv

    echo "Files changed"

done