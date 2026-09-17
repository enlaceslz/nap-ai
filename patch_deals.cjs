const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the kanbanDeals endpoints with Drizzle

const newDealsLogic = `
  import { atendimentos } from "./src/db/schema";
  import { desc } from "drizzle-orm";

  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await db.select().from(atendimentos).orderBy(desc(atendimentos.createdAt));
      
      // Mapear para o formato camelCase do Frontend
      const formatted = deals.map(d => ({
        id: d.id,
        titulo: d.titulo,
        estagio: d.estagio,
        pipeline: d.pipeline,
        contato: d.contato,
        telefone: d.telefone,
        endereco: d.endereco,
        plano: d.plano,
        prioridade: d.prioridade,
        criado_em: d.criadoEm || "Hoje",
        contexto_ia: d.contextoIa
      }));

      // Se estiver vazio, fallback (para facilitar demo inicial)
      if (formatted.length === 0) {
        return res.json(kanbanDeals);
      }

      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.json(kanbanDeals);
    }
  });

  app.patch("/api/deals/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { estagio, prioridade } = req.body;
    
    try {
      await db.update(atendimentos)
        .set({ estagio, prioridade: prioridade || 2 })
        .where(eq(atendimentos.id, id));
        
      res.json({ success: true });
    } catch(e) {
      // fallback in-memory
      const index = kanbanDeals.findIndex(d => d.id === id);
      if (index !== -1) {
        if (estagio !== undefined) kanbanDeals[index].estagio = estagio;
        if (prioridade !== undefined) kanbanDeals[index].prioridade = prioridade;
      }
      res.json({ success: true, mocked: true });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const novo = req.body;
      const result = await db.insert(atendimentos).values({
        titulo: novo.titulo,
        estagio: novo.estagio || 'Novo Chamado',
        pipeline: novo.pipeline || 'Suporte',
        contato: novo.contato,
        telefone: novo.telefone,
        endereco: novo.endereco,
        plano: novo.plano,
        prioridade: novo.prioridade || 2,
        contextoIa: novo.contexto_ia,
        criadoEm: novo.criado_em || 'Agora'
      }).returning();
      
      res.status(201).json({ id: result[0].id });
    } catch(e) {
      // fallback in memory
      const novo = { id: Date.now(), ...req.body };
      kanbanDeals.push(novo);
      res.status(201).json(novo);
    }
  });
`;

// Simple replacement: we'll replace the existing block.
// To do that safely, let's just find where it is
const replaceStart = '  app.get("/api/deals", (req, res) => {';
const replaceEnd = 'kanbanDeals.push(novo);\n    res.status(201).json(novo);\n  });';

const startIndex = code.indexOf(replaceStart);
const endIndex = code.indexOf(replaceEnd);

if(startIndex > -1 && endIndex > -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex + replaceEnd.length);
  code = before + newDealsLogic + after;
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts deals logic.");
} else {
  console.log("Could not find the block to replace.");
}

