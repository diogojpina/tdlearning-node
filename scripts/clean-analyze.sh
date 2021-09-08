#!/bin/bash
IDS=`ps -ef | grep "analyze.js" | tr -s ' ' | cut -d ' ' -f 2`

NOW=`date +"%s"`
for id in $IDS; do
	#echo "PID: $id"
	FILE="/proc/$id"
	if [ -e "$FILE" ]; then
		#echo "$FILE exists."
		processTime=`stat -c%X $FILE`	
		diff=$(($NOW - $processTime))
		#echo "DIFF: $diff"

		if [ $diff -gt 2000 ]; then
			echo "killing PID $id"
			kill -9 $id
		fi
	fi
done
