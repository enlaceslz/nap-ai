const fs = require('fs');
let code = fs.readFileSync('src/components/PortalSpeedtestModal.tsx', 'utf8');

code = code.replace(`
    // 2. Medição de Download com aceleração realista
    setPhase('download');
    const targetDownload = 500 + (Math.random() * 20 - 5);`, `
    // 2. Medição de Download com aceleração realista
    setPhase('download');
    const variationDown = Math.random() * (velocidadeNominal * 0.05) - (velocidadeNominal * 0.02); // -2% to +3%
    const targetDownload = velocidadeNominal + variationDown;`);

code = code.replace(`
    // 3. Medição de Upload
    setPhase('upload');
    const targetUpload = 250 + (Math.random() * 15 - 5);`, `
    // 3. Medição de Upload
    setPhase('upload');
    const isSimetrico = planoNome.toLowerCase().includes('simétrico') || planoNome.toLowerCase().includes('simetrico');
    const baseUpload = isSimetrico ? velocidadeNominal : velocidadeNominal * 0.5;
    const variationUp = Math.random() * (baseUpload * 0.05) - (baseUpload * 0.02);
    const targetUpload = baseUpload + variationUp;`);

fs.writeFileSync('src/components/PortalSpeedtestModal.tsx', code);
console.log("PortalSpeedtestModal patched");
