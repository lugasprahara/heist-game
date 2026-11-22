// Midnight Vault — the three rooms. Each room is one screen: walls and cover
// make several routes to the loot, guards patrol between waypoints, cameras
// sweep their arcs, and the exit is always the green door at the far side.
//
// Coordinates are in world pixels (0..1280 x 64..960). Walls block movement
// and sight; cover blocks sight and movement too, but is low enough to read
// as furniture the thief slips behind. A `kind` on a blocker picks its look:
// 'wall' (room shell / partition), 'pillar', 'crate', 'case' (display case).
export const LEVELS = [
  {
    name: 'Level 1 — The Gallery',
    briefing: 'Lift the Star Sapphire from its case, then slip out the green door.',
    playerStart: { x: 90, y: 880 },
    exit: { x: 1150, y: 120, w: 84, h: 60 },
    gem: { x: 640, y: 240 },
    loot: [
      { kind: 'gold', x: 300, y: 300 },
      { kind: 'art', x: 980, y: 700 },
      { kind: 'gold', x: 1120, y: 820 },
    ],
    blockers: [
      // Room shell (leaves the exit gap at the top-right door).
      { kind: 'wall', x: 0, y: 64, w: 1280, h: 18 },
      { kind: 'wall', x: 0, y: 64, w: 18, h: 896 },
      { kind: 'wall', x: 0, y: 942, w: 1280, h: 18 },
      { kind: 'wall', x: 1262, y: 64, w: 18, h: 56 },
      { kind: 'wall', x: 1262, y: 180, w: 18, h: 780 },
      // Partitions that split the room into routes.
      { kind: 'wall', x: 380, y: 300, w: 220, h: 24 },
      { kind: 'wall', x: 700, y: 560, w: 220, h: 24 },
      { kind: 'wall', x: 180, y: 620, w: 24, h: 180 },
      // Cover: pillars, crates, display cases.
      { kind: 'pillar', x: 300, y: 470, w: 54, h: 54 },
      { kind: 'pillar', x: 940, y: 470, w: 54, h: 54 },
      { kind: 'crate', x: 520, y: 700, w: 70, h: 70 },
      { kind: 'crate', x: 880, y: 300, w: 70, h: 70 },
      { kind: 'case', x: 600, y: 200, w: 80, h: 80 },
      { kind: 'case', x: 180, y: 180, w: 80, h: 80 },
      { kind: 'crate', x: 1080, y: 560, w: 70, h: 70 },
    ],
    guards: [
      {
        waypoints: [
          { x: 280, y: 150 }, { x: 830, y: 150 },
          { x: 830, y: 420 }, { x: 280, y: 420 },
        ],
        speed: 62, coneLength: 235, coneHalfAngle: 0.46, pauseSeconds: 1.1,
      },
      {
        waypoints: [
          { x: 1020, y: 660 }, { x: 620, y: 660 },
          { x: 620, y: 880 }, { x: 1020, y: 880 },
        ],
        speed: 58, coneLength: 220, coneHalfAngle: 0.46, pauseSeconds: 1.4,
      },
    ],
    cameras: [
      { x: 640, y: 82, baseAngle: Math.PI / 2, sweepAngle: 1.15, sweepSpeed: 0.55, coneLength: 300, coneHalfAngle: 0.34 },
      { x: 1262, y: 480, baseAngle: Math.PI, sweepAngle: 1.0, sweepSpeed: 0.45, coneLength: 280, coneHalfAngle: 0.34 },
    ],
  },
  {
    name: 'Level 2 — The Vault Floor',
    briefing: 'Two vaults, three patrols. The sapphire moved deeper — follow the gold.',
    playerStart: { x: 90, y: 880 },
    exit: { x: 1150, y: 120, w: 84, h: 60 },
    gem: { x: 1080, y: 240 },
    loot: [
      { kind: 'gold', x: 220, y: 220 },
      { kind: 'art', x: 640, y: 480 },
      { kind: 'gold', x: 420, y: 800 },
      { kind: 'art', x: 1120, y: 700 },
    ],
    blockers: [
      { kind: 'wall', x: 0, y: 64, w: 1280, h: 18 },
      { kind: 'wall', x: 0, y: 64, w: 18, h: 896 },
      { kind: 'wall', x: 0, y: 942, w: 1280, h: 18 },
      { kind: 'wall', x: 1262, y: 64, w: 18, h: 56 },
      { kind: 'wall', x: 1262, y: 180, w: 18, h: 780 },
      { kind: 'wall', x: 300, y: 240, w: 24, h: 260 },
      { kind: 'wall', x: 700, y: 420, w: 260, h: 24 },
      { kind: 'wall', x: 980, y: 480, w: 24, h: 260 },
      { kind: 'wall', x: 420, y: 680, w: 220, h: 24 },
      { kind: 'pillar', x: 520, y: 300, w: 54, h: 54 },
      { kind: 'pillar', x: 820, y: 640, w: 54, h: 54 },
      { kind: 'pillar', x: 180, y: 520, w: 54, h: 54 },
      { kind: 'crate', x: 620, y: 760, w: 70, h: 70 },
      { kind: 'crate', x: 1060, y: 420, w: 70, h: 70 },
      { kind: 'case', x: 1040, y: 200, w: 80, h: 80 },
      { kind: 'case', x: 560, y: 120, w: 80, h: 80 },
      { kind: 'crate', x: 240, y: 640, w: 70, h: 70 },
    ],
    guards: [
      {
        waypoints: [
          { x: 260, y: 150 }, { x: 480, y: 150 },
          { x: 480, y: 600 }, { x: 260, y: 600 },
        ],
        speed: 68, coneLength: 245, coneHalfAngle: 0.46, pauseSeconds: 0.9,
      },
      {
        waypoints: [
          { x: 760, y: 320 }, { x: 1180, y: 320 },
          { x: 1180, y: 380 }, { x: 760, y: 380 },
        ],
        speed: 66, coneLength: 240, coneHalfAngle: 0.46, pauseSeconds: 1.0,
      },
      {
        waypoints: [
          { x: 360, y: 600 }, { x: 900, y: 600 },
          { x: 900, y: 880 }, { x: 360, y: 880 },
        ],
        speed: 64, coneLength: 230, coneHalfAngle: 0.46, pauseSeconds: 1.2,
      },
    ],
    cameras: [
      { x: 640, y: 82, baseAngle: Math.PI / 2, sweepAngle: 1.2, sweepSpeed: 0.6, coneLength: 310, coneHalfAngle: 0.34 },
      { x: 18, y: 480, baseAngle: 0, sweepAngle: 1.0, sweepSpeed: 0.5, coneLength: 290, coneHalfAngle: 0.34 },
      { x: 1262, y: 760, baseAngle: Math.PI, sweepAngle: 1.1, sweepSpeed: 0.5, coneLength: 290, coneHalfAngle: 0.34 },
    ],
  },
  {
    name: 'Level 3 — The Diamond Wing',
    briefing: 'The last wing. Four patrols, four cameras, one very nervous vault.',
    playerStart: { x: 90, y: 880 },
    exit: { x: 1150, y: 120, w: 84, h: 60 },
    gem: { x: 640, y: 180 },
    loot: [
      { kind: 'gold', x: 200, y: 180 },
      { kind: 'art', x: 1120, y: 180 },
      { kind: 'gold', x: 200, y: 820 },
      { kind: 'art', x: 1120, y: 820 },
      { kind: 'gold', x: 640, y: 560 },
    ],
    blockers: [
      { kind: 'wall', x: 0, y: 64, w: 1280, h: 18 },
      { kind: 'wall', x: 0, y: 64, w: 18, h: 896 },
      { kind: 'wall', x: 0, y: 942, w: 1280, h: 18 },
      { kind: 'wall', x: 1262, y: 64, w: 18, h: 56 },
      { kind: 'wall', x: 1262, y: 180, w: 18, h: 780 },
      { kind: 'wall', x: 420, y: 260, w: 440, h: 24 },
      { kind: 'wall', x: 200, y: 480, w: 24, h: 220 },
      { kind: 'wall', x: 1056, y: 480, w: 24, h: 220 },
      { kind: 'wall', x: 520, y: 700, w: 240, h: 24 },
      { kind: 'pillar', x: 340, y: 360, w: 54, h: 54 },
      { kind: 'pillar', x: 886, y: 360, w: 54, h: 54 },
      { kind: 'pillar', x: 340, y: 580, w: 54, h: 54 },
      { kind: 'pillar', x: 886, y: 580, w: 54, h: 54 },
      { kind: 'crate', x: 600, y: 420, w: 70, h: 70 },
      { kind: 'crate', x: 180, y: 380, w: 70, h: 70 },
      { kind: 'crate', x: 1030, y: 380, w: 70, h: 70 },
      { kind: 'case', x: 600, y: 140, w: 80, h: 80 },
      { kind: 'case', x: 120, y: 620, w: 80, h: 80 },
      { kind: 'case', x: 1080, y: 620, w: 80, h: 80 },
    ],
    guards: [
      {
        waypoints: [
          { x: 240, y: 120 }, { x: 1040, y: 120 },
          { x: 1040, y: 320 }, { x: 240, y: 320 },
        ],
        speed: 76, coneLength: 255, coneHalfAngle: 0.46, pauseSeconds: 0.8,
      },
      {
        waypoints: [
          { x: 300, y: 330 }, { x: 980, y: 330 },
          { x: 980, y: 660 }, { x: 300, y: 660 },
        ],
        speed: 72, coneLength: 245, coneHalfAngle: 0.46, pauseSeconds: 0.9,
      },
      {
        waypoints: [
          { x: 300, y: 780 }, { x: 980, y: 780 },
          { x: 980, y: 900 }, { x: 300, y: 900 },
        ],
        speed: 72, coneLength: 245, coneHalfAngle: 0.46, pauseSeconds: 0.9,
      },
      {
        waypoints: [
          { x: 80, y: 340 }, { x: 280, y: 340 },
          { x: 280, y: 900 }, { x: 80, y: 900 },
        ],
        speed: 70, coneLength: 240, coneHalfAngle: 0.46, pauseSeconds: 1.0,
      },
    ],
    cameras: [
      { x: 420, y: 82, baseAngle: Math.PI / 2, sweepAngle: 1.2, sweepSpeed: 0.65, coneLength: 320, coneHalfAngle: 0.34 },
      { x: 860, y: 82, baseAngle: Math.PI / 2, sweepAngle: 1.2, sweepSpeed: 0.65, coneLength: 320, coneHalfAngle: 0.34 },
      { x: 18, y: 560, baseAngle: 0, sweepAngle: 1.05, sweepSpeed: 0.55, coneLength: 300, coneHalfAngle: 0.34 },
      { x: 1262, y: 560, baseAngle: Math.PI, sweepAngle: 1.05, sweepSpeed: 0.55, coneLength: 300, coneHalfAngle: 0.34 },
    ],
  },
];
