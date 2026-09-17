const fs = require('fs');
let code = fs.readFileSync('src/components/PortalLayout.tsx', 'utf8');

if (!code.includes("useTheme();")) {
    // Inject import if not present
    if (!code.includes("useTheme")) {
        code = code.replace("import { useConfig }", "import { useConfig }\nimport { useTheme } from '../contexts/ThemeContext';");
    }
    
    // Inject hook call and useEffect
    const hookInject = `  const { isSupported, permission, requestPermission } = usePushNotifications();
  const { setThemeMode } = useTheme();

  useEffect(() => {
    setThemeMode('light');
  }, []);
`;
    
    code = code.replace("  const { isSupported, permission, requestPermission } = usePushNotifications();", hookInject);
    fs.writeFileSync('src/components/PortalLayout.tsx', code, 'utf8');
    console.log('Portal layout patched for light theme.');
} else {
    console.log('Portal layout already patched.');
}
