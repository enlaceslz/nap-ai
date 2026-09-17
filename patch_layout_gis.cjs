const fs = require('fs');
let text = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!text.includes('/admin/gis')) {
  text = text.replace(
    "if (path.startsWith('/admin/mapa-rede')) return { title: 'Mapa de Rede (GIS)', category: 'Geolocalização ONTs', icon: <MapPin size={18} className=\"text-emerald-400\" /> };",
    "if (path.startsWith('/admin/mapa-rede')) return { title: 'Mapa de Rede (GIS)', category: 'Geolocalização ONTs', icon: <MapPin size={18} className=\"text-emerald-400\" /> };\n    if (path.startsWith('/admin/gis')) return { title: 'NAP GIS', category: 'Fundação GIS - Parte 01', icon: <MapPin size={18} className=\"text-emerald-400\" /> };"
  );

  text = text.replace(
    "{hasAccess(['tecnico_noc', 'tecnico_campo']) && <NavItem to=\"/admin/mapa-rede\" icon={<MapPin size={18} />} label=\"Mapa de Rede (ONTs)\" badge=\"GIS\" isCollapsed={isCollapsed} />}",
    "{hasAccess(['tecnico_noc', 'tecnico_campo']) && <NavItem to=\"/admin/mapa-rede\" icon={<MapPin size={18} />} label=\"Mapa de Rede (ONTs)\" badge=\"GIS\" isCollapsed={isCollapsed} />}\n              {hasAccess(['tecnico_noc', 'tecnico_campo']) && <NavItem to=\"/admin/gis\" icon={<MapPin size={18} />} label=\"NAP GIS (Google)\" badge=\"BETA\" isCollapsed={isCollapsed} />}"
  );
  
  fs.writeFileSync('src/components/Layout.tsx', text, 'utf8');
  console.log('Layout patched with GIS route');
} else {
  console.log('Already patched');
}
