// world.js — the run itself: the turkey, the farmer who chases it,
// the obstacles and corn it meets, the stages it runs through, and
// every collision. Pure state plus step(); render.js draws it.

import { TURKEY, RUN, FARMER, STAGES, OBSTACLES, PICKUPS } from './config.js';
import { mulberry32, pickWeighted, range, chance } from './random.js';

export function stageFor(distance) {
  let stage = STAGES[0];
  for (const s of STAGES) if (distance >= s.from) stage = s;
  return stage;
}

export function createWorld(seed) {
  const rng = mulberry32(seed);
  const world = {
    seed,
    rng,
    time: 0,
    distance: 0,
    score: 0,
    lives: RUN.startLives,
    speed: RUN.startSpeed,
    stage: STAGES[0],
    stageIndex: 0,
    turkey: {
      y: 0,
      vy: 0,
      onGround: true,
      jumps: 0,
      sliding: false,
      slideTimer: 0,
      stumbleTimer: 0,
      flapTimer: 0,
    },
    farmer: { gap: FARMER.startGap, searching: false, searchTimer: 0, surge: 0 },
    obstacles: [],
    pickups: [],
    particles: [],
    floats: [],
    nextSpawnX: 520,
    cleanTime: 0,
    cornStreak: 0,
    bestStreak: 0,
    over: false,
    won: false,
    reason: '',
    shake: 0,
  };
  // Pre-seed two obstacles so the run starts busy, not empty.
  spawnObstacle(world, rng, 950);
  spawnObstacle(world, rng, 1500);
  return world;
}

function spawnObstacle(world, rng, x) {
  const stage = world.stage;
  const kind = pickWeighted(rng, stage.obstacles, stage.weights);
  const def = OBSTACLES[kind];
  const ob = {
    kind,
    x,
    y: 0,
    width: def.width,
    height: def.height,
    score: def.score,
    passed: false,
    // Knives swing down from above; puddles sit flat on the ground.
    swing: kind === 'knife' ? range(rng, 0, Math.PI * 2) : 0,
    bob: kind === 'knife' ? range(rng, 0.6, 1.4) : 0,
  };
  world.obstacles.push(ob);
  // Corn often trails an obstacle, tempting a risky line.
  if (chance(rng, 0.55)) {
    const n = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      world.pickups.push({
        kind: chance(rng, 0.12) ? 'goldenCorn' : 'corn',
        x: x + 90 + i * 44,
        y: chance(rng, 0.5) ? 470 : 520,
        taken: false,
        spin: rng() * Math.PI * 2,
      });
    }
  }
  if (chance(rng, 0.10)) {
    world.pickups.push({ kind: 'pie', x: x + 220, y: 440, taken: false, spin: 0 });
  }
}

function burst(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    world.particles.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
      life: 0.5 + Math.random() * 0.4, max: 0.9, color, size: 3 + Math.random() * 5,
    });
  }
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.0 });
}

export function turkeyBox(world) {
  const t = world.turkey;
  const h = t.sliding ? TURKEY.slideHeight : TURKEY.height;
  // A few pixels of forgiveness: the box ends just above the feet.
  return {
    x: TURKEY.x - TURKEY.width / 2 + 8,
    y: 600 - t.y - h + 10,
    w: TURKEY.width - 16,
    h: h - 14,
  };
}

function obstacleBox(ob) {
  if (ob.kind === 'knife') {
    // The knife hangs and swings: its danger zone is its lower half.
    const sway = Math.sin(ob.swing) * 26;
    return { x: ob.x + sway, y: 600 - ob.height, w: ob.width, h: ob.height };
  }
  if (ob.kind === 'beam') {
    // A low barn beam: it hangs at head height, so a running turkey
    // hits it and a sliding turkey passes underneath.
    return { x: ob.x, y: 600 - 100, w: ob.width, h: 45 };
  }
  if (ob.kind === 'puddle') return { x: ob.x, y: 600 - 10, w: ob.width, h: 10 };
  return { x: ob.x, y: 600 - ob.height, w: ob.width, h: ob.height };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function stepWorld(world, input, dt, sfx) {
  if (world.over) return;
  world.time += dt;
  const t = world.turkey;

  // Speed rises with distance; the run gets harder the further it goes.
  world.speed = Math.min(
    RUN.maxSpeed,
    RUN.startSpeed + world.distance * RUN.speedPerMetre,
  );
  const move = world.speed * dt;
  world.distance += move / RUN.pxPerMetre;

  // Stage changes: farmyard, barn, kitchen.
  const stage = stageFor(world.distance);
  if (stage !== world.stage) {
    world.stage = stage;
    world.stageIndex = STAGES.indexOf(stage);
    sfx.stage();
    addFloat(world, 640, 260, stage.name, '#fff3d6');
  }

  // --- Turkey physics: jump, double-flap, slide.
  if (t.stumbleTimer > 0) t.stumbleTimer -= dt;
  if (t.slideTimer > 0) t.slideTimer -= dt;
  t.sliding = input.slideHeld() && t.onGround && t.stumbleTimer <= 0;
  if (input.consumeJump() && t.stumbleTimer <= 0) {
    if (t.onGround) {
      t.vy = TURKEY.jumpVelocity;
      t.onGround = false;
      t.jumps = 1;
      t.flapTimer = 0.22;
      sfx.jump();
    } else if (t.jumps < 2) {
      t.vy = TURKEY.flapVelocity;
      t.jumps = 2;
      t.flapTimer = 0.28;
      burst(world, TURKEY.x - 20, 600 - t.y - 10, '#fff8e0', 6, 120);
      sfx.flap();
    }
  }
  if (t.flapTimer > 0) t.flapTimer -= dt;
  t.vy = Math.min(t.vy + TURKEY.gravity * dt, TURKEY.maxFall);
  t.y += -t.vy * dt;
  if (t.y <= 0) {
    t.y = 0;
    t.vy = 0;
    t.onGround = true;
    t.jumps = 0;
  } else {
    t.onGround = false;
  }

  // --- Spawning: obstacles march in from just off the right edge.
  world.nextSpawnX -= move;
  if (world.nextSpawnX <= 0) {
    spawnObstacle(world, world.rng, 1300 + world.rng() * 120);
    const spacing = 430 + world.rng() * 300 - Math.min(130, world.distance * 0.05);
    world.nextSpawnX = Math.max(320, spacing);
  }

  // --- Move obstacles and pickups left; drop what passed.
  for (const ob of world.obstacles) {
    ob.x -= move;
    if (ob.kind === 'knife') ob.swing += dt * 3.2 * ob.bob;
    if (!ob.passed && ob.x + ob.width < TURKEY.x - TURKEY.width / 2) {
      ob.passed = true;
      world.score += ob.score;
      addFloat(world, TURKEY.x + 40, 600 - t.y - 90, `+${ob.score}`, '#ffe08a');
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -80);
  for (const p of world.pickups) p.x -= move;
  world.pickups = world.pickups.filter((p) => p.x > -60 && !p.taken);

  // --- Corn pickups.
  const tb = turkeyBox(world);
  for (const p of world.pickups) {
    if (p.taken) continue;
    const def = PICKUPS[p.kind];
    const dx = p.x - (tb.x + tb.w / 2);
    const dy = p.y - (tb.y + tb.h / 2);
    if (dx * dx + dy * dy < (def.radius + 34) * (def.radius + 34)) {
      p.taken = true;
      world.score += def.value;
      world.cornStreak += 1;
      world.bestStreak = Math.max(world.bestStreak, world.cornStreak);
      world.farmer.gap = Math.min(FARMER.safeGap, world.farmer.gap + RUN.cornFarmerRelief);
      burst(world, p.x, p.y, p.kind === 'pie' ? '#ff9d5c' : '#ffd94a', p.kind === 'corn' ? 8 : 14, 160);
      addFloat(world, p.x, p.y - 30, `+${def.value}`, '#ffd94a');
      if (p.kind === 'goldenCorn' || p.kind === 'pie') sfx.golden();
      else sfx.corn();
    }
  }

  // --- Collisions with obstacles.
  for (const ob of world.obstacles) {
    if (ob.passed && ob.x + ob.width < TURKEY.x - TURKEY.width / 2) continue;
    if (boxesOverlap(tb, obstacleBox(ob))) {
      if (ob.kind === 'puddle') {
        // A puddle only slows the turkey down: the farmer gains.
        world.farmer.gap = Math.max(FARMER.catchGap, world.farmer.gap - 35);
        world.obstacles.splice(world.obstacles.indexOf(ob), 1);
        addFloat(world, TURKEY.x, 520, 'SPLASH!', '#9fd8ff');
        sfx.stumble();
        continue;
      }
      // A real hit: lose a life, stumble, the farmer closes in fast.
      world.obstacles.splice(world.obstacles.indexOf(ob), 1);
      world.lives -= 1;
      world.cornStreak = 0;
      world.cleanTime = 0;
      t.stumbleTimer = 0.9;
      t.vy = -260;
      t.onGround = false;
      world.farmer.gap = Math.max(FARMER.catchGap + 4, world.farmer.gap - RUN.stumbleFarmerGain);
      world.farmer.surge = 1.0;
      world.shake = 0.35;
      burst(world, TURKEY.x, 600 - t.y - 30, '#ffffff', 16, 260);
      burst(world, TURKEY.x, 600 - t.y - 30, '#c94f32', 10, 200);
      addFloat(world, TURKEY.x + 30, 480, 'OUCH!', '#ff6b4a');
      sfx.stumble();
      if (world.lives <= 0) {
        endRun(world, false, 'caught', sfx);
        return;
      }
      break;
    }
  }

  // --- The farmer: he surges after a stumble, searches (lags) after a
  // clean stretch, and slowly closes in as the run goes on. Clean
  // running opens the gap again, so one mistake is survivable but
  // three quick stumbles end the run.
  const f = world.farmer;
  world.cleanTime += dt;
  if (world.cleanTime > 6 && !f.searching) {
    f.searching = true;
    f.searchTimer = 2.2;
    sfx.shout();
    addFloat(world, TURKEY.x - 190, 420, '"Where\'d it go?!"', '#fff3d6');
  }
  if (f.searching) {
    f.searchTimer -= dt;
    if (f.searchTimer <= 0) {
      f.searching = false;
      world.cleanTime = 0;
    }
  }
  if (f.surge > 0) f.surge -= dt;
  if (f.searching) f.gap += 45 * dt;
  else if (f.surge > 0) f.gap -= 30 * dt;
  else if (world.cleanTime > 2) f.gap += 9 * dt;
  else f.gap -= 5 * dt;
  f.gap = Math.max(FARMER.catchGap, Math.min(FARMER.safeGap + 60, f.gap));
  if (f.gap <= FARMER.catchGap + 2) {
    endRun(world, false, 'caught', sfx);
    return;
  }

  // --- Escape: reach the woods at the end of the run.
  if (world.distance >= RUN.escapeDistance) {
    endRun(world, true, 'escaped', sfx);
    return;
  }

  // --- Particles and floating texts.
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const fl of world.floats) {
    fl.y -= 42 * dt;
    fl.life -= dt;
  }
  world.floats = world.floats.filter((fl) => fl.life > 0);
  if (world.shake > 0) world.shake -= dt;
}

function endRun(world, won, reason, sfx) {
  world.over = true;
  world.won = won;
  world.reason = reason;
  if (won) sfx.escaped();
  else sfx.caught();
}
