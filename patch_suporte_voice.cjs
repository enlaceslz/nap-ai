const fs = require('fs');
let text = fs.readFileSync('src/pages/PortalSuporte.tsx', 'utf8');

const newVoiceLogic = `
  useEffect(() => {
    if (modalLigacaoOpen) {
      const text = "Olá! Sou a Maia, sua assistente virtual. Para eu direcionar sua ligação gratuita ao especialista mais rápido, qual o motivo do seu contato?";
      
      const playVoice = () => {
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'pt-BR';
        msg.rate = 1.05; 
        msg.pitch = 1.25; 
        
        const voices = window.speechSynthesis.getVoices();
        // Nomes comuns de vozes femininas PT-BR em diversos SOs/Navegadores
        const preferred = ['Francisca', 'Luciana', 'Vitoria', 'Raquel', 'Maju', 'Google português do Brasil', 'Google pt-BR'];
        
        let voice = voices.find(v => v.lang.includes('pt-BR') && preferred.some(p => v.name.includes(p)));
        
        if (!voice) {
           voice = voices.find(v => v.lang.includes('pt-BR')); // Fallback
        }
        
        if (voice) {
           msg.voice = voice;
        }
        
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
    } else {
      window.speechSynthesis.cancel();
    }
  }, [modalLigacaoOpen]);`;

text = text.replace(
  /useEffect\(\(\) => \{\n\s*if \(modalLigacaoOpen\) \{\n\s*const msg = new SpeechSynthesisUtterance[\s\S]*?\}, \[modalLigacaoOpen\]\);/,
  newVoiceLogic.trim()
);

fs.writeFileSync('src/pages/PortalSuporte.tsx', text, 'utf8');
console.log('Fixed PortalSuporte.tsx voice');
