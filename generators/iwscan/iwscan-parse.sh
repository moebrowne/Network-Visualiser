#!/bin/bash

IWSCAN=$(cat 'iwlist');

regexCell='Cell ([0-9]+) - Address: ([0-9A-Z\:]+)\
[[:space:]]*Channel:([0-9]+)\
[[:space:]]*Frequency:[0-9\.]+ GHz \(Channel [0-9]+\)\
[[:space:]]*Quality=([0-9]+)/[0-9]+[[:space:]]*Signal level=([0-9\-]+) dBm[[:space:]]*\
.*'

[[ $IWSCAN =~ $regexCell ]]

echo "Cell No => ${BASH_REMATCH[1]}"
echo "Address => ${BASH_REMATCH[2]}"
echo "Channel => ${BASH_REMATCH[3]}"
echo "Quality => ${BASH_REMATCH[4]}"
echo "Signal  => ${BASH_REMATCH[5]}"

cells=(${IWSCAN//Cell/ })

declare -p cells
exit;

matches=$(grep -A5 'Cell' iwlist)

for match in $matches; do
    echo "##$match"
done

#cat 'iwlist' | grep -E 'Cell ([0-9]+)'