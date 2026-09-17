const fs = require('fs');
let code = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');

const hook = `Ao acessar, você concorda com os termos de uso de {nomeProvedor}.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}`;

const inject = `Ao acessar, você concorda com os termos de uso de {nomeProvedor}.
            </p>
          </div>
        </div>
        )}
      </div>
      <WebchatWidget />
    </div>
  );
}`;

code = code.replace(hook, inject);

fs.writeFileSync('src/pages/PortalLogin.tsx', code);
console.log("PortalLogin patched");
