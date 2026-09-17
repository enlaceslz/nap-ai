const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const hook = `  // Reiniciar ONU / Roteador Wi-Fi remotamente via TR-069`;

const inject = `
  const bloqueiosWifi = {}; // mac -> { count, timestamp }

  app.post("/api/portal/wifi/remove-device", async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ sucesso: false, erro: "MAC não informado." });

    const deviceIndex = customerWifiConfig.dispositivosConectados.findIndex(d => d.mac === mac);
    if (deviceIndex === -1) {
       return res.status(404).json({ sucesso: false, erro: "Dispositivo não encontrado." });
    }

    const deviceName = customerWifiConfig.dispositivosConectados[deviceIndex].nome;
    customerWifiConfig.dispositivosConectados.splice(deviceIndex, 1);

    if (!bloqueiosWifi[mac]) {
       bloqueiosWifi[mac] = { count: 0 };
    }
    bloqueiosWifi[mac].count += 1;
    bloqueiosWifi[mac].timestamp = Date.now();

    // Simula comando via TR-069
    await new Promise(r => setTimeout(r, 400));

    let sugerirTrocaSenha = false;
    if (bloqueiosWifi[mac].count > 1) {
       sugerirTrocaSenha = true;
    }

    res.json({
      sucesso: true,
      mensagem: \`Dispositivo \${deviceName} removido e bloqueado por 60 minutos na rede Wi-Fi.\`,
      sugerirTrocaSenha
    });
  });

  // Reiniciar ONU / Roteador Wi-Fi remotamente via TR-069`;

code = code.replace(hook, inject);

fs.writeFileSync('server.ts', code);
console.log("Wifi API patched");
