const fs = require('fs');
let text = fs.readFileSync('src/App.tsx', 'utf8');

if (!text.includes('GisDashboard')) {
  text = text.replace(
    'import MapaRede from "./pages/MapaRede";',
    'import MapaRede from "./pages/MapaRede";\nimport GisDashboard from "./pages/GisDashboard";'
  );

  text = text.replace(
    '<Route index element={<MapaRede />} />\n                </Route>',
    '<Route index element={<MapaRede />} />\n                </Route>\n                <Route path="gis" element={<ProtectedRoute allowedRoles={["tecnico_noc", "tecnico_campo"]} />}>\n                  <Route index element={<GisDashboard />} />\n                </Route>'
  );
  
  fs.writeFileSync('src/App.tsx', text, 'utf8');
  console.log('App.tsx routes patched');
} else {
  console.log('Already patched');
}
