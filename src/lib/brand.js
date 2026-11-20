// يتحقّق وقت البناء من وجود ملفّات الشعار في public/brand/.
import fs from 'node:fs';
import path from 'node:path';
const has = (f) => {
  try { return fs.existsSync(path.join(process.cwd(), 'public', 'brand', f)); } catch { return false; }
};
export const BRAND = {
  logo: has('logo.png') ? '/brand/logo.png' : null,
  slogan: has('slogan.png') ? '/brand/slogan.png' : null,
  sloganLight: has('slogan-light.png') ? '/brand/slogan-light.png' : null,
};
