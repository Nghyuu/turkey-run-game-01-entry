// input.js — keyboard, mouse and touch, in one place.
// Keyboard: arrows/WASD/Space to jump and flap, Down/S to slide,
// P/Esc pause, R/Enter restart, M mute. Mouse/touch: click or tap
// to flap, on-screen buttons for pause and restart.

import { KEYS } from './config.js';

export function createInput(canvas) {
  const pressed = new Set();
  const queued = [];
  let pointerJump = false;
  let pointerSlide = false;
  let pointerX = 0;
  let pointerY = 0;
  let pointerDown = false;

  function keyDown(e) {
    if (KEYS.jump.includes(e.code) || KEYS.slide.includes(e.code)) e.preventDefault();
    if (!e.repeat) {
      pressed.add(e.code);
      queued.push(e.code);
    }
  }
  function keyUp(e) {
    pressed.delete(e.code);
  }
  function pointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width) * 1280;
    pointerY = ((e.clientY - rect.top) / rect.height) * 720;
    pointerDown = true;
    // Lower half of the screen slides, upper half flaps.
    if (pointerY > 560) pointerSlide = true;
    else pointerJump = true;
  }
  function pointerUp() {
    pointerDown = false;
    // A held low press slides only while it is held; a tap's jump
    // stays queued until the game loop consumes it.
    pointerSlide = false;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointer);
  window.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    // True while any jump key is held.
    jumpHeld() {
      return KEYS.jump.some((k) => pressed.has(k));
    },
    // True while any slide key is held, or a low pointer press is down.
    slideHeld() {
      return KEYS.slide.some((k) => pressed.has(k)) || pointerSlide;
    },
    // Consumes one queued jump press (tap or click), if any.
    consumeJump() {
      if (pointerJump) {
        pointerJump = false;
        return true;
      }
      const i = queued.findIndex((c) => KEYS.jump.includes(c));
      if (i >= 0) {
        queued.splice(i, 1);
        return true;
      }
      return false;
    },
    // Consumes one queued key press of the given codes, if any.
    consumeKey(codes) {
      const i = queued.findIndex((c) => codes.includes(c));
      if (i >= 0) {
        queued.splice(i, 1);
        return true;
      }
      return false;
    },
    // Latest pointer position in logical canvas coordinates, or null.
    pointer() {
      if (!pointerDown) return null;
      return { x: pointerX, y: pointerY };
    },
    // Consumes the pointer press (a click), returning its position.
    // A jump queued by the same press is kept: the caller decides
    // whether the click was a button (then it clears it) or a jump.
    consumeClick() {
      if (!pointerDown) return null;
      pointerDown = false;
      const p = { x: pointerX, y: pointerY };
      pointerSlide = false;
      return p;
    },
    // Drops a jump queued by a pointer press (it hit a button).
    clearJump() {
      pointerJump = false;
    },
    // True while the pointer is held down (for button hover states).
    pointerIsDown() {
      return pointerDown;
    },
  };
}
