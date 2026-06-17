import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1').replace(/%20/g, ' ');

console.log('→ Preparando pasta dist...');
mkdirSync(join(root, 'dist'), { recursive: true });

console.log('→ Copiando HTMLs...');
copyFileSync(join(root, 'index.html'), join(root, 'dist', 'index.html'));
copyFileSync(join(root, 'revizzi_os_panel.html'), join(root, 'dist', 'revizzi_os_panel.html'));

console.log('→ Copiando imagens...');
const images = [
  'logo-da-revizzi.jpeg',
  'crie-vista.jpeg',
  'A_premium_horizontal_lineup_of_202606170926.jpeg',
  'aumente.jpeg',
  'revizzi_os_panel.png',
  'stitch_hero_screenshot.png'
];

for (const img of images) {
  const src = join(root, img);
  const dest = join(root, 'dist', img);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log('Copiado: ' + img);
  } else {
    console.log('Arquivo no encontrado (pulando): ' + img);
  }
}

writeFileSync(join(root, 'dist', 'dist_test.txt'), 'served from dist');

