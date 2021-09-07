qtyProcess=`ps -ef | grep "analyze.js" | wc -l`
echo $qtyProcess

	if [ $qtyProcess -lt 10 ]
then
	nodejs /home/diogo/technicaldebt/tdlearning-node/build/command/analyze.js --path $1 --skip $2 --limit $3
fi


