#############################################
# RMIT University Vietnam
# Course: COSC2767|COSC2805 Systems Deployment and Operations
# Semester: 2025B
# Assessment: Assignment 2
# Author: Bui Viet Anh
# ID: s3988393
# Created  date: 14/09/2025
# Last modified: 18/09/2025
# Acknowledgement: None
#############################################

#!/bin/sh
set -e

: "${API_URL:=/api}"          # ⬅️ CHANGED default from http://backend-svc:3000/api to /api
: "${HOST:=0.0.0.0}"
: "${PORT:=8080}"

echo "Using API_URL=${API_URL}"
printf "API_URL=%s\n" "$API_URL" > .env
npm run dev -- --host "${HOST}" --port "${PORT}"
