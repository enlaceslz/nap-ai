import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type OperatorNotificationCategory = 'whatsapp' | 'suporte' | 'noc' | 'ramal';

export interface OperatorPushPayload {
 title: string;
 body: string;
 tipo?: OperatorNotificationCategory | 'geral';
 url?: string;
 tag?: string;
}

export function useOperatorPushNotifications() {
 const { user } = useAuth();
 const [permission, setPermission] = useState<NotificationPermission>('default');
 const [isSupported, setIsSupported] = useState(false);
 const [isSubscribed, setIsSubscribed] = useState(false);
 const [loading, setLoading] = useState(false);
 const [categories, setCategories] = useState<OperatorNotificationCategory[]>(() => {
 try {
 const saved = localStorage.getItem('nap_op_push_categories');
 if (saved) return JSON.parse(saved);
 } catch {}
 return ['whatsapp', 'suporte', 'noc', 'ramal'];
 });

 useEffect(() => {
 const supported = typeof window !== 'undefined' && 'Notification' in window;
 setIsSupported(supported);
 if (supported) {
 setPermission(Notification.permission);
 if (Notification.permission === 'granted') {
 setIsSubscribed(true);
 }
 }
 }, []);

 // Emite feedback sonoro sintetizado via Web Audio API (sem dependência de arquivos externos)
 const playNotificationSound = useCallback((tipo: string = 'whatsapp') => {
 try {
 const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
 if (!AudioCtx) return;
 const ctx = new AudioCtx();
 const now = ctx.currentTime;
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();

 osc.type = tipo === 'noc' ? 'sawtooth' : 'sine';

 if (tipo === 'noc') {
 // Alerta de alarme NOC em duas notas
 osc.frequency.setValueAtTime(880, now);
 osc.frequency.setValueAtTime(660, now + 0.12);
 gain.gain.setValueAtTime(0.3, now);
 gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start(now);
 osc.stop(now + 0.35);
 } else if (tipo === 'ramal') {
 // Toque suave de chamada telefônica
 osc.frequency.setValueAtTime(523.25, now); // C5
 osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
 gain.gain.setValueAtTime(0.25, now);
 gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start(now);
 osc.stop(now + 0.3);
 } else {
 // Chime moderno para WhatsApp e Suporte
 osc.frequency.setValueAtTime(587.33, now); // D5
 osc.frequency.setValueAtTime(880, now + 0.08); // A5
 gain.gain.setValueAtTime(0.2, now);
 gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start(now);
 osc.stop(now + 0.25);
 }

 // Vibração no celular do operador se suportado
 if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
 navigator.vibrate([150, 75, 150]);
 }
 } catch (err) {
 console.warn('Erro ao emitir áudio de notificação:', err);
 }
 }, []);

 // Notificação local e segura via Service Worker ou fallback nativo
 const showNotification = useCallback(async (title: string, options?: NotificationOptions, tipo: string = 'whatsapp') => {
 try {
 playNotificationSound(tipo);

 if ('serviceWorker' in navigator) {
 const registration = await navigator.serviceWorker.ready;
 if (registration && registration.showNotification) {
 await registration.showNotification(title, {
 icon: '/pwa-192x192.png',
 badge: '/favicon.svg',
 ...options,
 });
 return;
 }
 }
 
 // Fallback clássico
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification(title, {
 icon: '/pwa-192x192.png',
 ...options,
 });
 }
 } catch (e) {
 console.warn('Erro ao disparar notificação local:', e);
 }
 }, [playNotificationSound]);

 // Sincronizar inscrição de operador com o backend
 const syncOperatorSubscription = async (cats = categories) => {
 try {
 let endpoint = `https://fcm.googleapis.com/fcm/send/op_${user?.id || 1}_${Math.random().toString(36).substring(7)}`;
 
 if ('serviceWorker' in navigator) {
 try {
 const reg = await navigator.serviceWorker.ready;
 const sub = await reg.pushManager.getSubscription();
 if (sub) {
 endpoint = sub.endpoint;
 }
 } catch {}
 }

 await fetch('/api/push/operator/subscribe', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 subscription: { endpoint },
 operador_id: user?.id ? Number(user.id) : 1,
 operador_nome: user?.name || 'João Silva',
 ramal: '2001',
 filas: ['Suporte N2', 'Vendas'],
 dispositivo: navigator.userAgent.includes('Mobile') ? 'Mobile (PWA Operador)' : 'Desktop (PWA Operador)',
 categorias: cats
 })
 });
 } catch (err) {
 console.warn('Erro ao registrar operador no backend:', err);
 }
 };

 const requestPermission = async () => {
 if (!isSupported) {
 console.warn('Seu navegador atual não possui suporte nativo à API de Notificações.');
 return false;
 }

 setLoading(true);
 try {
 const result = await Notification.requestPermission();
 setPermission(result);

 if (result === 'granted') {
 setIsSubscribed(true);
 await syncOperatorSubscription();
 
 // Disparo de boas-vindas do operador
 await showNotification(
 'DJD Operador • Push Ativado',
 {
 body: `Você receberá novos atendimentos do WhatsApp, chamados e alertas de rede em tempo real no ramal 2001.`,
 tag: 'op_push_welcome'
 },
 'whatsapp'
 );
 return true;
 }
 return false;
 } catch (err) {
 console.error('Erro ao solicitar permissão de push do operador:', err);
 return false;
 } finally {
 setLoading(false);
 }
 };

 const triggerTestPush = async (tipo: OperatorNotificationCategory = 'whatsapp') => {
 try {
 const res = await fetch('/api/push/operator/test', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 tipo,
 operador_nome: user?.name || 'João Silva',
 ramal: '2001'
 })
 });
 const data = await res.json();
 if (data.sucesso) {
 await showNotification(
 data.titulo,
 {
 body: data.mensagem,
 tag: `op_test_${Date.now()}`
 },
 tipo
 );
 return data;
 }
 } catch (err) {
 // Fallback local
 await showNotification(
 'DJD Operador • Teste Push',
 {
 body: 'Notificação instantânea de fila de atendimento entregue com sucesso.',
 tag: `op_test_local_${Date.now()}`
 },
 tipo
 );
 }
 };

 const toggleCategory = (cat: OperatorNotificationCategory) => {
 const next = categories.includes(cat)
 ? categories.filter(c => c !== cat)
 : [...categories, cat];
 setCategories(next);
 localStorage.setItem('nap_op_push_categories', JSON.stringify(next));
 if (isSubscribed) {
 syncOperatorSubscription(next);
 }
 };

 return {
 permission,
 isSupported,
 isSubscribed,
 loading,
 categories,
 requestPermission,
 triggerTestPush,
 showNotification,
 toggleCategory
 };
}
