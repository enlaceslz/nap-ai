(async () => {
  const res = await fetch('http://localhost:3000/api/gemini/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "Gostaria de pagar a minha fatura",
      history: [{ role: "user", parts: [{ text: "Gostaria de pagar a minha fatura" }] }]
    })
  });
  console.log(res.status);
  const data = await res.text();
  console.log(data);
})();
