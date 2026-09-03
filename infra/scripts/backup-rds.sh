#!/bin/bash
# Manual RDS snapshot — run this weekly or before any major change.
# Usage: ./backup-rds.sh [db-identifier]
#
# Requires AWS CLI configured with appropriate permissions.

set -e

DB_IDENTIFIER="${1:-skyobserv-postgres}"
SNAPSHOT_ID="${DB_IDENTIFIER}-$(date +%Y%m%d-%H%M)"

echo "Creating snapshot: $SNAPSHOT_ID"

aws rds create-db-snapshot \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region ap-south-1

echo "Snapshot initiated. Check status:"
echo "  aws rds describe-db-snapshots --db-snapshot-identifier $SNAPSHOT_ID --region ap-south-1"

# Clean up snapshots older than 30 days
echo ""
echo "Cleaning up snapshots older than 30 days..."

CUTOFF=$(date -d '30 days ago' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -v-30d +%Y-%m-%dT%H:%M:%S)

aws rds describe-db-snapshots \
  --db-instance-identifier "$DB_IDENTIFIER" \
  --snapshot-type manual \
  --region ap-south-1 \
  --query "DBSnapshots[?SnapshotCreateTime<'${CUTOFF}'].DBSnapshotIdentifier" \
  --output text | tr '\t' '\n' | while read -r old_snap; do
    if [ -n "$old_snap" ]; then
      echo "  Deleting old snapshot: $old_snap"
      aws rds delete-db-snapshot \
        --db-snapshot-identifier "$old_snap" \
        --region ap-south-1
    fi
  done

echo "Done."
