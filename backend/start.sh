#!/bin/sh
pm2 flush AS
pm2 delete -s AS || :
pm2 start index.js --name AS -- --color
sleep 1
clear
pm2 logs AS --raw --lines 100