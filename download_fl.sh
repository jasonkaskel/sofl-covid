#!/usr/bin/env bash

FINAL_FILE="${BASH_SOURCE%/*}/src/fl_cases.json" 
FILE="${FINAL_FILE}.tmp"
echo "[" > $FILE

URI="https://services2.arcgis.com/QTlu74VtgQxQNkN3/arcgis/rest/services/Florida_COVID19_Cases_by_City/FeatureServer/0/query?outFields=*&outSR=4326&f=json&where=1%3D1&orderbyFields=Report_Date DESC&resultOffset="
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
