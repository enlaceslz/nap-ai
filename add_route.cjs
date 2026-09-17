const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const importTarget = `import Dashboard from './pages/Dashboard';`;
const importReplacement = `import Dashboard from './pages/Dashboard';
import Customer360 from './pages/customers/Customer360';`;

const routeTarget = `<Route path="dashboard" element={<Dashboard />} />`;
const routeReplacement = `<Route path="dashboard" element={<Dashboard />} />
          <Route path="customer/:id" element={<Customer360 />} />`;

if (!content.includes('Customer360')) {
  content = content.replace(importTarget, importReplacement);
  content = content.replace(routeTarget, routeReplacement);
  fs.writeFileSync(file, content);
  console.log('Added Customer 360 route to App.tsx');
} else {
  console.log('Customer 360 route already exists');
}
