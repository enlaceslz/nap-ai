const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

const hook = `<TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />`;

const inject = `<TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                          className="map-tiles-dark"
                        />`;

code = code.replace(hook, inject);
fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
console.log("TecnicoCampo patched");
