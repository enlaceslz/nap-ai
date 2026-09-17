import { NapTicket, NapComment, NapWorkOrder } from './domain';

export interface HelpDeskAdapter {
  createTicket(ticket: NapTicket): Promise<string>; // Returns backend ID
  updateTicket(backendId: string, updates: Partial<NapTicket>): Promise<void>;
  getTicket(backendId: string): Promise<NapTicket>;
  closeTicket(backendId: string): Promise<void>;
  reopenTicket(backendId: string): Promise<void>;

  createComment(backendId: string, comment: NapComment): Promise<string>;
  addAttachment(backendId: string, fileData: Buffer, fileName: string): Promise<string>;

  assignTicket(backendId: string, agentBackendId: string): Promise<void>;
  changePriority(backendId: string, priority: string): Promise<void>;
  changeStatus(backendId: string, status: string): Promise<void>;

  createUser(userData: any): Promise<string>;
  updateUser(backendId: string, userData: any): Promise<void>;

  getSLA(): Promise<any[]>;
  getQueues(): Promise<any[]>;
}
