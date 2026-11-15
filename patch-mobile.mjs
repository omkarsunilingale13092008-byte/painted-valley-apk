// Automated patcher that upgrades blendi/painted-valley for Android (Moto G45) + Transparent Left Joystick
import fs from 'node:fs';
import path from 'node:path';

// 1. Write src/figure/touch-joystick.js
const touchJoystickPath = path.resolve('src/figure/touch-joystick.js');
fs.mkdirSync(path.dirname(touchJoystickPath), { recursive: true });
fs.copyFileSync(path.resolve('touch-joystick.js'), touchJoystickPath);
console.log('[patch-mobile] Wrote src/figure/touch-joystick.js');

// 2. Patch src/figure/input.js to integrate TouchControls
const inputPath = path.resolve('src/figure/input.js');
let inputCode = fs.readFileSync(inputPath, 'utf8');

if (!inputCode.includes('TouchControls')) {
  inputCode = `import { TouchControls } from './touch-joystick.js';\n` + inputCode;
  inputCode = inputCode.replace(
    'this.lockable = true;',
    'this.lockable = true;\n    this.touch = new TouchControls(el);'
  );
  inputCode = inputCode.replace(
    'return s;',
    'this.touch.consume(s);\n    return s;'
  );
  fs.writeFileSync(inputPath, inputCode, 'utf8');
  console.log('[patch-mobile] Patched src/figure/input.js with TouchControls');
}

// 3. Patch src/valley/main.js for Moto G45 (Snapdragon 6s Gen 3 / Adreno 619) WebGL2 stability
const mainPath = path.resolve('src/valley/main.js');
let mainCode = fs.readFileSync(mainPath, 'utf8');

// Default to 'low' quality on mobile so it doesn't allocate a 12288px backdrop texture or 2048px 240-step cubemap
mainCode = mainCode.replace(
  "const quality = params.get('quality') ?? 'high';",
  "const quality = params.get('quality') ?? 'low';"
);

// Cap pixel ratio to 1.25 on mobile so fill-rate stays smooth on Adreno 619
mainCode = mainCode.replace(
  'function fitView() {',
  'function fitView() { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));'
);

// Allow starting audio & gameplay via touch without desktop requestPointerLock
mainCode += `
window.addEventListener('pv-touch-start', () => {
  try { sounds.start(); } catch {}
  document.body.classList.add('playing');
});
`;

fs.writeFileSync(mainPath, mainCode, 'utf8');
console.log('[patch-mobile] Patched src/valley/main.js for Moto G45 low-VRAM startup & touch unlock');

// 4. Patch index.html prompt for mobile touch
const indexPath = path.resolve('index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace('Click to walk', 'Touch to walk');
indexHtml = indexHtml.replace(
  'W A S D · Shift to sprint · Alt to walk · V first person · T for time of day',
  'Left joystick to move (push edge to sprint) · Drag right side to look · SUN / VIEW / JUMP buttons'
);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('[patch-mobile] Patched index.html');
