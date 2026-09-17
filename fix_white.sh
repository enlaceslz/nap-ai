#!/bin/bash
FILES="src/pages/Inbox.tsx src/pages/Kanban.tsx"

for file in $FILES; do
  sed -i 's/bg-white\/5/bg-white\/[0.02]/g' "$file"
  sed -i 's/border-white\/5/border-white\/10/g' "$file"
  sed -i 's/border-white\/10\/80/border-white\/10/g' "$file"
done
