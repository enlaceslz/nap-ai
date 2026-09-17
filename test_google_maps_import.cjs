const fs = require('fs');

const files = [
  'src/pages/GisDashboard.tsx',
  'src/pages/Analytics.tsx', 
  'src/pages/TecnicoCampo.tsx'
];

let foundGoogleMaps = false;

files.forEach(file => {
  if(fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('mt1.google.com')) {
      console.log(`Found Google Maps API URL in ${file}`);
      foundGoogleMaps = true;
    }
  }
});

if (!foundGoogleMaps) {
  console.log('No Google Maps API URLs found in other files.');
}
