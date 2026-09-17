const fs = require('fs');
let code = fs.readFileSync('src/pages/Inbox.tsx', 'utf8');

code = code.replace(
  /                      \{\/\* Conteúdo com quebra de linha \*\/\}\n                      <p className="whitespace-pre-wrap">\{msg\.conteudo\}<\/p>/g,
  `                      {/* Conteúdo com quebra de linha ou Áudio */}
                      {msg.tipo === 'audio' || msg.conteudo?.includes('(Áudio/Mídia Recebida)') ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg">
                            <button className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 hover:bg-blue-600">
                              <Play size={14} className="ml-1" />
                            </button>
                            <div className="flex-1">
                              <div className="h-1 bg-white/20 rounded-full w-full relative">
                                <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full w-1/3" />
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-medium opacity-70">0:15</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm italic opacity-90 border-l-2 border-white/20 pl-2">
                            <Bot size={12} className="inline mr-1" />
                            {msg.conteudo.replace('(Áudio/Mídia Recebida) ', '')}
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                      )}`
);

fs.writeFileSync('src/pages/Inbox.tsx', code);
