const fs = require('fs');
let text = fs.readFileSync('src/components/Webphone.tsx', 'utf8');

const newVoiceLogic = `
          const playVoice = () => {
            const msg = new SpeechSynthesisUtterance("Desculpe, todos os nossos operadores estão ocupados no momento. Por favor, tente novamente em instantes ou mande uma mensagem no chat.");
            msg.lang = 'pt-BR';
            msg.rate = 1.05;
            msg.pitch = 1.25;
            
            const voices = window.speechSynthesis.getVoices();
            const preferred = ['Francisca', 'Luciana', 'Vitoria', 'Raquel', 'Maju', 'Google português do Brasil', 'Google pt-BR'];
            let voice = voices.find(v => v.lang.includes('pt-BR') && preferred.some(p => v.name.includes(p)));
            if (!voice) voice = voices.find(v => v.lang.includes('pt-BR'));
            if (voice) msg.voice = voice;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(msg);
          };

          if (window.speechSynthesis.getVoices().length > 0) {
            playVoice();
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              playVoice();
              window.speechSynthesis.onvoiceschanged = null;
            };
          }
`;

text = text.replace(
  /const msg = new SpeechSynthesisUtterance\("Desculpe, todos os nossos operadores estão ocupados no momento\. Por favor, tente novamente em instantes ou mande uma mensagem no chat\."\);\n\s*msg\.lang = 'pt-BR';\n\s*msg\.rate = 1\.1;\n\s*msg\.pitch = 1\.2;\n\s*window\.speechSynthesis\.cancel\(\);\n\s*window\.speechSynthesis\.speak\(msg\);/,
  newVoiceLogic.trim()
);

fs.writeFileSync('src/components/Webphone.tsx', text, 'utf8');
console.log('Fixed Webphone voice');
