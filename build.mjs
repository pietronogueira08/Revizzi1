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
  join(root, 'Logo Da Revizzi.jpeg'),
  join(root, 'dist', 'Logo Da Revizzi.jpeg')
);
copyFileSync(
  join(root, 'Crie_a_vista_de_frente_202606171225.jpeg'),
  join(root, 'dist', 'Crie_a_vista_de_frente_202606171225.jpeg')
);
copyFileSync(
  join(root, 'A_premium_horizontal_lineup_of_202606170926.jpeg'),
  join(root, 'dist', 'A_premium_horizontal_lineup_of_202606170926.jpeg')
);
copyFileSync(
  join(root, 'Aumente_a_qualidade_da_imagem_202606170954.jpeg'),
  join(root, 'dist', 'Aumente_a_qualidade_da_imagem_202606170954.jpeg')
);

console.log('\n✓ Build completo! Pasta dist/ pronta para deploy.');
