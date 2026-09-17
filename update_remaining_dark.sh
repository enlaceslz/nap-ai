#!/bin/bash
FILES="src/pages/Analytics.tsx src/pages/Automacoes.tsx src/pages/Campanhas.tsx src/pages/ConsultaSGP.tsx src/pages/GenieACSDashboard.tsx src/pages/Operadores.tsx src/pages/SuperAdmin.tsx"

for file in $FILES; do
  echo "Updating $file"
  sed -i 's/bg-slate-50/bg-[#0b0f19]/g' "$file"
  sed -i 's/bg-slate-900\/50/bg-[#0b0f19]\/80/g' "$file"
  sed -i 's/bg-slate-900\/40/bg-[#0b0f19]\/60/g' "$file"
  sed -i 's/bg-slate-900\/30/bg-[#0b0f19]\/40/g' "$file"
  sed -i 's/bg-slate-900/bg-[#101726]/g' "$file"
  sed -i 's/bg-white/bg-[#101726]/g' "$file"
  sed -i 's/border-slate-200/border-white\/5/g' "$file"
  sed -i 's/border-slate-300/border-white\/10/g' "$file"
  sed -i 's/text-slate-900/text-white/g' "$file"
  sed -i 's/text-slate-800/text-slate-200/g' "$file"
  sed -i 's/text-slate-700/text-slate-300/g' "$file"
  sed -i 's/text-slate-600/text-slate-400/g' "$file"
  sed -i 's/text-slate-500/text-slate-500/g' "$file"
  sed -i 's/bg-slate-100/bg-white\/5/g' "$file"
  sed -i 's/bg-slate-200/bg-white\/10/g' "$file"
  sed -i 's/bg-slate-800/bg-white\/10/g' "$file"
  sed -i 's/hover:bg-slate-100/hover:bg-white\/5/g' "$file"
  sed -i 's/hover:bg-slate-50/hover:bg-white\/5/g' "$file"
  sed -i 's/divide-slate-200/divide-white\/5/g' "$file"
  sed -i 's/divide-slate-100/divide-white\/5/g' "$file"
  sed -i 's/shadow-sm/shadow-none/g' "$file"
  
  # Blue highlights for Dark Mode
  sed -i 's/bg-blue-50/bg-blue-500\/10/g' "$file"
  sed -i 's/text-blue-700/text-blue-400/g' "$file"
  sed -i 's/text-blue-600/text-blue-400/g' "$file"
  sed -i 's/hover:text-blue-600/hover:text-blue-400/g' "$file"
  sed -i 's/border-blue-200/border-blue-500\/20/g' "$file"
done
