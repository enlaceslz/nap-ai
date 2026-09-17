const fs = require('fs');
let text = fs.readFileSync('server/olt/oltService.ts', 'utf8');

if (!text.includes('VsolDriver')) {
  text = text.replace(
    "import { HuaweiOltDriver } from './huaweiDriver';",
    "import { HuaweiOltDriver } from './huaweiDriver';\nimport { VsolDriver } from './vsolDriver';"
  );
  text = text.replace(
    "return new HuaweiOltDriver(olt);\n    }",
    "return new HuaweiOltDriver(olt);\n    } else if (olt.fabricante === 'VSOL') {\n      return new VsolDriver(olt);\n    }"
  );
  fs.writeFileSync('server/olt/oltService.ts', text, 'utf8');
  console.log('patched');
} else {
  console.log('already patched');
}
