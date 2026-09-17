const fs = require('fs');
let text = fs.readFileSync('src/pages/SuperAdmin.tsx', 'utf8');

const telegramButton = `
            <TabButton 
              active={activeTab === 'telegram'} 
              onClick={() => setActiveTab('telegram')} 
              icon={<MessageCircle size={16} />} 
              label="Telegram & Copilot" 
            />`;

// Replace `<TabButton active={activeTab === 'seguranca'} ... />` with itself + telegramButton
text = text.replace(
  /<TabButton \s*active=\{activeTab === 'seguranca'\}[\s\S]*?label="Segurança & Auditoria"\s*\/>/,
  match => match + telegramButton
);

fs.writeFileSync('src/pages/SuperAdmin.tsx', text, 'utf8');
console.log('Fixed Telegram tab button in SuperAdmin.tsx');
