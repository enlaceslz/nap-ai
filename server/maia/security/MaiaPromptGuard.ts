/**
 * MAIA V3 — Prompt Injection Guard
 * Detecta, classifica e neutraliza tentativas de injeção de prompt ou jailbreak
 * sem interromper desnecessariamente a experiência do usuário legítimo.
 */

export type PromptThreatLevel = 'SAFE' | 'LOW_SUSPICION' | 'INJECTION_ATTEMPT' | 'POLICY_BYPASS_ATTEMPT';

export interface GuardAnalysisResult {
  threatLevel: PromptThreatLevel;
  detectedPatterns: string[];
  sanitizedPrompt: string;
  isFlagged: boolean;
  isolationNotice?: string;
}

export class MaiaPromptGuard {
  private static readonly INJECTION_PATTERNS: Array<{ regex: RegExp; threat: PromptThreatLevel; label: string }> = [
    { regex: /ignore\s+(as\s+)?(todas\s+as\s+)?(instruções|orientações|regras)(\s+anteriores)?/i, threat: 'INJECTION_ATTEMPT', label: 'IGNORE_PREVIOUS_INSTRUCTIONS' },
    { regex: /você\s+agora\s+é\s+(o\s+)?(administrador|admin|root|superusuário|desenvolvedor)/i, threat: 'POLICY_BYPASS_ATTEMPT', label: 'ROLE_ELEVATION_ATTEMPT' },
    { regex: /ignore\s+(a\s+)?pol[íi]tica(\s+de\s+seguran[çc]a)?/i, threat: 'POLICY_BYPASS_ATTEMPT', label: 'IGNORE_POLICY_ATTEMPT' },
    { regex: /(mostre|revele|exiba|imprima)\s+(os\s+)?(seus\s+)?(segredos|tokens|senhas|api[_\s]?keys)/i, threat: 'INJECTION_ATTEMPT', label: 'SECRET_EXTRACTION_ATTEMPT' },
    { regex: /(mostre|revele|exiba|diga|copie)\s+(o\s+)?(seu\s+)?(system[_\s]?prompt|prompt\s+raiz|instru[çc][õo]es\s+do\s+sistema)/i, threat: 'INJECTION_ATTEMPT', label: 'SYSTEM_PROMPT_LEAK_ATTEMPT' },
    { regex: /(execute|confirme|rode)\s+(sem|dispensando)\s+confirma[çc][ãa]o/i, threat: 'POLICY_BYPASS_ATTEMPT', label: 'CONFIRMATION_BYPASS_ATTEMPT' },
    { regex: /desconsidere\s+as\s+diretrizes/i, threat: 'INJECTION_ATTEMPT', label: 'DISREGARD_GUIDELINES' },
    { regex: /modo\s+(dan|developer\s+mode|unrestricted|jailbreak)/i, threat: 'INJECTION_ATTEMPT', label: 'JAILBREAK_MODE' }
  ];

  public static analyze(prompt: string): GuardAnalysisResult {
    const raw = prompt || '';
    const detected: string[] = [];
    let maxThreat: PromptThreatLevel = 'SAFE';

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.regex.test(raw)) {
        detected.push(pattern.label);
        if (pattern.threat === 'POLICY_BYPASS_ATTEMPT') {
          maxThreat = 'POLICY_BYPASS_ATTEMPT';
        } else if (pattern.threat === 'INJECTION_ATTEMPT' && maxThreat !== 'POLICY_BYPASS_ATTEMPT') {
          maxThreat = 'INJECTION_ATTEMPT';
        }
      }
    }

    if (detected.length === 0) {
      return {
        threatLevel: 'SAFE',
        detectedPatterns: [],
        sanitizedPrompt: raw,
        isFlagged: false
      };
    }

    // Isolar o conteúdo potencialmente malicioso
    const isolationNotice = `[PROMPT_GUARD_FLAG: Tentativa de manipulação detectada (${detected.join(', ')}). A MaIA opera sob diretrizes invioláveis do Enlace Policy Engine.]`;
    
    // Higienizar removendo padrões mais agressivos mantendo o cerne da consulta
    let sanitized = raw;
    for (const pattern of this.INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, '[tentativa de comando anulada]');
    }

    return {
      threatLevel: maxThreat,
      detectedPatterns: detected,
      sanitizedPrompt: sanitized.trim(),
      isFlagged: true,
      isolationNotice
    };
  }
}
