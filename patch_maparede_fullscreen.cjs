const fs = require('fs');
let code = fs.readFileSync('src/pages/MapaRede.tsx', 'utf8');

// Replace MapController definition
const hookMapController = `const MapController = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || 14, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};`;

const injectMapController = `const MapController = ({ center, zoom, isFullScreen }: { center: [number, number]; zoom?: number; isFullScreen?: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom || 14, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);

  // Corrige falha de renderização de tiles quando a div contêiner do Leaflet muda de tamanho (Fullscreen)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);

  return null;
};`;

code = code.replace(hookMapController, injectMapController);

// Replace MapController invocation
const hookInvocation = `<MapController center={mapCenter} zoom={mapZoom} />`;
const injectInvocation = `<MapController center={mapCenter} zoom={mapZoom} isFullScreen={isFullScreen} />`;

code = code.replace(hookInvocation, injectInvocation);

// Replace FullScreen Toggle to also dispatch event as a backup for nested flex boxes
const hookToggle = `onClick={() => setIsFullScreen(!isFullScreen)}`;
const injectToggle = `onClick={() => {
                setIsFullScreen(!isFullScreen);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
              }}`;
code = code.replace(hookToggle, injectToggle);

fs.writeFileSync('src/pages/MapaRede.tsx', code);
console.log("MapaRede Fullscreen patched");
