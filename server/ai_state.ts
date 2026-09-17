export interface AiAlert {
  id: string;
  type: 'QUOTA_EXHAUSTED' | 'RATE_LIMIT' | 'GATEWAY_ERROR' | 'FAILOVER_TRIGGERED';
  message: string;
  provider: string;
  details?: any;
  timestamp: string;
}

export const aiAlerts: AiAlert[] = [];
