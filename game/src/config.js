// config.js — every tuning knob for Turkey Run, in one place.
// Distances are metres, speeds are pixels per second, sizes are pixels
// on the 1280x720 logical canvas.

export const VIEW = { width: 1280, height: 720, groundY: 600 };

export const TURKEY = {
  x: 240,
  width: 74,
  height: 64,
  slideHeight: 38,
  gravity: 2600,
  jumpVelocity: -940,
  flapVelocity: -720,
  maxFall: 1200,
};

export const RUN = {
  startSpeed: 340,
  maxSpeed: 700,
  speedPerMetre: 0.18,
  pxPerMetre: 6,
  escapeDistance: 1500,
  startLives: 3,
  stumbleFarmerGain: 55,
  cornFarmerRelief: 12,
  cleanSecondRelief: 9,
};

export const FARMER = {
  startGap: 240,
  catchGap: 26,
  safeGap: 300,
  surgeSpeed: 150,
  lagSpeed: 60,
};

// Stages the run passes through: the farmyard, the barn, then the
// farmhouse kitchen. Each stage changes the palette and the obstacle mix.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    from: 0,
    sky: ['#f7c948', '#f2a541'],
    ground: '#8a5a2b',
    grass: '#7fae4c',
    obstacles: ['fence', 'hay', 'puddle'],
    weights: [0.42, 0.38, 0.20],
  },
  {
    name: 'THE BARN',
    from: 500,
    sky: ['#e8894a', '#d96f32'],
    ground: '#6e4520',
    grass: '#a8763e',
    obstacles: ['crate', 'hay', 'beam', 'fence'],
    weights: [0.30, 0.30, 0.20, 0.20],
  },
  {
    name: 'THE KITCHEN',
    from: 1000,
    sky: ['#c96a4a', '#a84a3a'],
    ground: '#5d3a28',
    grass: '#8a6a4a',
    obstacles: ['oven', 'knife', 'crate'],
    weights: [0.38, 0.37, 0.25],
  },
];

export const OBSTACLES = {
  fence: { width: 54, height: 92, score: 15 },
  hay: { width: 96, height: 74, score: 15 },
  puddle: { width: 120, height: 18, score: 10 },
  crate: { width: 84, height: 84, score: 15 },
  oven: { width: 110, height: 120, score: 25 },
  knife: { width: 60, height: 130, score: 30 },
  beam: { width: 90, height: 100, score: 20 },
};

export const PICKUPS = {
  corn: { value: 10, radius: 16 },
  goldenCorn: { value: 50, radius: 18 },
  pie: { value: 100, radius: 20 },
};

export const KEYS = {
  jump: ['Space', 'ArrowUp', 'KeyW'],
  slide: ['ArrowDown', 'KeyS'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR', 'Enter'],
  mute: ['KeyM'],
};
