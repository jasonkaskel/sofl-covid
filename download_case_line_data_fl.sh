#!/usr/bin/env bash

while getopts "hm:" opt; do
    case $opt in
        m ) maxcalls=$OPTARG;;
        h ) usage
        exit 0;;
        *) usage
        exit 1;;
    esac
done

FINAL_FILE="${BASH_SOURCE%/*}/src/fl_case_line_data.json.int" 
FILE="${FINAL_FILE}.tmp"

limitcalls="no"
if [ -n "$maxcalls" ]
then
    cp $FINAL_FILE $FILE
    `truncate -s -1b $FILE`
    limitcalls="yes"
    echo "," >> $FILE
else
    echo "[" > $FILE
fi

# URI="https://services2.arcgis.com/QTlu74VtgQxQNkN3/arcgis/rest/services/FCA_Case_Line_Data_from_DOH/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json&orderByFields=Case_Date DESC&resultOffset="
URI="https://services1.arcgis.com/CY1LXxl9zlJeBuRZ/arcgis/rest/services/Florida_COVID19_Case_Line_Data_NEW/FeatureServer/0/query?where=1%3D1&outFields=County,Case_,Contact,Case1,EventDate,ChartDate,ObjectId&outSR=4326&f=json&orderByFields=ChartDate DESC&resultOffset="
OFFSET=0
JSON=`wget -nv -O - "${URI}${OFFSET}"`
LEN=`echo $JSON | jq .features | jq length`
COUNTER=1
while  [[ $LEN -gt 0 && ( $limitcalls == "no" || $COUNTER -lt $maxcalls ) ]] ; do
    echo $JSON >> $FILE

    OFFSET=$((OFFSET + 2000))
    JSON=`wget -nv -O - "${URI}${OFFSET}"`
    LEN=`echo $JSON | jq .features | jq length`
    COUNTER=$((COUNTER + 1))
    if [[ $LEN -gt 0 && ( $limitcalls == "no" || $COUNTER -lt $maxcalls ) ]]
    then
        echo "," >> $FILE
    fi
done
echo "]" >> $FILE

tr -d "\n\r" < $FILE > $FINAL_FILE
rm $FILE
