#!/bin/bash

REPORT_FILE="/home/csoc_duty/dhq-duty-manager/deployment_report.log"

{
echo "===================================================="
echo "DHQ Duty Manager - Deployment Status Report"
echo "Generated on: $(date)"
echo "===================================================="
echo ""

echo "--- Service Status ---"
pm2 show backend | grep -E "status|uptime|restarts|cpu|mem|watching"
echo ""

echo "--- Nginx Status ---"
systemctl is-active nginx
echo ""

echo "--- Backend Health Check ---"
curl -s http://localhost/api/health | python3 -m json.tool
echo ""

echo "--- Recent Application Logs ---"
tail -n 20 /home/csoc_duty/.pm2/logs/backend-out.log
echo ""

echo "--- Recent Error Logs ---"
tail -n 20 /home/csoc_duty/.pm2/logs/backend-error.log
echo ""

echo "===================================================="
} > "$REPORT_FILE"

# Also print to terminal
cat "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"
