import express from 'express';

// Mock GeoJSON data for the GIS Dashboard
export const setupGisRoutes = (app: express.Express) => {
  const router = express.Router();

  router.get('/features', (req, res) => {
    // Return mock features (CTOs, Drop cables) for map rendering
    const features = [
      {
        id: 'cto-1',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-44.2989, -2.5297] },
        properties: { name: 'CTO-01', status: 'online', layer_id: 'cto', vendor: 'Huawei' }
      },
      {
        id: 'cto-2',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-44.3000, -2.5300] },
        properties: { name: 'CTO-02', status: 'warning', layer_id: 'cto', vendor: 'ZTE' }
      }
    ];
    res.json({ success: true, features });
  });

  app.use('/api/gis', router);
};
