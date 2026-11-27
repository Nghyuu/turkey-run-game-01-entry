// render.js — every pixel of Turkey Run, drawn with canvas paths.
// No images, no fonts from the network: autumn palette, Georgia
// headlines, and a turkey, a farmer, an oven and a carving knife
// drawn from scratch. Exported button rects are shared with main.js
// so clicks land where the buttons are drawn.

import { VIEW, TURKEY, FARMER, STAGES } from './config.js';

export const TITLE_START = { x: 490, y: 512, w: 300, h: 76 };
export const END_AGAIN = { x: 490, y: 548, w: 300, h: 76 };
export const PAUSE_BTN = { x: 1196, y: 14, w: 68, h: 44 };
export const MUTE_BTN = { x: 1118, y: 14, w: 68, h: 44 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, s, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function outlineText(ctx, s, x, y, font, color, stroke, width = 6) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ---------------------------------------------------------------- scenery

function drawSky(ctx, world) {
  const stage = world.stage;
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  g.addColorStop(0, stage.sky[0]);
  g.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);
  // Low autumn sun.
  ctx.fillStyle = '#fff3c4';
  ellipse(ctx, 1080, 110, 52, 52);
  ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
  ellipse(ctx, 1080, 110, 78, 78);
  // Drifting clouds, parallaxed by distance.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 397 - world.distance * 8) % 1400 + 1400) % 1400 - 60;
    const cy = 70 + i * 42;
    ellipse(ctx, cx, cy, 62, 20);
    ellipse(ctx, cx + 42, cy + 6, 46, 16);
    ellipse(ctx, cx - 44, cy + 8, 40, 14);
  }
}

function drawBackdrop(ctx, world) {
  const idx = world.stageIndex;
  const off = (world.distance * 22) % 1280;
  ctx.save();
  ctx.globalAlpha = 0.9;
  if (idx === 0) {
    // Farmyard: red barn and silo on the horizon.
    ctx.fillStyle = '#a83c2a';
    ctx.fillRect(120 - off, 470, 190, 130);
    ctx.fillStyle = '#7e2a1d';
    ctx.beginPath();
    ctx.moveTo(110 - off, 470);
    ctx.lineTo(215 - off, 410);
    ctx.lineTo(320 - off, 470);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c9c2b4';
    ctx.fillRect(420 - off, 430, 64, 170);
    ctx.fillStyle = '#8a8478';
    ctx.beginPath();
    ctx.ellipse(452 - off, 430, 32, 18, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(700 - off, 520, 26, 80);
    ctx.fillStyle = '#c96a2e';
    ellipse(ctx, 713 - off, 500, 66, 46);
    ellipse(ctx, 660 - off, 520, 40, 30);
    ellipse(ctx, 766 - off, 522, 42, 30);
  } else if (idx === 1) {
    // Barn: haystacks and fence posts.
    ctx.fillStyle = '#e0a83c';
    for (let i = 0; i < 3; i++) {
      const hx = 200 + i * 380 - off;
      ctx.beginPath();
      ctx.moveTo(hx - 90, 600);
      ctx.quadraticCurveTo(hx, 460, hx + 90, 600);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#6e4520';
    for (let i = 0; i < 8; i++) ctx.fillRect(60 + i * 160 - off, 540, 14, 60);
    ctx.fillRect(0, 548, 1280, 10);
  } else {
    // Kitchen: the farmhouse windows and a smoking chimney.
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(140 - off, 430, 260, 170);
    ctx.fillStyle = '#5d3a28';
    ctx.beginPath();
    ctx.moveTo(120 - off, 430);
    ctx.lineTo(270 - off, 360);
    ctx.lineTo(420 - off, 430);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.fillRect(180 - off, 470, 46, 52);
    ctx.fillRect(300 - off, 470, 46, 52);
    ctx.fillStyle = '#6e4a30';
    ctx.fillRect(330 - off, 360, 34, 70);
    ctx.fillStyle = 'rgba(220, 220, 220, 0.7)';
    ellipse(ctx, 348 - off, 320, 16, 26);
    ellipse(ctx, 356 - off, 280, 20, 30);
  }
  ctx.restore();
}

function drawGround(ctx, world) {
  const stage = world.stage;
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, 14);
  // Dirt speckles scrolling with the run.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  const off = (world.distance * 6) % 90;
  for (let x = -off; x < VIEW.width; x += 90) {
    ellipse(ctx, x + 30, 640, 16, 4);
    ellipse(ctx, x + 66, 684, 22, 5);
  }
  // Speed lines on the ground.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  const off2 = (world.distance * 6) % 260;
  for (let x = -off2; x < VIEW.width; x += 260) {
    ctx.fillRect(x, 626, 54, 3);
  }
}

// ---------------------------------------------------------------- characters

export function drawTurkey(ctx, x, y, world, opts = {}) {
  const t = world.turkey;
  const runCycle = world.time * 14;
  const bob = t.onGround ? Math.abs(Math.sin(runCycle)) * 4 : 0;
  const sliding = t.sliding || opts.sliding;
  const legSwing = t.onGround ? Math.sin(runCycle) * 12 : 6;
  ctx.save();
  ctx.translate(x, y - bob);
  if (t.stumbleTimer > 0 && Math.floor(world.time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  if (sliding) ctx.scale(1.15, 0.62);
  // Tail feathers, fanned.
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-26, -26);
    ctx.rotate(i * 0.32 - 0.5);
    ctx.beginPath();
    ctx.ellipse(0, -26, 10, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i % 2 === 0 ? '#c96a2e' : '#8a5a2b';
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = '#7a4a22';
  ellipse(ctx, 0, -26, 34, 30);
  ctx.fillStyle = '#a8763e';
  ellipse(ctx, 4, -20, 26, 22);
  // Wing, flapping when airborne.
  const flap = t.flapTimer > 0 ? -0.9 : Math.sin(runCycle) * 0.15;
  ctx.save();
  ctx.translate(-4, -28);
  ctx.rotate(flap);
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath();
  ctx.ellipse(-14, 0, 20, 11, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Neck and head.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(20, -58, 12, 34);
  ctx.fillStyle = '#c96a2e';
  ellipse(ctx, 28, -62, 15, 14);
  // Beak, wattle, eye.
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(40, -64);
  ctx.lineTo(56, -59);
  ctx.lineTo(40, -55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ellipse(ctx, 34, -48, 5, 9);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, 32, -66, 3.5, 3.5);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 33, -67, 1.2, 1.2);
  // Legs, running.
  ctx.strokeStyle = '#f2a541';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(8, -2);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  ctx.restore();
}

export function drawFarmer(ctx, x, y, world) {
  const f = world.farmer;
  const runCycle = world.time * 12;
  const legSwing = Math.sin(runCycle) * 16;
  ctx.save();
  ctx.translate(x, y);
  // Searching pose: one hand shading his eyes.
  const searching = f.searching;
  // Legs.
  ctx.strokeStyle = '#3a5a8a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -52);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();
  // Overalls.
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(-18, -104, 36, 56);
  ctx.fillStyle = '#c94f32';
  ctx.fillRect(-18, -104, 36, 20);
  // Arms: reaching forward while chasing, shading eyes while searching.
  ctx.strokeStyle = '#e8b98a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (searching) {
    ctx.moveTo(14, -96);
    ctx.lineTo(30, -128);
  } else {
    ctx.moveTo(14, -96);
    ctx.lineTo(38, -78);
    ctx.moveTo(-14, -96);
    ctx.lineTo(-34, -80);
  }
  ctx.stroke();
  // Head and straw hat.
  ctx.fillStyle = '#e8b98a';
  ellipse(ctx, 0, -122, 16, 16);
  ctx.fillStyle = '#e8c85a';
  ellipse(ctx, 0, -132, 30, 8);
  ctx.fillStyle = '#d9b23c';
  ctx.beginPath();
  ctx.ellipse(0, -138, 15, 9, 0, Math.PI, 0);
  ctx.fill();
  // Moustache and angry eyes.
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(-10, -116, 20, 5);
  ctx.fillStyle = '#1a1a1a';
  ellipse(ctx, -6, -126, 2.5, 2.5);
  ellipse(ctx, 6, -126, 2.5, 2.5);
  // Pitchfork, held high while chasing.
  if (!searching) {
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(38, -78);
    ctx.lineTo(58, -150);
    ctx.stroke();
    ctx.strokeStyle = '#c9c2b4';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(58 + i * 7, -150);
      ctx.lineTo(58 + i * 9, -168);
      ctx.stroke();
    }
  }
  ctx.restore();
  // Shout bubble while searching.
  if (searching) {
    ctx.fillStyle = '#fff8e0';
    rr(ctx, x - 30, y - 220, 150, 40, 12);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    text(ctx, '"Where\'d it go?!"', x + 45, y - 200, 'bold 17px Georgia, serif', '#5d3a1a');
  }
}

// ---------------------------------------------------------------- obstacles & pickups

function drawFence(ctx, ob) {
  ctx.fillStyle = '#6e4520';
  ctx.fillRect(ob.x, 600 - 92, 8, 92);
  ctx.fillRect(ob.x + 46, 600 - 92, 8, 92);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(ob.x - 4, 600 - 84, 62, 12);
  ctx.fillRect(ob.x - 4, 600 - 48, 62, 12);
}

function drawHay(ctx, ob) {
  ctx.fillStyle = '#e0a83c';
  ctx.beginPath();
  ctx.moveTo(ob.x, 600);
  ctx.quadraticCurveTo(ob.x + 48, 600 - 96, ob.x + 96, 600);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b07f22';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(ob.x + 16 + i * 18, 600 - 18 - i * 8);
    ctx.quadraticCurveTo(ob.x + 48, 600 - 60 - i * 4, ob.x + 80 - i * 8, 600 - 18);
    ctx.stroke();
  }
}

function drawCrate(ctx, ob) {
  ctx.fillStyle = '#a8763e';
  ctx.fillRect(ob.x, 600 - 84, 84, 84);
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 4;
  ctx.strokeRect(ob.x + 2, 600 - 82, 80, 80);
  ctx.beginPath();
  ctx.moveTo(ob.x, 600);
  ctx.lineTo(ob.x + 84, 600 - 84);
  ctx.moveTo(ob.x + 84, 600);
  ctx.lineTo(ob.x, 600 - 84);
  ctx.stroke();
}

function drawOven(ctx, ob, world) {
  // A farmhouse oven, door glowing, heat shimmering.
  ctx.fillStyle = '#3a3a3a';
  rr(ctx, ob.x, 600 - 120, 110, 120, 8);
  ctx.fill();
  ctx.fillStyle = '#c94f32';
  ctx.fillRect(ob.x + 8, 600 - 112, 94, 22);
  ctx.fillStyle = '#ff9d5c';
  ctx.fillRect(ob.x + 16, 600 - 82, 78, 56);
  ctx.fillStyle = '#ffd94a';
  ellipse(ctx, ob.x + 55, 600 - 54, 26 + Math.sin(world.time * 6) * 4, 16);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(ob.x + 16, 600 - 34, 78, 8);
  ctx.fillStyle = '#c9c2b4';
  for (let i = 0; i < 3; i++) ctx.fillRect(ob.x + 22 + i * 28, 600 - 112, 14, 22);
}

function drawKnife(ctx, ob) {
  const sway = Math.sin(ob.swing) * 26;
  ctx.save();
  ctx.translate(ob.x + 30 + sway, 600 - 130);
  ctx.rotate(Math.sin(ob.swing) * 0.25);
  // Handle.
  ctx.fillStyle = '#5d3a1a';
  rr(ctx, -8, -14, 16, 44, 6);
  ctx.fill();
  // Blade, glinting.
  ctx.fillStyle = '#d9dde2';
  ctx.beginPath();
  ctx.moveTo(-10, 30);
  ctx.lineTo(10, 30);
  ctx.lineTo(0, 118);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-6, 34);
  ctx.lineTo(-1, 34);
  ctx.lineTo(-4, 96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Warning shadow on the ground where it will land.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ellipse(ctx, ob.x + 30 + sway, 602, 34, 6);
}

function drawBeam(ctx, ob) {
  // A low barn beam on struts: head height, so the turkey must slide.
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(ob.x + 12, 500);
  ctx.lineTo(ob.x + 2, 420);
  ctx.moveTo(ob.x + ob.width - 12, 500);
  ctx.lineTo(ob.x + ob.width + 8, 420);
  ctx.stroke();
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(ob.x, 500, ob.width, 45);
  ctx.fillStyle = '#6e4520';
  ctx.fillRect(ob.x, 500, ob.width, 8);
  ctx.fillStyle = '#c9c2b4';
  ctx.fillRect(ob.x + 8, 516, 12, 12);
  ctx.fillRect(ob.x + ob.width - 20, 516, 12, 12);
}

function drawPuddle(ctx, ob) {
  ctx.fillStyle = '#7fb8d9';
  ellipse(ctx, ob.x + 60, 598, 62, 9);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ellipse(ctx, ob.x + 40, 596, 22, 3);
  ellipse(ctx, ob.x + 80, 599, 16, 2);
}

function drawObstacle(ctx, ob, world) {
  if (ob.kind === 'fence') drawFence(ctx, ob);
  else if (ob.kind === 'hay') drawHay(ctx, ob);
  else if (ob.kind === 'crate') drawCrate(ctx, ob);
  else if (ob.kind === 'oven') drawOven(ctx, ob, world);
  else if (ob.kind === 'knife') drawKnife(ctx, ob);
  else if (ob.kind === 'beam') drawBeam(ctx, ob);
  else if (ob.kind === 'puddle') drawPuddle(ctx, ob);
}

function drawPickup(ctx, p, world) {
  const bob = Math.sin(world.time * 4 + p.spin) * 4;
  if (p.kind === 'corn' || p.kind === 'goldenCorn') {
    const golden = p.kind === 'goldenCorn';
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.rotate(Math.sin(world.time * 2 + p.spin) * 0.15);
    ctx.fillStyle = golden ? '#ffd94a' : '#f2c14e';
    ellipse(ctx, 0, 0, 10, 18);
    ctx.fillStyle = golden ? '#ffe98a' : '#f7d774';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(i * 6 - 1.5, -14, 3, 28);
    }
    ctx.fillStyle = '#7fae4c';
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-16, 26);
    ctx.lineTo(-2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(16, 26);
    ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Pumpkin pie slice.
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = '#e8894a';
    ctx.beginPath();
    ctx.moveTo(-18, 10);
    ctx.lineTo(18, 10);
    ctx.lineTo(0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7d774';
    ctx.fillRect(-18, 10, 36, 6);
    ctx.fillStyle = '#fff8e0';
    ellipse(ctx, 0, -8, 7, 6);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- HUD & screens

export function drawHUD(ctx, world, muted) {
  // Top bar.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
  rr(ctx, 12, 12, 540, 66, 12);
  ctx.fill();
  text(ctx, 'SCORE', 34, 30, 'bold 15px Georgia, serif', '#ffd94a', 'left');
  text(ctx, String(world.score).padStart(5, '0'), 34, 56, 'bold 26px Georgia, serif', '#ffffff', 'left');
  text(ctx, 'DISTANCE', 210, 30, 'bold 15px Georgia, serif', '#ffd94a', 'left');
  text(ctx, `${Math.floor(world.distance)} m`, 210, 56, 'bold 26px Georgia, serif', '#ffffff', 'left');
  text(ctx, 'STAGE', 380, 30, 'bold 15px Georgia, serif', '#ffd94a', 'left');
  text(ctx, world.stage.name, 380, 56, 'bold 18px Georgia, serif', '#ffffff', 'left');

  // Lives as hearts.
  for (let i = 0; i < 3; i++) {
    const x = 576 + i * 40;
    const y = 40;
    ctx.fillStyle = i < world.lives ? '#e84a5f' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 14, y - 6, x - 4, y - 14, x, y - 6);
    ctx.bezierCurveTo(x + 4, y - 14, x + 14, y - 6, x, y + 8);
    ctx.fill();
  }

  // Farmer proximity: the closer he is, the redder the bar.
  const closeness = 1 - (world.farmer.gap - FARMER.catchGap) / (FARMER.safeGap - FARMER.catchGap);
  const barW = 220;
  const bx = 1030 - barW;
  ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
  rr(ctx, bx - 12, 12, barW + 24, 66, 12);
  ctx.fill();
  text(ctx, 'FARMER', bx + barW / 2, 30, 'bold 15px Georgia, serif', '#ffb3a0', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, bx, 44, barW, 16, 8);
  ctx.fill();
  const fill = closeness > 0.75 ? '#e84a5f' : closeness > 0.45 ? '#f2a541' : '#7fae4c';
  ctx.fillStyle = fill;
  rr(ctx, bx, 44, Math.max(16, barW * closeness), 16, 8);
  ctx.fill();
  text(ctx, world.farmer.searching ? 'SEARCHING…' : closeness > 0.75 ? 'HE\'S RIGHT BEHIND YOU!' : 'KEEP RUNNING', bx + barW / 2, 72, 'bold 13px Georgia, serif', '#fff3d6');

  // Pause and mute buttons.
  for (const [btn, label] of [[PAUSE_BTN, 'II'], [MUTE_BTN, muted ? 'MUTE' : 'SOUND']]) {
    ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fill();
    text(ctx, label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 'bold 15px Georgia, serif', '#fff3d6');
  }

  // Controls hint, fading after the first seconds.
  if (world.time < 6) {
    ctx.globalAlpha = Math.max(0, 1 - world.time / 6);
    text(ctx, 'SPACE / CLICK — jump & flap   •   DOWN / S — slide   •   P — pause', 640, 690, 'bold 17px Georgia, serif', '#fff3d6');
    ctx.globalAlpha = 1;
  }
}

function drawButton(ctx, rect, label, sub) {
  ctx.fillStyle = '#c94f32';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.fillStyle = '#a83c2a';
  rr(ctx, rect.x, rect.y + rect.h - 10, rect.w, 10, 6);
  ctx.fill();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 10 : 0), 'bold 30px Georgia, serif', '#fff8e0');
  if (sub) text(ctx, sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 22, '16px Georgia, serif', '#ffe8c8');
}

export function drawTitle(ctx, world, best) {
  drawSky(ctx, world);
  drawBackdrop(ctx, world);
  drawGround(ctx, world);
  // The turkey, mid-escape, with the farmer on its tail.
  drawTurkey(ctx, 430, 600, { ...world, turkey: { ...world.turkey, onGround: true, sliding: false, stumbleTimer: 0, flapTimer: 0 }, time: 1.2 });
  drawFarmer(ctx, 180, 600, { ...world, farmer: { ...world.farmer, searching: false }, time: 1.2 });
  // Title block.
  outlineText(ctx, 'TURKEY RUN', 640, 150, 'bold 96px Georgia, serif', '#fff3d6', '#7e2a1d', 10);
  text(ctx, 'Escape Thanksgiving — before you become dinner!', 640, 216, 'bold 26px Georgia, serif', '#5d3a1a');
  // How to play card.
  ctx.fillStyle = 'rgba(255, 248, 224, 0.92)';
  rr(ctx, 390, 250, 500, 150, 16);
  ctx.fill();
  text(ctx, 'The farmer is after you. Dodge the fences, hay bales,', 640, 282, '20px Georgia, serif', '#5d3a1a');
  text(ctx, 'the oven and the carving knife — and grab the corn.', 640, 310, '20px Georgia, serif', '#5d3a1a');
  text(ctx, 'SPACE / CLICK to jump & flap  •  DOWN to slide under beams', 640, 344, 'bold 20px Georgia, serif', '#7e2a1d');
  text(ctx, 'Run 1500 m through farmyard, barn and kitchen to escape!', 640, 372, '20px Georgia, serif', '#5d3a1a');
  drawButton(ctx, TITLE_START, 'START RUN', 'or press ENTER');
  if (best > 0) text(ctx, `Best score: ${best}`, 640, 626, 'bold 20px Georgia, serif', '#fff3d6');
  text(ctx, 'An original game — no turkeys were harmed', 640, 660, '16px Georgia, serif', '#fff3d6');
}

export function drawPaused(ctx, world) {
  ctx.fillStyle = 'rgba(43, 26, 14, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  outlineText(ctx, 'PAUSED', 640, 300, 'bold 72px Georgia, serif', '#fff3d6', '#7e2a1d', 8);
  text(ctx, 'P or click to keep running  •  R to restart', 640, 380, 'bold 22px Georgia, serif', '#fff3d6');
}

export function drawEnd(ctx, world, best) {
  ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  if (world.won) {
    outlineText(ctx, 'ESCAPED!', 640, 150, 'bold 96px Georgia, serif', '#bfe08a', '#2b4a1a', 10);
    text(ctx, 'You made it to the woods. Thanksgiving is cancelled — for you.', 640, 216, 'bold 24px Georgia, serif', '#fff3d6');
    drawTurkey(ctx, 640, 560, { ...world, turkey: { ...world.turkey, onGround: true, sliding: false, stumbleTimer: 0, flapTimer: 0 }, time: 1.2 });
  } else {
    outlineText(ctx, 'CAUGHT!', 640, 150, 'bold 96px Georgia, serif', '#ffb3a0', '#7e2a1d', 10);
    text(ctx, 'The farmer got you. Dinner is served… better luck next run.', 640, 216, 'bold 24px Georgia, serif', '#fff3d6');
    drawFarmer(ctx, 370, 600, { ...world, farmer: { ...world.farmer, searching: false }, time: 1.2 });
    drawTurkey(ctx, 910, 600, { ...world, turkey: { ...world.turkey, onGround: true, sliding: false, stumbleTimer: 0, flapTimer: 0 }, time: 1.2 });
  }
  // Stats card.
  ctx.fillStyle = 'rgba(255, 248, 224, 0.94)';
  rr(ctx, 440, 250, 400, 200, 16);
  ctx.fill();
  text(ctx, `SCORE  ${world.score}`, 640, 292, 'bold 30px Georgia, serif', '#5d3a1a');
  text(ctx, `DISTANCE  ${Math.floor(world.distance)} m`, 640, 330, '22px Georgia, serif', '#5d3a1a');
  text(ctx, `BEST CORN STREAK  ${world.bestStreak}`, 640, 368, '22px Georgia, serif', '#5d3a1a');
  text(ctx, `BEST SCORE  ${Math.max(best, world.score)}`, 640, 406, 'bold 22px Georgia, serif', '#7e2a1d');
  drawButton(ctx, END_AGAIN, 'RUN AGAIN', 'or press R / ENTER');
  text(ctx, 'Tip: corn widens the gap to the farmer. Slide under the barn beams.', 640, 660, '17px Georgia, serif', '#fff3d6');
}

// ---------------------------------------------------------------- frame

export function drawWorld(ctx, world, opts = {}) {
  const characters = opts.characters !== false;
  ctx.save();
  if (world.shake > 0) {
    const s = world.shake * 22;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawSky(ctx, world);
  drawBackdrop(ctx, world);
  drawGround(ctx, world);
  for (const ob of world.obstacles) drawObstacle(ctx, ob, world);
  for (const p of world.pickups) if (!p.taken) drawPickup(ctx, p, world);
  if (characters) {
    // The farmer, behind the turkey by the gap.
    const farmerX = TURKEY.x - world.farmer.gap - 30;
    drawFarmer(ctx, farmerX, VIEW.groundY, world);
    drawTurkey(ctx, TURKEY.x, VIEW.groundY - world.turkey.y, world);
  }
  // Particles and floating score texts.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ellipse(ctx, p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const fl of world.floats) {
    ctx.globalAlpha = Math.max(0, fl.life);
    outlineText(ctx, fl.text, fl.x, fl.y, 'bold 22px Georgia, serif', fl.color, '#5d3a1a', 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawFrame(ctx, world, screen, best, muted) {
  if (screen === 'title') drawTitle(ctx, world, best);
  else if (screen === 'end') {
    // The frozen run, dimmed, without its own turkey and farmer:
    // the end screen draws its own pair, flanking the button.
    drawWorld(ctx, world, { characters: false });
    drawEnd(ctx, world, best);
  } else {
    drawWorld(ctx, world);
    drawHUD(ctx, world, muted);
    if (screen === 'paused') drawPaused(ctx, world);
  }
}
