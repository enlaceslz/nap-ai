import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
 signInWithEmailAndPassword, 
 createUserWithEmailAndPassword, 
 signOut, 
 onAuthStateChanged,
 type User as FirebaseUser 
} from 'firebase/auth';
import { auth, db, getUserProfile, saveUserProfile, type UserProfile } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserData {
 id: string;
 email: string;
 name: string;
 role: 'superadmin' | 'admin' | 'operador' | 'tecnico_campo' | 'tecnico_noc' | 'suporte' | 'financeiro';
 provedorId: string;
 ramal?: string;
 veiculo?: string;
 status: 'ativo' | 'inativo';
}

interface AuthContextType {
 isAuthenticated: boolean;
 user: UserData | null;
 firebaseUser: FirebaseUser | null;
 loading: boolean;
 login: (email: string, pass: string) => Promise<void>;
 logout: () => Promise<void>;
 createOperatorAccount: (email: string, pass: string, name: string, role?: string, ramal?: string) => Promise<void>;
 switchMockUser: (target: 'admin' | 'operador' | 'tecnico1' | 'tecnico2') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
 const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
 const [user, setUser] = useState<UserData | null>(null);
 const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 // Verifica se existe sessão salva localmente antes
 const localAuth = localStorage.getItem('nap_auth');
 if (localAuth) {
  try {
   const parsed = JSON.parse(localAuth);
   if (parsed && parsed.id && parsed.email) {
    setUser(parsed);
    setIsAuthenticated(true);
    setLoading(false);
   }
  } catch (e) {}
 }

 // Trava de segurança para garantir que o estado de loading não congele a interface
 const fallbackTimer = setTimeout(() => {
  setLoading(false);
 }, 1500);

 // Monitora o estado de autenticação do Firebase em tempo real
 let unsubscribeUserDoc: (() => void) | null = null;

 const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
 setFirebaseUser(fbUser);

 if (fbUser) {
 try {
 // Escuta o perfil no Firestore em tempo real
 const userRef = doc(db, 'users', fbUser.uid);
 unsubscribeUserDoc = onSnapshot(userRef, async (docSnap) => {
 if (docSnap.exists()) {
 const data = docSnap.data() as UserProfile;
 const formatted: UserData = {
 id: fbUser.uid,
 email: data.email || fbUser.email || '',
 name: data.nome || fbUser.displayName || data.email?.split('@')[0] || 'Operador',
 role: data.role || 'operador',
 provedorId: data.provedorId || 'nap-default',
 status: data.status || 'ativo',
 ramal: (data as any).ramal || '2001'
 };
 setUser(formatted);
 setIsAuthenticated(true);
 localStorage.setItem('nap_auth', JSON.stringify(formatted));
 } else {
 // Primeiro acesso deste usuário: cria o perfil no Firestore
 const isDefaultAdmin = fbUser.email === 'admin@nap.local' || fbUser.email === 'andreljp@nap.local' || fbUser.email === 'admin@provedor.com.br' || fbUser.email === 'andreljp@gmail.com';
 const newProfile: UserProfile = {
 id: fbUser.uid,
 email: fbUser.email || '',
 nome: fbUser.displayName || (isDefaultAdmin ? 'Administrador Geral' : 'Operador DJD'),
 role: isDefaultAdmin ? 'superadmin' : 'operador',
 provedorId: 'nap-default',
 status: 'ativo',
 criadoEm: new Date().toISOString()
 };
 await saveUserProfile(newProfile);
 const formatted: UserData = {
 id: newProfile.id,
 email: newProfile.email,
 name: newProfile.nome,
 role: newProfile.role,
 provedorId: newProfile.provedorId,
 status: newProfile.status,
 ramal: '2001'
 };
 setUser(formatted);
 setIsAuthenticated(true);
 localStorage.setItem('nap_auth', JSON.stringify(formatted));
 }
 setLoading(false);
 }, (err) => {
 console.warn('Erro ao escutar perfil do usuário no Firestore:', err);
 // Fallback usando dados do auth
 const fallbackUser: UserData = {
 id: fbUser.uid,
 email: fbUser.email || '',
 name: fbUser.email?.split('@')[0] || 'Operador',
 role: (fbUser.email === 'admin@nap.local' || fbUser.email === 'andreljp@nap.local' || fbUser.email === 'admin@provedor.com.br' || fbUser.email === 'andreljp@gmail.com') ? 'superadmin' : 'operador',
 provedorId: 'nap-default',
 status: 'ativo',
 ramal: '2001'
 };
 setUser(fallbackUser);
 setIsAuthenticated(true);
 setLoading(false);
 });
 } catch (err) {
  console.warn('[Fallback] Perfil não sincronizado no Firestore (mantendo sessão):', err);
  setLoading(false);
 }
 } else {
 // Usuário deslogado no Firebase
 if (unsubscribeUserDoc) {
 unsubscribeUserDoc();
 unsubscribeUserDoc = null;
 }
 setUser(null);
 setIsAuthenticated(false);
 localStorage.removeItem('nap_auth');
 setLoading(false);
 }
 });

 return () => {
  clearTimeout(fallbackTimer);
  unsubscribeAuth();
  if (unsubscribeUserDoc) unsubscribeUserDoc();
 };
 }, []);

 const login = async (username: string, pass: string) => {
 try {
 // Formata o username como um e-mail interno (spoofing) caso o usuário não tenha digitado o domínio
 const formattedEmail = username.includes('@') ? username.trim() : `${username.trim()}@nap.local`;
 
 const getMockUserProfile = (emailStr: string): UserData => {
 const lower = emailStr.toLowerCase();
 if (lower.includes('tecnico1') || lower.includes('carlos') || lower.includes('campo')) {
 return {
 id: 'mock-tecnico-1',
 email: 'tecnico_campo@provedor.com.br',
 name: 'Carlos Mendes (Campo)',
 role: 'tecnico_campo',
 provedorId: 'nap-default',
 veiculo: 'Fiorino Tech 01 (ABC-4D21)',
 status: 'ativo'
 };
 }
 if (lower.includes('tecnico2') || lower.includes('lucas') || lower.includes('noc')) {
 return {
 id: 'mock-tecnico-2',
 email: 'tecnico_noc@provedor.com.br',
 name: 'Lucas Ferreira (NOC)',
 role: 'tecnico_noc',
 provedorId: 'nap-default',
 status: 'ativo'
 };
 }
 if (lower.includes('operador') || lower.includes('suporte') || lower.includes('mariana')) {
 return {
 id: 'mock-operador-1',
 email: 'operador@provedor.com.br',
 name: 'Mariana Costa',
 role: 'operador',
 provedorId: 'nap-default',
 ramal: '2001',
 status: 'ativo'
 };
 }
 // Admin padrão
 return {
 id: 'mock-admin-1',
 email: 'admin@provedor.com.br',
 name: 'Roberto Oliveira',
 role: 'admin',
 provedorId: 'nap-default',
 ramal: '2000',
 status: 'ativo'
 };
 };

 const activateMockSession = () => {
 // Trava de Autenticação para Produção
 if (import.meta.env.MODE === 'production') {
  console.warn('[Auth] Tentativa de ativação de sessão mock em produção foi bloqueada.');
  throw new Error('Falha na autenticação. Verifique seu e-mail e senha.');
 }

 console.warn('Fallback para sessão local de desenvolvimento (DJD Multi-Papel).');
 const mockUser = getMockUserProfile(formattedEmail);
 setUser(mockUser);
 setIsAuthenticated(true);
 localStorage.setItem('nap_auth', JSON.stringify(mockUser));
 };


 try {
 // 0. Tenta autenticar via API Node.js/Postgres (Drizzle)
 const response = await fetch('/api/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email: formattedEmail, password: pass })
 });
 
 const data = await response.json();
 
 if (response.ok) {
 const dbUser = {
 id: data.id,
 email: data.email,
 name: data.name,
 role: data.role,
 provedorId: 'nap-postgres',
 status: data.status
 };
 setUser(dbUser);
 setIsAuthenticated(true);
 localStorage.setItem('nap_auth', JSON.stringify(dbUser));
 return;
 } else if (response.status === 401 || response.status === 403) {
 // A API rejeitou a senha ou usuário
 throw new Error(data.error || 'Credenciais inválidas no banco de dados.');
 } else {
 // Erro 500 (banco offline), cai pro try/catch abaixo (Firebase/Mock fallback)
 throw new Error('DatabaseConnectError');
 }
 } catch (dbErr: any) {
 if (dbErr.message !== 'DatabaseConnectError' && dbErr.message !== 'Failed to fetch') {
 // Erro real de validação
 throw dbErr;
 }
 console.warn('Banco de dados inacessível ou não configurado. Tentando fallback para Firebase/Mock...');
 }

 try {
 // 1. Tenta autenticar no Firebase Auth
 await signInWithEmailAndPassword(auth, formattedEmail, pass);
 } catch (err: any) {
 
 if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
 if (import.meta.env.MODE === 'production') {
 throw new Error('Serviço de autenticação temporariamente indisponível.');
 }
 activateMockSession();
 return; // Success (Mocked)
 }

 // Se for a conta padrão do sistema e ainda não existir no Firebase Auth, provisiona automaticamente
 if (
 (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
 (formattedEmail === 'admin@nap.local' || formattedEmail === 'andreljp@nap.local' || formattedEmail === 'admin@provedor.com.br' || formattedEmail === 'andreljp@gmail.com')
 ) {
 try {
 const cred = await createUserWithEmailAndPassword(auth, formattedEmail, pass);
 const initialProfile: UserProfile = {
 id: cred.user.uid,
 email: cred.user.email || formattedEmail,
 nome: 'Administrador Geral',
 role: 'superadmin',
 provedorId: 'nap-default',
 status: 'ativo',
 criadoEm: new Date().toISOString()
 };
 await saveUserProfile(initialProfile);
 return;
 } catch (createErr: any) {
  console.warn('[Auth] Provisionamento padrão em modo local:', createErr?.message || createErr);
  if (createErr.code === 'auth/operation-not-allowed') {
  activateMockSession();
  return;
  }
  throw new Error('Falha na autenticação. Verifique seu e-mail e senha.');
  }
  }

  if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
  if (import.meta.env.MODE === 'production') {
  throw new Error('E-mail ou senha incorretos.');
  }
  activateMockSession();
  return;
  } else if (err.code === 'auth/invalid-email') {
  throw new Error('Formato de e-mail inválido.');
  } else if (err.code === 'auth/user-disabled') {
  throw new Error('Esta conta foi desativada pelo administrador.');
  } else {
  console.warn("[Auth] Resiliência de autenticação:", err?.message || err);
  if (import.meta.env.MODE === 'production') {
  throw new Error('Erro ao conectar com o serviço de autenticação.');
  }
  console.warn("Forcing mock session fallback...");
  activateMockSession();
  return;
  }
 }
 } catch (outerErr: any) {
 throw outerErr;
 }
 };

 const logout = async () => {
 try {
 if (user?.id !== 'mock-local-id-123') {
 await signOut(auth);
 }
 } catch (e) {
 console.warn('Erro ao deslogar no Firebase:', e);
 } finally {
 localStorage.removeItem('nap_auth');
 setIsAuthenticated(false);
 setUser(null);
 setFirebaseUser(null);
 }
 };

 const createOperatorAccount = async (
 username: string, 
 pass: string, 
 name: string, 
 role: string = 'operador',
 ramal: string = '2001'
 ) => {
 try {
 const formattedEmail = username.includes('@') ? username.trim() : `${username.trim()}@nap.local`;
 const cred = await createUserWithEmailAndPassword(auth, formattedEmail, pass);
 const profile: UserProfile = {
 id: cred.user.uid,
 email: formattedEmail,
 nome: name.trim(),
 role: role as any,
 provedorId: 'nap-default',
 status: 'ativo',
 criadoEm: new Date().toISOString()
 };
 await saveUserProfile(profile);
 } catch (err: any) {
 if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
 throw new Error('O login por E-mail/Senha não está habilitado. Ative este provedor no Console do Firebase (Authentication > Sign-in method).');
 }
 throw new Error(err.message || 'Erro ao cadastrar operador no Firebase.');
 }
 };

 const switchMockUser = (target: 'admin' | 'operador' | 'tecnico1' | 'tecnico2') => {
 let targetUser: UserData;
 if (target === 'tecnico1') {
 targetUser = {
 id: 'mock-tecnico-1',
 email: 'tecnico_campo@provedor.com.br',
 name: 'Carlos Mendes (Campo)',
 role: 'tecnico_campo',
 provedorId: 'nap-default',
 veiculo: 'Fiorino Tech 01 (ABC-4D21)',
 status: 'ativo'
 };
 } else if (target === 'tecnico2') {
 targetUser = {
 id: 'mock-tecnico-2',
 email: 'tecnico_noc@provedor.com.br',
 name: 'Lucas Ferreira (NOC)',
 role: 'tecnico_noc',
 provedorId: 'nap-default',
 status: 'ativo'
 };
 } else if (target === 'operador') {
 targetUser = {
 id: 'mock-operador-1',
 email: 'operador@provedor.com.br',
 name: 'Mariana Costa',
 role: 'operador',
 provedorId: 'nap-default',
 ramal: '2001',
 status: 'ativo'
 };
 } else {
 targetUser = {
 id: 'mock-admin-1',
 email: 'admin@provedor.com.br',
 name: 'Roberto Oliveira',
 role: 'admin',
 provedorId: 'nap-default',
 ramal: '2000',
 status: 'ativo'
 };
 }

 setUser(targetUser);
 setIsAuthenticated(true);
 localStorage.setItem('nap_auth', JSON.stringify(targetUser));
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-card flex items-center justify-center">
 <div className="flex flex-col items-center gap-3">
 <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
 <span className="text-xs font-mono text-muted-foreground">Conectando ao Firebase Auth...</span>
 </div>
 </div>
 );
 }

 return (
 <AuthContext.Provider value={{ isAuthenticated, user, firebaseUser, loading, login, logout, createOperatorAccount, switchMockUser }}>
 {children}
 </AuthContext.Provider>
 );
};

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth must be used within AuthProvider');
 return context;
};
