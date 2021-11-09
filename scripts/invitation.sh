#/bin/bash
nodejs /home/diogo/technicaldebt/tdlearning-node/build/command/invite-developers.js --limit 1

nodejs /home/diogo/technicaldebt/tdlearning-node/build/command/update-email-status.js --limit 1

nodejs /home/diogo/technicaldebt/tdlearning-node/build/command/send-emails.js --limit 1 --ignoreHourLock false
