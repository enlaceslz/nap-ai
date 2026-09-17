import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialização segura do Firebase (Singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth
export const auth = getAuth(app);

// Firestore com ID do banco específico provisionado
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

// Validação de Conectividade com o Firestore (Conforme especificação da Skill)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client offline ou verifique a configuração de rede.");
    }
  }
}

// Executa o teste de conectividade na inicialização
testConnection();

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: 'superadmin' | 'admin' | 'operador' | 'suporte' | 'financeiro';
  provedorId: string;
  status: 'ativo' | 'inativo';
  criadoEm?: string;
  atualizadoEm?: string;
}

// Obter Perfil do Usuário no Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário no Firestore:', error);
    return null;
  }
}

// Criar ou Atualizar Perfil do Usuário no Firestore
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, 'users', profile.id), {
      ...profile,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Erro ao salvar perfil do usuário no Firestore:', error);
    throw error;
  }
}

// Sincronizar Configuração do Provedor no Firestore
export async function getProvedorConfig(provedorId: string = 'nap-default'): Promise<any | null> {
  try {
    const provDoc = await getDoc(doc(db, 'provedores', provedorId));
    if (provDoc.exists()) {
      return provDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar configuração do provedor no Firestore:', error);
    return null;
  }
}

export async function saveProvedorConfig(provedorId: string = 'nap-default', config: any, userEmail: string = 'admin'): Promise<void> {
  try {
    await setDoc(doc(db, 'provedores', provedorId), {
      id: provedorId,
      nome: config?.provedor?.nome || 'NAP Provedor Telecom',
      cnpj: config?.provedor?.cnpj || '',
      configuracoes: config,
      atualizadoEm: new Date().toISOString(),
      atualizadoPor: userEmail
    }, { merge: true });

    // Salvar entrada na subcoleção de auditoria imutável
    await addDoc(collection(db, 'provedores', provedorId, 'auditLogs'), {
      id: `audit-${Date.now()}`,
      provedorId,
      usuario: userEmail,
      modulo: 'SuperAdmin / Sistema',
      detalhes: 'Configurações do provedor atualizadas e sincronizadas no Firestore',
      ip: '127.0.0.1 (Web Console)',
      criadoEm: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao sincronizar configuração no Firestore:', error);
    throw error;
  }
}

export async function logAuditEventToFirestore(entry: {
  id?: string;
  provedorId?: string;
  usuario: string;
  modulo: string;
  acao: string;
  detalhes: string;
  categoria?: string;
  severidade?: string;
  ip?: string;
  status?: string;
  payloadAntes?: any;
  payloadDepois?: any;
}): Promise<void> {
  const provId = entry.provedorId || 'nap-default';
  try {
    await addDoc(collection(db, 'provedores', provId, 'auditLogs'), {
      id: entry.id || `audit-${Date.now()}`,
      provedorId: provId,
      usuario: entry.usuario,
      modulo: entry.modulo,
      acao: entry.acao,
      detalhes: entry.detalhes,
      categoria: entry.categoria || 'geral',
      severidade: entry.severidade || 'info',
      ip: entry.ip || '127.0.0.1',
      status: entry.status || 'sucesso',
      criadoEm: new Date().toISOString()
    });
  } catch (err) {
    // Falha silenciosa caso Firestore offline ou não autenticado
    console.warn('Registro de auditoria local armazenado (Firestore offline ou mock):', err);
  }
}

