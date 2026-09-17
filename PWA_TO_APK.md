# Como Converter os PWAs do NAP em Arquivos APK (Android)

Como o NAP já foi construído utilizando os padrões modernos de Progressive Web App (PWA) — incluindo um `manifest.json` válido, Service Workers e suporte offline via `vite-plugin-pwa` —, o processo de empacotar a aplicação web em um arquivo nativo `.apk` ou `.aab` (para a Google Play Store) é muito simples.

Existem duas rotas principais para fazer isso, dependendo do seu nível de necessidade de acesso ao hardware nativo.

---

## Método 1: PWABuilder (Mais Rápido / Recomendado para a Play Store)

A Microsoft mantém uma ferramenta open-source em parceria com o Google chamada [PWABuilder](https://www.pwabuilder.com/). Ela utiliza a tecnologia **TWA (Trusted Web Activity)** do Google, que basicamente empacota seu PWA dentro de um "navegador invisível" no Android, garantindo a mesma performance do Chrome e permissão para ser publicado na Play Store.

### Passo a Passo:
1. Faça o deploy da sua aplicação NAP em um domínio público com HTTPS (ex: `https://app.seuprovedor.com.br`).
2. Acesse [pwabuilder.com](https://www.pwabuilder.com/).
3. Cole a URL do seu PWA (por exemplo, `https://app.seuprovedor.com.br/portal` para o app do cliente).
4. A ferramenta fará uma auditoria (ela vai detectar o nosso Service Worker e o Manifest).
5. Clique em **"Package for Stores"**.
6. Selecione **Android**.
7. Preencha as informações do pacote (ex: `br.com.seuprovedor.portal`) e gere a chave de assinatura.
8. Baixe o arquivo `.zip`. Dentro dele estarão o seu `.apk` (para testes manuais) e o `.aab` (para envio oficial à Google Play Console).

---

## Método 2: Bubblewrap CLI (Terminal / Para Desenvolvedores)

O Bubblewrap é a ferramenta de linha de comando oficial do Google Chrome Labs para gerar Trusted Web Activities (TWA).

### Passo a Passo:
No seu computador local (você precisará ter o Node.js e o Java JDK (versão 11 ou 17) instalados):

1. Instale o Bubblewrap globalmente:
   ```bash
   npm i -g @GoogleChromeLabs/bubblewrap
   ```
2. Crie uma pasta para o seu app Android:
   ```bash
   mkdir nap-android-app && cd nap-android-app
   ```
3. Inicialize o projeto apontando para o seu manifest (substitua pela URL real):
   ```bash
   bubblewrap init --manifest https://app.seuprovedor.com.br/manifest.webmanifest
   ```
   *(Ele vai te fazer algumas perguntas sobre ícones e nome do pacote. A maioria ele já vai puxar automaticamente do manifest).*
4. Compile o APK:
   ```bash
   bubblewrap build
   ```
5. Ao final, o arquivo `app-release-signed.apk` estará na sua pasta, pronto para ser instalado no celular.

---

## Método 3: CapacitorJS (Avançado / Integração Nativa)

Se no futuro o módulo do **Técnico de Campo (`/admin/campo`)** precisar de funcionalidades nativas extremas que o navegador não suporta (como rastreamento GPS em background 24h por dia mesmo com o app fechado), a melhor rota é o [Capacitor](https://capacitorjs.com/).

### Como adaptar o NAP para Capacitor:
1. No diretório raiz do projeto, instale o Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npm install @capacitor/android
   ```
2. Inicialize a configuração:
   ```bash
   npx cap init "NAP Provedor" br.com.provedor.nap --web-dir dist
   ```
3. Adicione a plataforma Android:
   ```bash
   npx cap add android
   ```
4. Gere o build do Vite e copie para a pasta nativa:
   ```bash
   npm run build
   npx cap sync
   ```
5. Abra no Android Studio para gerar o APK:
   ```bash
   npx cap open android
   ```

> **Dica:** O Capacitor permite instalar plugins para Push Notifications nativas (FCM), Câmera nativa, Biometria e SQLite.

---

## 🎯 Qual URL usar no empacotamento?

Como o NAP é um sistema unificado, você provavelmente vai querer gerar 2 APKs diferentes:
1. **APK do Cliente (Autoatendimento):** Aponte o gerador (PWABuilder/Bubblewrap) para a rota principal ou para `/portal`.
2. **APK do Técnico (OS e Campo):** Aponte o gerador para a rota `/admin/campo`.
