const fs = require('fs');
let code = fs.readFileSync('src/pages/Analytics.tsx', 'utf8');

const hook = `<TileLayer
                              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />`;

const inject = `<TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              className="map-tiles-dark"
                            />`;

code = code.replace(hook, inject);

fs.writeFileSync('src/pages/Analytics.tsx', code);
console.log("Analytics patched");
