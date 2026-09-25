import { useState, useEffect, useCallback } from 'react';

export interface PushNotificationPayload {
 title: string;
 body: string;
 url?: string;
 category?: 'cobranca' | 'suporte' | 'manutencao' | 'marketing' | 'geral';
 tag?: string;
}

export function usePushNotifications() {
 const [permission, setPermission] = useState<NotificationPermission>('default');
 const [isSupported, setIsSupported] = useState(false);
 const [isSubscribed, setIsSubscribed] = useState(false);
 const [loading, setLoading] = useState(false);

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

 // Notificação local e segura via Service Worker ou fallback nativo
 const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
 try {
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
 
 // Fallback clássico para navegadores sem service worker ativo
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification(title, {
 icon: '/pwa-192x192.png',
 ...options,
 });
 }
 } catch (e) {
 console.warn('Erro ao disparar notificação local:', e);
 }
 }, []);

  // Registrar subscrição no backend do portal com prova de identidade
  const syncSubscriptionWithServer = async () => {
    try {
      const authRaw = localStorage.getItem('@nap_client_auth');
      const clientAuth = authRaw ? JSON.parse(authRaw) : null;
      if (!clientAuth || !clientAuth.id) {
        return;
      }

      let subObj: any = null;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            subObj = sub;
          }
        } catch {
          // Service worker indisponível no contexto atual
        }
      }

      if (!subObj?.endpoint) {
        return;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (clientAuth.pushEnrollmentToken) {
        headers['x-push-enrollment-token'] = clientAuth.pushEnrollmentToken;
      }

      await fetch('/api/push/portal/subscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subscription: subObj,
          cliente_id: Number(clientAuth.id),
          cliente_nome: clientAuth.nome || 'Assinante',
          push_enrollment_token: clientAuth.pushEnrollmentToken,
          dispositivo: navigator.userAgent.includes('Mobile') ? 'Mobile (PWA)' : 'Desktop (PWA)'
        })
      });
    } catch (err) {
      console.warn('Erro ao registrar inscrição no servidor:', err);
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
 await syncSubscriptionWithServer();
 showNotification('Portal DJD', {
 body: 'Notificações ativadas com sucesso! Você receberá alertas sobre sua conexão e faturas.',
 icon: '/pwa-192x192.png'
 });
 return true;
 }
 return false;
 } catch (error) {
 console.error('Erro ao requisitar permissão de notificação:', error);
 return false;
 } finally {
 setLoading(false);
 }
 };

 const triggerTestPush = async (payload?: PushNotificationPayload) => {
 const title = payload?.title || 'Portal do Cliente - DJD';
 const body = payload?.body || 'Aviso: Sua conexão com o provedor está 100% normalizada e veloz.';

 if (permission === 'granted') {
 showNotification(title, {
 body,
 icon: '/pwa-192x192.png',
 tag: payload?.tag || 'aviso-nap'
 });
 } else {
 // Solicita permissão e dispara se concedido
 const granted = await requestPermission();
 if (granted) {
 showNotification(title, { body, icon: '/pwa-192x192.png' });
 }
 }
 };

 return {
 isSupported,
 permission,
 isSubscribed,
 loading,
 requestPermission,
 showNotification,
 triggerTestPush
 };
}
