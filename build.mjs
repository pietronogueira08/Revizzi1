import { execSync } from 'child_process';
import { copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

console.log('→ Building admin (React)...');
execSync('npm run build', { cwd: join(root, 'revizzi-os'), stdio: 'inherit' });

console.log('→ Copying index.html → dist/index.html...');
mkdirSync(join(root, 'dist'), { recursive: true });
copyFileSync(join(root, 'index.html'), join(root, 'dist', 'index.html'));

console.log('→ Copying images...');
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

console.log('\n✓ Build completo! Pasta dist/ pronta para deploy.');
console.log('  dist/index.html     → revizzi.html (loja)');
console.log('  dist/admin/         → painel admin');
