/**
 * MAIA V3 — Knowledge Service (RAG)
 * Gerenciamento de base de conhecimento com isolamento estrito por tenantId (ISP).
 * Um ISP jamais pode acessar documentos de outro.
 */

import crypto from "crypto";

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  sourceId: string;
  sourceType: 'manual' | 'contrato_adesao' | 'faq' | 'politica_privacidade' | 'procedimento_noc';
  version: string;
  classification: 'public' | 'internal' | 'confidential';
  titulo: string;
  conteudo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export class MaiaKnowledgeService {
  private static documents: KnowledgeDocument[] = [];

  /**
   * Adiciona ou atualiza documento garantindo isolamento por tenantId
   */
  public static registerDocument(doc: Partial<KnowledgeDocument> & { tenantId: string; titulo: string; conteudo: string }): void {
    const fullDoc: KnowledgeDocument = {
      id: doc.id || `doc_${crypto.randomUUID()}`,
      tenantId: doc.tenantId,
      sourceId: doc.sourceId || 'manual',
      sourceType: doc.sourceType || 'manual',
      version: doc.version || '1.0',
      classification: (doc.classification as any) || 'public',
      titulo: doc.titulo,
      conteudo: doc.conteudo,
      tags: doc.tags || [],
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
      expiresAt: doc.expiresAt
    };

    const idx = this.documents.findIndex(d => d.id === fullDoc.id && d.tenantId === fullDoc.tenantId);
    if (idx >= 0) {
      this.documents[idx] = fullDoc;
    } else {
      this.documents.push(fullDoc);
    }
  }

  /**
   * Busca artigos relevantes estritamente dentro do tenant do usuário
   */
  public static query(params: {
    tenantId: string;
    query: string;
    maxResults?: number;
  }): KnowledgeDocument[] {
    const { tenantId, query, maxResults = 3 } = params;
    const qLower = (query || '').toLowerCase();

    // FILTRO ABSOLUTO POR TENANT ID — IMPEDE CROSS-TENANT DATA LEAKAGE
    const tenantDocs = this.documents.filter(d => d.tenantId === tenantId);

    // Filtrar documentos não expirados
    const now = new Date().toISOString();
    const activeDocs = tenantDocs.filter(d => !d.expiresAt || d.expiresAt > now);

    const terms = qLower.split(/\s+/).filter(w => w.length > 2);
    const matches = activeDocs.filter(d => {
      const text = `${d.titulo} ${d.conteudo} ${(d.tags || []).join(' ')}`.toLowerCase();
      return text.includes(qLower) || (terms.length > 0 && terms.some(term => text.includes(term)));
    });

    return matches.slice(0, maxResults);
  }
}
