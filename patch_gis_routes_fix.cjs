const fs = require('fs');
let text = fs.readFileSync('server/gis/gisRoutes.ts', 'utf8');

text = text.replace(
  `} catch (error) {\n    res.status(500).json({ error: 'Erro ao analisar impacto' });\n  }\n});\n  } catch (error) {\n    res.status(500).json({ error: 'Erro ao analisar impacto' });\n  }\n});`,
  `} catch (error) {\n    res.status(500).json({ error: 'Erro ao analisar impacto' });\n  }\n});`
);

fs.writeFileSync('server/gis/gisRoutes.ts', text, 'utf8');
