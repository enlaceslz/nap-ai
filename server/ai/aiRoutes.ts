import express from 'express';
import { nocCopilotInstance } from './nocCopilot';

const router = express.Router();

router.post('/copilot', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório' });

    const response = await nocCopilotInstance.processQuery(prompt, history);
    res.json({ success: true, text: response });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no Copilot' });
  }
});

export default router;
