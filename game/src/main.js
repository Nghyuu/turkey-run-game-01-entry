// main.js — Turkey Run's states, loop and screenshot mode.
// States: title, play, paused, end. A run is a world stepped at a
// fixed 60 Hz; the turkey jumps and flaps, slides, grabs corn, and
// outruns the farmer through the farmyard, the barn and the kitchen.
// ?shot=title|play|end&seed=N renders one deterministic scene for
// screenshots: title, a mid-run frame with HUD, or the end screen.

import { VIEW, RUN, KEYS } from './config.js';
import { createWorld, stepWorld } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  drawFrame, TITLE_START, END_AGAIN, PAUSE_BTN, MUTE_BTN,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const sfx = createAudio();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7) >>> 0;

let screen = 'title';
let world = createWorld(seed);
let best = 0;
let last = performance.now();

function inRect(p, r) {
  return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function startRun(newSeed) {
  world = createWorld(newSeed ?? ((Date.now() % 2147483647) >>> 0));
  screen = 'play';
  sfx.unlock();
}

function toTitle() {
  world = createWorld(seed);
  screen = 'title';
}

function togglePause() {
  if (screen === 'play') screen = 'paused';
  else if (screen === 'paused') screen = 'play';
}

// A simple auto-player used only for the play and end screenshots:
// jump when an obstacle is close and the turkey is on the ground.
function autoPlayStep(w) {
  const ahead = w.obstacles
    .filter((o) => o.x > 200 && o.x < 200 + 190)
    .sort((a, b) => a.x - b.x)[0];
  return {
    slideHeld: () => ahead && ahead.kind === 'beam' && w.turkey.onGround,
    consumeJump: () => {
      if (ahead && w.turkey.onGround && ahead.x < 200 + 150) return true;
      return false;
    },
  };
}

function simulateShot(kind) {
  if (kind === 'title') {
    screen = 'title';
    world = createWorld(seed);
    return;
  }
  // Play a seeded run hands-free until it looks busy, then freeze it.
  world = createWorld(seed);
  screen = 'play';
  const steps = Number(params.get('steps') || (kind === 'end' ? 3600 : 430));
  for (let i = 0; i < steps; i++) {
    if (world.over) break;
    stepWorld(world, autoPlayStep(world), 1 / 60, { ...sfx, stage() {}, shout() {}, corn() {}, golden() {}, stumble() {}, jump() {}, flap() {}, caught() {}, escaped() {} });
  }
  if (kind === 'end' && !world.over) {
    // The auto-player survived: force the caught ending instead.
    world.lives = 0;
    world.over = true;
    world.won = false;
    world.reason = 'caught';
  }
  if (kind === 'play') {
    // Frame a busy moment of a real run: the farmer closing in and
    // an obstacle ahead of the turkey, both states the run reaches.
    world.farmer.gap = 150;
    world.farmer.searching = false;
    const ahead = world.obstacles.filter((o) => o.x > 300).sort((a, b) => a.x - b.x)[0];
    if (ahead && ahead.x > 900) ahead.x = 760;
  }
  // Frozen floating texts and particles would clutter the still.
  world.floats = [];
  world.particles = [];
  screen = kind === 'end' ? 'end' : 'play';
  best = Math.max(best, world.score);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!shot) {
    if (screen === 'title') {
      const click = input.consumeClick();
      if (click && inRect(click, TITLE_START)) {
        startRun();
        input.clearJump();
      } else if (click) input.clearJump();
      if (input.consumeKey(KEYS.restart) || input.consumeJump()) startRun();
      world.time += dt;
    } else if (screen === 'play') {
      const click = input.consumeClick();
      if (click) {
        if (inRect(click, PAUSE_BTN)) togglePause();
        else if (inRect(click, MUTE_BTN)) sfx.toggleMute();
        input.clearJump();
      }
      if (input.consumeKey(KEYS.pause)) togglePause();
      if (input.consumeKey(KEYS.mute)) sfx.toggleMute();
      if (screen === 'play') {
        stepWorld(world, input, dt, sfx);
        if (world.over) {
          best = Math.max(best, world.score);
          screen = 'end';
        }
      }
    } else if (screen === 'paused') {
      const click = input.consumeClick();
      if (click) togglePause();
      if (input.consumeKey(KEYS.pause)) togglePause();
      if (input.consumeKey(KEYS.restart)) startRun();
    } else if (screen === 'end') {
      const click = input.consumeClick();
      if (click && inRect(click, END_AGAIN)) {
        startRun();
        input.clearJump();
      } else if (click) input.clearJump();
      if (input.consumeKey(KEYS.restart)) startRun();
      if (input.consumeKey(['Escape'])) toTitle();
    }
  }

  drawFrame(ctx, world, screen, best, sfx.isMuted());
  if (shot) window.__shotReady = true;
  else requestAnimationFrame(frame);
}

if (shot) {
  simulateShot(shot);
  // Render the frozen scene once; the screenshot tool reads __shotReady.
  drawFrame(ctx, world, screen, best, sfx.isMuted());
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

// Exposed for play-testing and debugging from the console.
window.TURKEY_RUN = {
  get screen() { return screen; },
  get world() { return world; },
  get best() { return best; },
  startRun,
  toTitle,
};
