#!/bin/bash
FILES="src/pages/CRM.tsx src/pages/Inbox.tsx src/pages/Kanban.tsx src/components/Layout.tsx"

for file in $FILES; do
  sed -i 's/bg-slate-900\/50/bg-[#0b0f19]\/80/g' "$file"
  sed -i 's/bg-slate-900\/40/bg-[#0b0f19]\/60/g' "$file"
  sed -i 's/bg-slate-900\/30/bg-[#0b0f19]\/40/g' "$file"
  sed -i 's/bg-slate-900/bg-[#101726]/g' "$file"
  sed -i 's/bg-slate-800/bg-white\/10/g' "$file"
  sed -i 's/text-slate-400/text-slate-400/g' "$file"
done
