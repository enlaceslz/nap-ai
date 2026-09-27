/**
 * MAIA V3 — Memory Manager
 * Separação estrita dos tipos de memória e contexto.
 * REGRA INVIOLÁVEL: Memória NÃO é autoridade. Dados operacionais, permissões e tenant
 * derivam exclusivamente das fontes oficiais autenticadas e nunca da memória da IA.
 */

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationMemory {
  sessionId: string;
  turns: ConversationTurn[];
}

export interface CustomerMemory {
  clienteId: number;
  nome?: string;
  preferenciaCanal?: string;
  historicoInteresses?: string[];
  ultimaInteracao?: string;
}

export interface OperationalContext {
  contratoId?: string;
  serialOnu?: string;
  statusConexaoReal?: string;
  faturaPendenteId?: string;
}

export interface KnowledgeContext {
  tenantId: string;
  articles: Array<{ id: string; titulo: string; conteudo: string }>;
}

export class MaiaMemoryManager {
  private static conversationStores = new Map<string, ConversationMemory>();

  public static getConversationMemory(sessionId: string): ConversationMemory {
    if (!this.conversationStores.has(sessionId)) {
      this.conversationStores.set(sessionId, {
        sessionId,
        turns: []
      });
    }
    return this.conversationStores.get(sessionId)!;
  }

  public static appendTurn(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const memory = this.getConversationMemory(sessionId);
    memory.turns.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Limite de janela deslizante (últimos 10 turnos) para economia de contexto
    if (memory.turns.length > 10) {
      memory.turns.splice(0, memory.turns.length - 10);
    }
  }

  public static formatForPrompt(sessionId: string): string {
    const memory = this.conversationStores.get(sessionId);
    if (!memory || memory.turns.length === 0) {
      return '';
    }

    return memory.turns.map(t => `${t.role === 'user' ? 'Usuário' : 'MaIA'}: ${t.content}`).join('\n');
  }

  public static clearSession(sessionId: string): void {
    this.conversationStores.delete(sessionId);
  }
}
