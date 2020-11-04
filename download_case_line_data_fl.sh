#!/usr/bin/env bash

FINAL_FILE="${BASH_SOURCE%/*}/src/fl_case_line_data.json" 
FILE="${FINAL_FILE}.tmp"
echo "[" > $FILE

URI="https://services2.arcgis.com/QTlu74VtgQxQNkN3/arcgis/rest/services/FCA_Case_Line_Data_from_DOH/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json&orderByFields=Case_Date DESC&resultOffset="
OFFSET=0
JSON=`wget -nv -O - "${URI}${OFFSET}"`
LEN=`echo $JSON | jq .features | jq length`
while [ $LEN -gt 0 ]; do
    echo $JSON >> $FILE

    OFFSET=$((OFFSET + 2000))
    JSON=`wget -nv -O - "${URI}${OFFSET}"`
    LEN=`echo $JSON | jq .features | jq length`
    if [ $LEN -gt 0 ]
    then
        echo "," >> $FILE
    fi
done
echo "]" >> $FILE

tr -d "\n\r" < $FILE > $FINAL_FILE
rm $FILE
