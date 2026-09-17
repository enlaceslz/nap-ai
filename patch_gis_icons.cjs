const fs = require('fs');
let text = fs.readFileSync('src/pages/GisDashboard.tsx', 'utf8');

text = text.replace(
  "import { Search, Layers, Server, MapPin, Wifi, X, Bot, Send, Loader2 } from 'lucide-react';",
  "import { Search, Layers, Server, MapPin, Wifi, X, Bot, Send, Loader2, Activity, AlertTriangle } from 'lucide-react';"
);

fs.writeFileSync('src/pages/GisDashboard.tsx', text, 'utf8');
console.log('Fixed missing lucide icons in GisDashboard');
