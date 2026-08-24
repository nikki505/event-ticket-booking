#!/bin/bash
# Make the deployed site reachable again.
#
# Two things break access to http://32.236.117.199 and both happen regularly:
#
#   1. This machine gets a new public address. Port 80 on the shared security
#      group only admits one address at a time, so a new address locks you out.
#   2. The teaching account stops the instance on a schedule.
#
# Run this before the demonstration, and any time the site stops answering.
#
#   bash deploy/fix-access.sh
#
# It refreshes the AWS session if needed, adds the address you are on now,
# removes the previous one so the rule list does not grow, starts the instance
# if it is stopped, and waits until the application answers.

set -u

PROFILE=ifn636
INSTANCE=i-04a1250e9732b2449
SG=sg-0cc12e170c4f78181
URL=http://32.236.117.199
STATE_FILE="$(dirname "$0")/.last-allowed-ip"

echo "==> checking the AWS session"
if ! aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
  echo "    session expired, opening the sign in"
  aws sso login --profile "$PROFILE" || { echo "sign in failed"; exit 1; }
fi

MYIP=$(curl -s https://checkip.amazonaws.com | tr -d '\r\n')
echo "==> this machine is $MYIP"

for PORT in 80 22; do
  aws ec2 authorize-security-group-ingress --profile "$PROFILE" --group-id "$SG" \
    --ip-permissions "IpProtocol=tcp,FromPort=$PORT,ToPort=$PORT,IpRanges=[{CidrIp=$MYIP/32,Description='n12202665 EventTix'}]" \
    >/dev/null 2>&1 && echo "    opened tcp/$PORT" || echo "    tcp/$PORT already open for this address"
done

# tidy up the address used last time, so this project leaves one rule behind, not many
if [ -f "$STATE_FILE" ]; then
  OLD=$(cat "$STATE_FILE")
  if [ "$OLD" != "$MYIP" ] && [ -n "$OLD" ]; then
    for PORT in 80 22; do
      aws ec2 revoke-security-group-ingress --profile "$PROFILE" --group-id "$SG" \
        --ip-permissions "IpProtocol=tcp,FromPort=$PORT,ToPort=$PORT,IpRanges=[{CidrIp=$OLD/32}]" \
        >/dev/null 2>&1 && echo "    removed the old rule for $OLD"
    done
  fi
fi
echo "$MYIP" > "$STATE_FILE"

echo "==> checking the instance"
STATE=$(aws ec2 describe-instances --profile "$PROFILE" --instance-ids "$INSTANCE" \
  --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
echo "    state is $STATE"

if [ "$STATE" != "running" ]; then
  echo "    starting it"
  aws ec2 start-instances --profile "$PROFILE" --instance-ids "$INSTANCE" >/dev/null
  aws ec2 wait instance-running --profile "$PROFILE" --instance-ids "$INSTANCE"
  echo "    running"
fi

echo "==> waiting for the application"
for i in $(seq 1 20); do
  CODE=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "$URL/api/health" 2>/dev/null)
  if [ "$CODE" = "200" ]; then
    echo "    answering. open $URL"
    exit 0
  fi
  echo "    attempt $i, HTTP $CODE"
  sleep 15
done

echo "    still not answering after five minutes."
echo "    502 means the proxy is up but the API is not. Check with:"
echo "      ssh -i n12202665-eventtix-key.pem ec2-user@32.236.117.199 'pm2 logs eventtix --lines 40'"
exit 1
