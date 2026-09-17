const fs = require('fs');

const file = 'src/pages/MapaRede.tsx';
let content = fs.readFileSync(file, 'utf8');

// The hybrid layer now only shows Esri Satellite, but it's supposed to be Hybrid (Satellite + Streets).
// Let's add the CartoDB Voyager Only Labels (or just CartoDB Dark Matter Only Labels) over it, or just leave it as Satellite.
// Actually, since there's already a 'satellite' button, having 'hybrid' do the same thing is redundant.
// Let's make 'hybrid' load Esri Satellite AND Carto Positron Only Labels.

const hybridReplacement = `
            {mapLayer === 'hybrid' && (
              <>
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={20}
                />
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                  maxZoom={20}
                />
              </>
            )}
`;

content = content.replace(
  /\{mapLayer === 'hybrid' && \(\s*<TileLayer\s*attribution='&copy; <a href="https:\/\/www\.esri\.com">Esri<\/a>, Maxar, Earthstar Geographics'\s*url="https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}"\s*maxZoom=\{20\}\s*\/>\s*\)\}/g,
  hybridReplacement.trim()
);

fs.writeFileSync(file, content);
console.log('Fixed hybrid maps in', file);
