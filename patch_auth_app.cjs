const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes('import { AuthProvider }')) {
  appCode = appCode.replace(
    "import React from 'react';",
    "import React from 'react';\nimport { AuthProvider } from './contexts/AuthContext';\nimport ProtectedRoute from './components/ProtectedRoute';\nimport Login from './pages/Login';"
  );
  
  appCode = appCode.replace(
    '<BrowserRouter>\n      <Routes>',
    '<AuthProvider>\n      <BrowserRouter>\n        <Routes>\n          <Route path="/login" element={<Login />} />'
  );
  
  appCode = appCode.replace(
    '<Route path="/" element={<Layout />}>',
    '<Route element={<ProtectedRoute />}>\n            <Route path="/" element={<Layout />}>'
  );
  
  appCode = appCode.replace(
    '</Route>\n        {/* Cliente PWA Routes */}',
    '</Route>\n          </Route>\n        {/* Cliente PWA Routes */}'
  );
  
  appCode = appCode.replace(
    '</Routes>\n    </BrowserRouter>',
    '</Routes>\n      </BrowserRouter>\n    </AuthProvider>'
  );

  fs.writeFileSync('src/App.tsx', appCode);
}
console.log('App updated with Auth routing');
