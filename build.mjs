import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

console.log('→ Preparando pasta dist...');
mkdirSync(join(root, 'dist'), { recursive: true });

console.log('→ Copiando HTMLs...');
copyFileSync(join(root, 'index.html'), join(root, 'dist', 'index.html'));
copyFileSync(join(root, 'revizzi_os_panel.html'), join(root, 'dist', 'revizzi_os_panel.html'));

console.log('→ Copiando imagens...');
copyFileSync(
  join(root, 'logo-da-revizzi.jpeg'),
  join(root, 'dist', 'logo-da-revizzi.jpeg')
);
copyFileSync(
  join(root, 'crie-vista.jpeg'),
  join(root, 'dist', 'crie-vista.jpeg')
);
copyFileSync(
  join(root, 'A_premium_horizontal_lineup_of_202606170926.jpeg'),
  join(root, 'dist', 'A_premium_horizontal_lineup_of_202606170926.jpeg')
);
copyFileSync(
  join(root, 'aumente.jpeg'),
  join(root, 'dist', 'aumente.jpeg')
);

console.log('\n✓ Build completo! Pasta dist/ pronta para deploy.');
