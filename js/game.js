(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const preview = document.getElementById("preview");
  const pctx = preview.getContext("2d");

  const WORLD = { w: 16000, h: 4600, ground: 4280, water: 4120 };
  const GLOBE_COUNT = 24;

  const TRIBES = [
    {
      id: "nightstar",
      name: "Nightstar",
      epithet: "Watchers of the Stars",
      desc: "Black scales dusted with silver. Wing membranes glitter like a clear night, and their breath unravels into sparks of starfire.",
      body: "#16161f",
      belly: "#cbb58a",
      wing: "#2b2154",
      vein: "#e7d08a",
      horn: "#d9c7a0",
      eye: "#f0d45c",
      glow: "#9b86ff",
      breath: "starfire",
      speed: 1.08,
      stamina: 1.15,
      health: 90,
      stars: true,
    },
    {
      id: "skyfire",
      name: "Skyfire",
      epithet: "Lords of the Thermals",
      desc: "Scarlet and gold, built for speed. They ride heat rising off the cliffs and breathe a long, hungry flame.",
      body: "#b42318",
      belly: "#f3c96b",
      wing: "#7a120c",
      vein: "#f59e0b",
      horn: "#f8e3a3",
      eye: "#ffe08a",
      glow: "#ff6b2c",
      breath: "flame",
      speed: 1.22,
      stamina: 0.95,
      health: 85,
    },
    {
      id: "tideclaw",
      name: "Tideclaw",
      epithet: "Singers of the Deep",
      desc: "Sea-glass scales and glowing stripes. They dive as easily as they fly, and their breath is a pressurized jet of saltwater.",
      body: "#1d4e89",
      belly: "#9ee7d0",
      wing: "#0f3a66",
      vein: "#7cf0e4",
      horn: "#d7f6ff",
      eye: "#8cf4ff",
      glow: "#3ee0ff",
      breath: "tide",
      speed: 1.0,
      stamina: 1.2,
      health: 100,
      aquatic: true,
      stripes: true,
    },
    {
      id: "frostspine",
      name: "Frostspine",
      epithet: "Needles of the North",
      desc: "Pale as packed snow, with serrated ice along the spine. Their breath rakes the air into frost.",
      body: "#d7e7f5",
      belly: "#8fb4d4",
      wing: "#bcd4ea",
      vein: "#5b7fa3",
      horn: "#f7fbff",
      eye: "#7ecbff",
      glow: "#c9f0ff",
      breath: "frost",
      speed: 1.05,
      stamina: 1.0,
      health: 95,
      spikes: true,
    },
    {
      id: "bloomscale",
      name: "Bloomscale",
      epithet: "Chameleons of the Canopy",
      desc: "Rainforest dragons whose scales drink color from the light. They spit a shimmering venom and vanish into the trees.",
      body: "#3aa35a",
      belly: "#f3d48b",
      wing: "#ee5d9a",
      vein: "#ffe08a",
      horn: "#8b5a2b",
      eye: "#7cffb2",
      glow: "#ff7ad9",
      breath: "venom",
      speed: 1.02,
      stamina: 1.05,
      health: 80,
      chroma: true,
    },
    {
      id: "dunehorn",
      name: "Dunehorn",
      epithet: "Stingers of the Dunes",
      desc: "Sand-gold and lean, with a black barb at the tail. They kick up grit and strike from sun-bleached thermals.",
      body: "#c9953a",
      belly: "#f3e0b0",
      wing: "#a06b22",
      vein: "#5a3a14",
      horn: "#3a2a12",
      eye: "#e8ff6a",
      glow: "#ffd27a",
      breath: "sand",
      speed: 1.1,
      stamina: 1.08,
      health: 90,
      barb: true,
    },
    {
      id: "bogscale",
      name: "Bogscale",
      epithet: "Shields of the Riverbank",
      desc: "Thick amber armor and heavy wings. Slow to rise, brutal in a dive, and tough enough to shrug off a hit.",
      body: "#6b3a1f",
      belly: "#c9844a",
      wing: "#4a2714",
      vein: "#d7a15a",
      horn: "#2b1a10",
      eye: "#ffb347",
      glow: "#d97706",
      breath: "mudfire",
      speed: 0.86,
      stamina: 0.9,
      health: 130,
    },
  ];

  const keys = new Set();
  const mouse = { x: 0, y: 0 };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let last = 0;
  let state = "menu";
  let selectedTribe = 0;
  let bannerTimer = 0;
  let bannerText = "";
  let timeOfDay = 0.28;
  let audio;
  let previewPhase = 0;

  const world = {
    mountains: [],
    trees: [],
    clouds: [],
    islands: [],
    ruins: [],
    waves: [],
  };

  const particles = [];
  const globes = [];
  const prey = [];
  const deer = [];
  const npcs = [];
  let players = [];
  let camera = { x: 0, y: 0, zoom: 1 };
  let collected = 0;
  let preyTaken = 0;
  let deerTaken = 0;
  let downs = 0;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function generateWorld() {
    world.mountains = [];
    world.trees = [];
    world.clouds = [];
    world.islands = [];
    world.ruins = [];

    for (let i = 0; i < 28; i++) {
      world.mountains.push({
        x: i * 620 - 200,
        y: WORLD.ground - rand(420, 1400),
        w: rand(480, 980),
        peak: rand(0.35, 0.65),
        shade: rand(0.08, 0.22),
        snow: i > 20 || i < 2,
      });
    }

    for (let i = 0; i < 220; i++) {
      const x = rand(1800, 11800);
      world.trees.push({
        x,
        h: rand(70, 220),
        jungle: x > 6200 && x < 9800,
        palm: x > 2200 && x < 4300,
      });
    }

    for (let i = 0; i < 70; i++) {
      world.clouds.push({
        x: rand(0, WORLD.w),
        y: rand(200, 2400),
        s: rand(0.6, 2.2),
        z: rand(0.2, 0.85),
        w: rand(160, 420),
      });
    }

    for (let i = 0; i < 18; i++) {
      world.islands.push({
        x: rand(600, WORLD.w - 600),
        y: rand(1400, 3600),
        w: rand(180, 460),
        h: rand(50, 120),
      });
    }

    for (let i = 0; i < 10; i++) {
      world.islands.push({
        x: 3200 + i * 220 + rand(-40, 40),
        y: 3000 + rand(-180, 220),
        w: rand(140, 280),
        h: rand(40, 80),
      });
    }

    for (let i = 0; i < 8; i++) {
      world.ruins.push({
        x: 7000 + i * 380 + rand(-40, 40),
        y: WORLD.ground - rand(40, 180),
        h: rand(90, 260),
        w: rand(28, 54),
      });
    }
  }

  function spawnCollectibles() {
    globes.length = 0;
    prey.length = 0;
    for (let i = 0; i < GLOBE_COUNT; i++) {
      globes.push({
        x: rand(500, WORLD.w - 500),
        y: rand(500, WORLD.ground - 400),
        taken: false,
        phase: rand(0, Math.PI * 2),
      });
    }
    for (let i = 0; i < 16; i++) {
      prey.push({
        x: rand(400, WORLD.w - 400),
        y: rand(700, WORLD.ground - 80),
        vx: rand(-80, 80),
        vy: rand(-20, 20),
        kind: Math.random() < 0.35 ? "fish" : "bird",
        taken: false,
        phase: rand(0, 10),
      });
    }
    spawnDeer();
  }

  function spawnDeer() {
    deer.length = 0;
    for (let i = 0; i < 5; i++) {
      deer.push({
        x: 3920 + i * 70 + rand(-12, 12),
        y: 2992,
        vx: rand(-20, 20),
        vy: 0,
        buck: i % 2 === 0,
        taken: false,
        health: 18,
        phase: rand(0, 10),
        spook: 0,
        perch: 2992,
      });
    }
    for (let h = 0; h < 7; h++) {
      const bx = rand(2800, WORLD.w - 800);
      const count = 4 + Math.floor(rand(0, 3));
      for (let i = 0; i < count; i++) {
        deer.push({
          x: bx + rand(-220, 220),
          y: WORLD.ground - 14,
          vx: rand(-30, 30),
          vy: 0,
          buck: Math.random() < 0.4,
          taken: false,
          health: 18,
          phase: rand(0, 10),
          spook: 0,
          perch: WORLD.ground - 14,
        });
      }
    }
  }

  function spawnNpcs() {
    npcs.length = 0;
    for (let i = 0; i < 10; i++) {
      const tribe = TRIBES[i % TRIBES.length];
      const d = makeDragon(tribe, rand(600, WORLD.w - 600), rand(700, 3000), false);
      d.npc = true;
      d.heading = rand(-0.4, 0.4);
      d.cruise = rand(140, 240);
      npcs.push(d);
    }
  }

  function makeDragon(tribe, x, y, isPlayer, binds) {
    return {
      tribe,
      x,
      y,
      vx: isPlayer ? 220 : rand(-80, 80),
      vy: isPlayer ? -30 : rand(-40, 20),
      dir: 1,
      angle: 0,
      scale: isPlayer ? 1.15 : 0.92,
      flap: 0,
      flapSpeed: 10,
      health: tribe.health,
      maxHealth: tribe.health,
      stamina: 100,
      breath: 100,
      dash: 0,
      roar: 0,
      invuln: 0,
      isPlayer: !!isPlayer,
      binds: binds || null,
      hue: 0,
      claw: 0,
      slash: 0,
      aggro: 0,
      target: null,
      dead: 0,
    };
  }

  function tribePalette(tribe, hue) {
    if (!tribe.chroma) return tribe;
    const h = hue % 360;
    return {
      ...tribe,
      body: `hsl(${h}, 62%, 42%)`,
      wing: `hsl(${(h + 40) % 360}, 70%, 46%)`,
      vein: `hsl(${(h + 80) % 360}, 80%, 62%)`,
      glow: `hsl(${(h + 20) % 360}, 85%, 65%)`,
    };
  }

  function drawWing(g, tribe, flap, behind, stars) {
    const lift = flap * (behind ? -48 : 56);
    const fold = behind ? 0.78 : 1;
    g.save();
    g.translate(-8, -12);
    g.rotate((behind ? 0.42 : -0.18) + flap * (behind ? -0.38 : 0.46));
    const tips = [
      [72 * fold, -86 + lift],
      [108 * fold, -36 + lift * 0.55],
      [112 * fold, 16 + lift * 0.2],
      [78 * fold, 44 + lift * 0.08],
      [36 * fold, 38],
    ];
    g.beginPath();
    g.moveTo(4, 4);
    for (const [x, y] of tips) g.lineTo(x, y);
    g.closePath();
    g.fillStyle = tribe.wing;
    g.globalAlpha = behind ? 0.72 : 0.95;
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = tribe.vein;
    g.lineWidth = behind ? 1.6 : 2.4;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const [x, y] of tips) {
      g.beginPath();
      g.moveTo(2, 2);
      g.quadraticCurveTo(x * 0.45, y * 0.2 - 8, x, y);
      g.stroke();
    }
    if (stars) {
      g.fillStyle = "#f7efc4";
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.arc(28 + (i % 4) * 16, -18 + Math.floor(i / 4) * 22 + flap * 6, 1.5, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  function drawDragon(g, d, t) {
    const tribe = tribePalette(d.tribe, d.hue);
    const flap = Math.sin(d.flap);
    g.save();
    g.translate(d.x, d.y);
    g.rotate(d.angle);
    g.scale(d.dir * d.scale, d.scale);

    g.shadowColor = "rgba(0,0,0,0.4)";
    g.shadowBlur = 16;
    g.shadowOffsetY = 12;

    drawWing(g, tribe, flap, true, d.tribe.stars);

    g.strokeStyle = tribe.body;
    g.lineCap = "round";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(-36, 8);
    g.quadraticCurveTo(-82, 22 + Math.sin(d.flap * 0.45) * 10, -128, 4);
    g.stroke();
    g.fillStyle = tribe.wing;
    g.beginPath();
    g.moveTo(-92, 4);
    g.quadraticCurveTo(-108, -14, -122, 2);
    g.lineTo(-100, 12);
    g.fill();
    if (d.tribe.barb) {
      g.fillStyle = "#1a1208";
      g.beginPath();
      g.moveTo(-124, 4);
      g.lineTo(-152, -6);
      g.lineTo(-128, 14);
      g.fill();
    }

    g.fillStyle = tribe.body;
    g.beginPath();
    g.moveTo(-18, 10);
    g.quadraticCurveTo(-4, 34, 16, 22);
    g.quadraticCurveTo(10, 12, -10, 10);
    g.fill();
    g.strokeStyle = tribe.horn;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(14, 22);
    g.lineTo(22, 30);
    g.stroke();

    g.fillStyle = tribe.body;
    g.beginPath();
    g.ellipse(-2, 2, 38, 16, -0.18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = tribe.belly;
    g.beginPath();
    g.ellipse(4, 8, 28, 9, -0.18, 0, Math.PI * 2);
    g.fill();

    if (d.tribe.stripes) {
      g.strokeStyle = tribe.glow;
      g.globalAlpha = 0.75 + Math.sin(t * 6) * 0.2;
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-22 + i * 12, -6);
        g.quadraticCurveTo(-16 + i * 12, 4, -20 + i * 12, 12);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    if (d.tribe.spikes) {
      g.fillStyle = "#eef7ff";
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(-26 + i * 9, -10);
        g.lineTo(-22 + i * 9, -30 - (i % 2) * 6);
        g.lineTo(-16 + i * 9, -8);
        g.fill();
      }
    } else {
      g.fillStyle = tribe.horn;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(-20 + i * 10, -12);
        g.lineTo(-16 + i * 10, -22);
        g.lineTo(-12 + i * 10, -10);
        g.fill();
      }
    }

    g.fillStyle = tribe.body;
    g.beginPath();
    g.moveTo(8, 8);
    g.quadraticCurveTo(18, 28, 32, 16);
    g.quadraticCurveTo(20, 8, 8, 8);
    g.fill();

    g.strokeStyle = tribe.body;
    g.lineWidth = 11;
    g.beginPath();
    g.moveTo(28, -2);
    g.quadraticCurveTo(52, -22, 78, -16);
    g.stroke();

    g.fillStyle = tribe.body;
    g.beginPath();
    g.ellipse(90, -16, 18, 11, -0.15, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = tribe.belly;
    g.beginPath();
    g.ellipse(96, -13, 11, 6, -0.15, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = tribe.body;
    g.beginPath();
    g.moveTo(104, -14);
    g.lineTo(124, -10);
    g.lineTo(106, -6);
    g.closePath();
    g.fill();
    g.fillStyle = tribe.horn;
    g.beginPath();
    g.moveTo(80, -24);
    g.lineTo(68, -46);
    g.lineTo(86, -22);
    g.fill();
    g.beginPath();
    g.moveTo(88, -24);
    g.lineTo(94, -44);
    g.lineTo(96, -20);
    g.fill();
    g.beginPath();
    g.moveTo(84, -8);
    g.lineTo(78, 2);
    g.lineTo(90, -6);
    g.fill();

    g.fillStyle = tribe.eye;
    g.beginPath();
    g.ellipse(98, -18, 3.1, 2.2, -0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#140c08";
    g.beginPath();
    g.arc(99, -18, 1.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(97.6, -19, 0.7, 0, Math.PI * 2);
    g.fill();

    g.shadowBlur = 0;
    drawWing(g, tribe, flap, false, d.tribe.stars);

    if (d.slash > 0) {
      g.strokeStyle = tribe.glow;
      g.globalAlpha = d.slash;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(70, 8, 28 + (1 - d.slash) * 18, 0.15, 1.35);
      g.stroke();
      g.beginPath();
      g.arc(62, 14, 22 + (1 - d.slash) * 10, 0.35, 1.45);
      g.stroke();
      g.globalAlpha = 1;
    }

    if (d.roar > 0) {
      g.strokeStyle = tribe.glow;
      g.globalAlpha = d.roar;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(128, -12, 16 + (1 - d.roar) * 28, -0.6, 0.45);
      g.stroke();
      g.globalAlpha = 1;
    }

    g.restore();
  }

  function burst(x, y, color, n, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(speed * 0.2, speed);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life || rand(0.3, 0.9),
        max: life || 0.8,
        size: rand(2, 6),
        color,
      });
    }
  }

  function breathBurst(d) {
    const tribe = d.tribe;
    const dir = d.dir;
    const noseX = d.x + Math.cos(d.angle) * 90 * d.scale * dir;
    const noseY = d.y + Math.sin(d.angle) * 40 * d.scale;
    const colors = {
      flame: ["#ffb703", "#fb8500", "#d00000"],
      starfire: ["#f8f0c8", "#c4b5fd", "#7c3aed"],
      tide: ["#90e0ef", "#48cae4", "#0077b6"],
      frost: ["#e0fbfc", "#98c1d9", "#ffffff"],
      venom: ["#b5e48c", "#76c893", "#ff85c8"],
      sand: ["#e9c46a", "#f4a261", "#bc6c25"],
      mudfire: ["#dc2f02", "#6a040f", "#faa307"],
    }[tribe.breath] || ["#fff", "#ccc"];
    for (let i = 0; i < 18; i++) {
      const spread = rand(-0.35, 0.35);
      const spd = rand(280, 560);
      particles.push({
        x: noseX,
        y: noseY,
        vx: Math.cos(d.angle + spread) * spd * dir + d.vx,
        vy: Math.sin(d.angle + spread) * spd * 0.55 + d.vy,
        life: rand(0.25, 0.55),
        max: 0.5,
        size: rand(4, 10),
        color: colors[i % colors.length],
        hurt: 18,
        owner: d,
      });
    }
    tone(tribe.breath === "tide" ? 180 : 90, 0.08, "sawtooth");
  }

  function ensureAudio() {
    if (audio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC();
  }

  function tone(freq, dur, type) {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = 0.04;
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  }

  function held(bind, name) {
    if (!bind) {
      return keys.has("KeyW") || keys.has("ArrowUp") || keys.has("KeyA") || keys.has("ArrowLeft") ||
        keys.has("KeyS") || keys.has("ArrowDown") || keys.has("KeyD") || keys.has("ArrowRight");
    }
    const map = {
      up: bind.up,
      down: bind.down,
      left: bind.left,
      right: bind.right,
      breath: bind.breath,
      dash: bind.dash,
      roar: bind.roar,
      claw: bind.claw,
    };
    return keys.has(map[name]);
  }

  function controlVector(d) {
    let x = 0;
    let y = 0;
    if (!d.binds) {
      if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
      return {
        x,
        y,
        breath: keys.has("Space"),
        dash: keys.has("ShiftLeft") || keys.has("ShiftRight"),
        roar: keys.has("KeyQ"),
        claw: keys.has("KeyF"),
      };
    }
    if (held(d.binds, "left")) x -= 1;
    if (held(d.binds, "right")) x += 1;
    if (held(d.binds, "up")) y -= 1;
    if (held(d.binds, "down")) y += 1;
    return {
      x,
      y,
      breath: held(d.binds, "breath"),
      dash: held(d.binds, "dash"),
      roar: held(d.binds, "roar"),
      claw: held(d.binds, "claw"),
    };
  }

  function allDragons() {
    return [...players, ...npcs];
  }

  function hitDragon(target, source, amount, knock) {
    if (!target || target === source || target.dead > 0 || target.invuln > 0) return false;
    target.health -= amount;
    target.invuln = 0.32;
    target.aggro = 7;
    target.target = source;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    target.vx += (dx / len) * knock;
    target.vy += (dy / len) * knock * 0.65;
    burst(target.x, target.y, target.tribe.glow, 8, 140, 0.35);
    if (target.health <= 0) downDragon(target, source);
    return true;
  }

  function downDragon(target, source) {
    burst(target.x, target.y, target.tribe.glow, 28, 260, 0.85);
    tone(55, 0.28, "sawtooth");
    if (source && source.isPlayer) {
      downs += 1;
      source.health = Math.min(source.maxHealth, source.health + 10);
      showBanner(source.tribe.name + " downed a " + target.tribe.name);
      const el = document.getElementById("kills");
      if (el) el.textContent = String(downs);
    } else if (target.isPlayer) {
      showBanner(target.tribe.name + " was struck from the sky");
    } else {
      showBanner("A wild " + target.tribe.name + " fell");
    }
    if (target.isPlayer) {
      target.dead = 2.4;
      target.health = 0;
      target.vy = 80;
    } else {
      target.x = rand(400, WORLD.w - 400);
      target.y = rand(700, 2400);
      target.health = target.maxHealth;
      target.aggro = 0;
      target.target = null;
      target.invuln = 1;
    }
  }

  function huntDeer(hunter, preyDeer) {
    if (!preyDeer || preyDeer.taken) return;
    preyDeer.taken = true;
    hunter.health = Math.min(hunter.maxHealth, hunter.health + 16);
    hunter.stamina = Math.min(100, hunter.stamina + 28);
    burst(preyDeer.x, preyDeer.y, "#8b5a2b", 16, 150, 0.55);
    tone(210, 0.1, "triangle");
    if (hunter.isPlayer) {
      deerTaken += 1;
      showBanner("Deer taken · " + deerTaken);
      const el = document.getElementById("deer-count");
      if (el) el.textContent = String(deerTaken);
    }
  }

  function clawStrike(d) {
    const reachX = d.x + d.dir * 70;
    const reachY = d.y + 10;
    for (const other of allDragons()) {
      if (other === d || other.dead > 0) continue;
      if (Math.hypot(reachX - other.x, reachY - other.y) < 78) {
        hitDragon(other, d, 24, 320);
      }
    }
    for (const preyDeer of deer) {
      if (preyDeer.taken) continue;
      if (Math.hypot(reachX - preyDeer.x, d.y - preyDeer.y) < 70) huntDeer(d, preyDeer);
    }
  }

  function nearestOf(d, list, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const o of list) {
      if (o === d || o.taken || o.dead > 0) continue;
      const gap = Math.hypot(d.x - o.x, d.y - o.y);
      if (gap < bestD) {
        bestD = gap;
        best = o;
      }
    }
    return best;
  }

  function updateDragon(d, dt) {
    const tribe = d.tribe;
    d.hue += dt * 40;
    d.invuln = Math.max(0, d.invuln - dt);
    d.roar = Math.max(0, d.roar - dt * 1.6);
    d.dash = Math.max(0, d.dash - dt);
    d.claw = Math.max(0, d.claw - dt);
    d.slash = Math.max(0, d.slash - dt * 2.8);
    d.aggro = Math.max(0, d.aggro - dt);
    d.breath = Math.min(100, d.breath + dt * 22);

    if (d.dead > 0) {
      d.dead -= dt;
      d.vy += 240 * dt;
      d.y += d.vy * dt;
      d.angle = 0.55;
      if (d.dead <= 0) {
        d.health = d.maxHealth;
        d.stamina = 100;
        d.y = clamp(d.y - 380, 500, WORLD.ground - 400);
        d.vy = -90;
        d.invuln = 1.6;
        showBanner(d.tribe.name + " takes wing again");
      }
      return;
    }

    const inWater = tribe.aquatic && d.y > WORLD.water - 10 && d.x < 2600;
    const gravity = inWater ? 40 : 260;
    const lift = tribe.speed * (inWater ? 980 : 760);
    const max = 360 * tribe.speed * (inWater ? 0.85 : 1);

    let input = { x: 0, y: 0, breath: false, dash: false, roar: false, claw: false };
    if (d.isPlayer) input = controlVector(d);
    else {
      d.stamina = 100;
      const foe = (d.target && d.target.dead <= 0 && d.aggro > 0) ? d.target : nearestOf(d, players, 520);
      const meal = nearestOf(d, deer, 780);
      if (foe && (d.aggro > 0 || foe.roar > 0 || d.health < d.maxHealth * 0.92)) {
        d.target = foe;
        d.aggro = Math.max(d.aggro, 4);
        const dx = foe.x - d.x;
        const dy = foe.y - d.y;
        const gap = Math.hypot(dx, dy) || 1;
        input.x = dx / gap;
        input.y = dy / gap * 0.85;
        if (gap < 280 && d.breath > 70) input.breath = true;
        if (gap < 90 && d.claw <= 0) input.claw = true;
        if (gap > 200) input.dash = Math.random() < 0.02;
      } else if (meal && nearestOf(d, players, 720)) {
        const dx = meal.x - d.x;
        const dy = meal.y - 40 - d.y;
        const gap = Math.hypot(dx, dy) || 1;
        input.x = dx / gap;
        input.y = dy / gap;
        if (gap < 70) input.claw = true;
      } else {
        d.heading += rand(-0.4, 0.4) * dt;
        input.x = Math.cos(d.heading);
        input.y = Math.sin(d.heading) * 0.35;
        if (d.y > WORLD.ground - 500) input.y = -1;
        if (d.y < 400) input.y = 1;
      }
    }

    if (input.x || input.y) {
      if (d.stamina > 0) {
        d.vx += input.x * lift * dt;
        d.vy += input.y * lift * dt;
        if (d.isPlayer) d.stamina -= dt * (12 / tribe.stamina) * (Math.hypot(input.x, input.y));
        d.flapSpeed = 14;
      } else {
        d.flapSpeed = 4;
        d.vy += input.y * lift * 0.28 * dt;
        d.vx += input.x * lift * 0.35 * dt;
      }
    } else {
      d.stamina = Math.min(100, d.stamina + dt * 22 * tribe.stamina);
      d.flapSpeed = 6 + clamp(Math.hypot(d.vx, d.vy) / 80, 0, 6);
    }

    if (input.dash && d.stamina > 18 && d.dash <= 0) {
      d.vx += (input.x || d.dir) * 420 * tribe.speed;
      d.vy += input.y * 260;
      d.stamina -= 18;
      d.dash = 0.55;
      burst(d.x, d.y, tribe.glow, 10, 180, 0.4);
      tone(140, 0.1, "triangle");
    }

    if (input.breath && d.breath >= 55) {
      d.breath -= 55;
      breathBurst(d);
    }

    if (input.roar && d.roar <= 0) {
      d.roar = 1;
      tone(70, 0.35, "sawtooth");
      showBanner(d.tribe.name + " roar!");
      for (const other of allDragons()) {
        if (other === d) continue;
        if (Math.hypot(d.x - other.x, d.y - other.y) < 360) {
          other.aggro = 6;
          other.target = d;
        }
      }
    }

    if (input.claw && d.claw <= 0) {
      d.claw = 0.48;
      d.slash = 1;
      clawStrike(d);
      tone(160, 0.08, "square");
    }

    d.vy += gravity * dt * (Math.abs(d.vx) > 80 && input.y >= 0 ? 0.42 : 1);
    const speed = Math.hypot(d.vx, d.vy);
    if (speed > max) {
      d.vx *= max / speed;
      d.vy *= max / speed;
    }
    d.vx *= Math.pow(0.985, dt * 60);
    d.vy *= Math.pow(0.992, dt * 60);

    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.x = clamp(d.x, 80, WORLD.w - 80);
    d.y = clamp(d.y, 80, WORLD.ground - 18);

    if (d.y > WORLD.ground - 22) {
      d.y = WORLD.ground - 22;
      d.vy = Math.min(d.vy, 0);
      d.vx *= 0.9;
      if (input.y < 0 && d.stamina > 8) {
        d.vy = -240 * tribe.speed;
        d.stamina -= 8;
      }
    }

    for (const isle of world.islands) {
      if (d.x > isle.x - isle.w / 2 && d.x < isle.x + isle.w / 2 &&
          d.y > isle.y - 20 && d.y < isle.y + 24 && d.vy > 0) {
        d.y = isle.y - 20;
        d.vy = 0;
      }
    }

    if (Math.abs(d.vx) > 12) d.dir = d.vx >= 0 ? 1 : -1;
    d.angle = lerp(d.angle, Math.atan2(d.vy, Math.abs(d.vx) + 40) * 0.55, 0.12);
    d.flap += d.flapSpeed * dt;

    if (d.dash > 0.15) {
      for (const other of allDragons()) {
        if (other === d || other.dead > 0) continue;
        if (Math.hypot(d.x - other.x, d.y - other.y) < 52) {
          hitDragon(other, d, 16, 380);
        }
      }
    }

    if (d.isPlayer) {
      for (const preyDeer of deer) {
        if (preyDeer.taken) continue;
        const close = Math.hypot(d.x - preyDeer.x, d.y - preyDeer.y) < 48;
        const hunting = d.slash > 0 || d.dash > 0 || d.vy > 90 || d.y > WORLD.ground - 90;
        if (close && hunting) huntDeer(d, preyDeer);
      }
    }

    if (d.isPlayer) {
      for (const g of globes) {
        if (!g.taken && Math.hypot(d.x - g.x, d.y - g.y) < 46) {
          g.taken = true;
          collected += 1;
          burst(g.x, g.y, "#f4e19a", 16, 160, 0.7);
          tone(520, 0.12, "sine");
          showBanner("Moon globe " + collected + " / " + GLOBE_COUNT);
          if (collected >= GLOBE_COUNT) winGame();
        }
      }
      for (const p of prey) {
        if (!p.taken && Math.hypot(d.x - p.x, d.y - p.y) < 40) {
          p.taken = true;
          preyTaken += 1;
          d.health = Math.min(d.maxHealth, d.health + 8);
          d.stamina = Math.min(100, d.stamina + 20);
          burst(p.x, p.y, "#f4a261", 12, 140, 0.5);
          tone(340, 0.08, "triangle");
        }
      }
    }
  }

  function updateNpcs(dt) {
    for (const n of npcs) updateDragon(n, dt);
  }

  function updatePrey(dt) {
    for (const p of prey) {
      if (p.taken) continue;
      p.phase += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(p.phase * 3) * 8 * dt * 20;
      if (p.kind === "fish") p.y = Math.max(p.y, WORLD.water - 30);
      if (p.x < 100 || p.x > WORLD.w - 100) p.vx *= -1;
      if (p.y < 200 || p.y > WORLD.ground - 40) p.vy *= -1;
    }
  }

  function updateDeer(dt) {
    const hunters = allDragons().filter((d) => d.dead <= 0);
    for (const preyDeer of deer) {
      if (preyDeer.taken) continue;
      preyDeer.phase += dt;
      let scared = preyDeer.spook > 0;
      for (const h of hunters) {
        const gap = Math.hypot(h.x - preyDeer.x, h.y - preyDeer.y);
        if (gap < 340) {
          scared = true;
          preyDeer.vx = (preyDeer.x < h.x ? -1 : 1) * (180 + Math.abs(h.vx) * 0.2);
        }
      }
      if (scared) {
        preyDeer.spook = 1.6;
        preyDeer.x += preyDeer.vx * dt;
      } else {
        preyDeer.spook = Math.max(0, preyDeer.spook - dt);
        preyDeer.vx = lerp(preyDeer.vx, Math.sin(preyDeer.phase * 0.4) * 22, 0.03);
        preyDeer.x += preyDeer.vx * dt;
      }
      preyDeer.x = clamp(preyDeer.x, 400, WORLD.w - 400);
      if (preyDeer.perch && preyDeer.perch < WORLD.ground - 40) {
        preyDeer.x = clamp(preyDeer.x, 3840, 4380);
      }
      preyDeer.y = preyDeer.perch || WORLD.ground - 14;
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 30 * dt;
      if (p.hurt && p.owner) {
        for (const n of allDragons()) {
          if (n === p.owner || n.dead > 0) continue;
          if (Math.hypot(p.x - n.x, p.y - n.y) < 40) {
            hitDragon(n, p.owner, 11, 140);
            p.hurt = 0;
            break;
          }
        }
        if (p.hurt) {
          for (const preyDeer of deer) {
            if (preyDeer.taken) continue;
            if (Math.hypot(p.x - preyDeer.x, p.y - preyDeer.y) < 28) {
              huntDeer(p.owner, preyDeer);
              p.hurt = 0;
              break;
            }
          }
        }
      }
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateCamera(dt) {
    if (!players.length) {
      camera.x += 40 * dt;
      camera.y = WORLD.h * 0.28;
      camera.zoom = 0.72;
      return;
    }
    let tx = 0;
    let ty = 0;
    for (const p of players) {
      tx += p.x + p.vx * 0.18;
      ty += p.y + p.vy * 0.1;
    }
    tx /= players.length;
    ty /= players.length;
    let zoom = 0.78;
    if (players.length === 2) {
      const gap = dist(players[0], players[1]);
      zoom = clamp(900 / Math.max(500, gap), 0.55, 1);
    }
    camera.zoom = lerp(camera.zoom, zoom, 0.06);
    camera.x = lerp(camera.x, tx, 0.08);
    camera.y = lerp(camera.y, ty, 0.08);
    const viewW = width / camera.zoom;
    const viewH = height / camera.zoom;
    camera.x = clamp(camera.x, viewW / 2, WORLD.w - viewW / 2);
    camera.y = clamp(camera.y, viewH / 2, WORLD.h - viewH / 2);
  }

  function skyColor() {
    const day = 0.5 + 0.5 * Math.sin((timeOfDay - 0.15) * Math.PI * 2);
    const high = clamp(1 - (camera.y / WORLD.h), 0, 1);
    const top = mixRgb([12, 18, 48], [110, 170, 230], day);
    const bot = mixRgb([20, 24, 40], [242, 186, 122], day * 0.85);
    return { top, bot, day, high };
  }

  function mixRgb(a, b, t) {
    t = clamp(t, 0, 1);
    return [
      Math.round(lerp(a[0], b[0], t)),
      Math.round(lerp(a[1], b[1], t)),
      Math.round(lerp(a[2], b[2], t)),
    ];
  }

  function rgb(c, a) {
    return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  function worldToScreen(x, y) {
    return {
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2,
    };
  }

  function drawSky() {
    const s = skyColor();
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, rgb(s.top));
    g.addColorStop(1, rgb(s.bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const sunY = height * (0.75 - s.day * 0.55);
    const sunX = width * 0.78;
    ctx.fillStyle = s.day > 0.35 ? "#ffe08a" : "#f1f5ff";
    ctx.beginPath();
    ctx.arc(sunX, sunY, s.day > 0.35 ? 38 : 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.day > 0.35 ? "rgba(255,176,80,0.18)" : "rgba(180,210,255,0.12)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${Math.round(lerp(40, 90, s.day))}, ${Math.round(lerp(52, 110, s.day))}, ${Math.round(lerp(62, 90, s.day))}, 0.45)`;
    ctx.beginPath();
    ctx.moveTo(0, height);
    const parX = camera.x * 0.12;
    for (let x = 0; x <= width; x += 30) {
      const y = height * 0.58 + Math.sin((x + parX) * 0.007) * 48 + Math.sin((x + parX) * 0.018) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    if (s.day < 0.45) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 80; i++) {
        const sx = (i * 197) % width;
        const sy = (i * 83) % (height * 0.55);
        ctx.globalAlpha = (0.45 - s.day) * ((i % 5) / 5);
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    for (const c of world.clouds) {
      if (c.z < 0.45) drawCloud(c, 0.35);
    }

    ctx.fillStyle = "#2b3a2a";
    ctx.beginPath();
    ctx.moveTo(-200, WORLD.h);
    for (const m of world.mountains) {
      ctx.lineTo(m.x, WORLD.ground);
      ctx.lineTo(m.x + m.w * m.peak, m.y);
      ctx.lineTo(m.x + m.w, WORLD.ground);
    }
    ctx.lineTo(WORLD.w + 200, WORLD.h);
    ctx.closePath();
    ctx.fill();

    for (const m of world.mountains) {
      ctx.fillStyle = m.snow ? "#dce9f5" : `rgba(20,30,28,${0.18 + m.shade})`;
      ctx.beginPath();
      ctx.moveTo(m.x + m.w * m.peak, m.y);
      ctx.lineTo(m.x + m.w * (m.peak + 0.12), m.y + 90);
      ctx.lineTo(m.x + m.w * (m.peak - 0.12), m.y + 90);
      ctx.fill();
    }

    for (const isle of world.islands) {
      ctx.fillStyle = "#3d5a3a";
      ctx.beginPath();
      ctx.ellipse(isle.x, isle.y + 10, isle.w / 2, isle.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b8f4e";
      ctx.beginPath();
      ctx.ellipse(isle.x, isle.y, isle.w / 2.1, isle.h / 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const r of world.ruins) {
      ctx.fillStyle = "#6d6253";
      ctx.fillRect(r.x, r.y - r.h, r.w, r.h);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(r.x + 6, r.y - r.h + 16, 8, 22);
    }

    for (const t of world.trees) {
      const gx = t.x;
      const gy = WORLD.ground;
      if (t.palm) {
        ctx.strokeStyle = "#8a5a2a";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(gx + 18, gy - t.h * 0.5, gx + 8, gy - t.h);
        ctx.stroke();
        ctx.fillStyle = "#2f8f4e";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(gx + 8 + Math.cos(i) * 18, gy - t.h + Math.sin(i) * 8, 16, 5, i, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#4a2e16";
        ctx.fillRect(gx - 4, gy - t.h, 8, t.h);
        ctx.fillStyle = t.jungle ? "#147a3a" : "#2f6b32";
        ctx.beginPath();
        ctx.arc(gx, gy - t.h, t.jungle ? 28 : 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const waterGrad = ctx.createLinearGradient(0, WORLD.water, 0, WORLD.h);
    waterGrad.addColorStop(0, "rgba(40, 110, 150, 0.72)");
    waterGrad.addColorStop(1, "rgba(8, 30, 50, 0.95)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, WORLD.water, 2680, WORLD.h - WORLD.water);
    ctx.fillStyle = "rgba(40, 110, 150, 0.35)";
    ctx.fillRect(2680, WORLD.water + 90, 400, WORLD.h - WORLD.water - 90);

    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(0, WORLD.ground, WORLD.w, 40);
    ctx.fillStyle = "#4d7c3a";
    ctx.fillRect(0, WORLD.ground - 8, WORLD.w, 10);

    for (const c of world.clouds) {
      if (c.z >= 0.45) drawCloud(c, 0.72);
    }

    for (const g of globes) {
      if (g.taken) continue;
      g.phase += 0.03;
      const bob = Math.sin(g.phase) * 8;
      ctx.fillStyle = "rgba(244, 225, 154, 0.18)";
      ctx.beginPath();
      ctx.arc(g.x, g.y + bob, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8e7a2";
      ctx.beginPath();
      ctx.arc(g.x, g.y + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9b7b2c";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const p of prey) {
      if (p.taken) continue;
      ctx.fillStyle = p.kind === "fish" ? "#5ee0a8" : "#f4a261";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const preyDeer of deer) {
      if (preyDeer.taken) continue;
      drawDeer(ctx, preyDeer);
    }

    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const ordered = [...npcs, ...players].sort((a, b) => a.y - b.y);
    const t = performance.now() / 1000;
    for (const d of ordered) {
      if (d.dead > 0) ctx.globalAlpha = 0.4;
      drawDragon(ctx, d, t);
      ctx.globalAlpha = 1;
      drawHealthBar(ctx, d);
    }

    ctx.restore();
  }

  function drawDeer(g, preyDeer) {
    const dir = preyDeer.vx >= 0 ? 1 : -1;
    const run = Math.abs(preyDeer.vx) > 50;
    const gait = Math.sin(preyDeer.phase * (run ? 14 : 4)) * (run ? 5 : 1.5);
    g.save();
    g.translate(preyDeer.x, preyDeer.y);
    g.scale(dir, 1);
    g.fillStyle = "#4a2e16";
    g.fillRect(-9, -2, 3, 13 + gait);
    g.fillRect(3, -2, 3, 13 - gait);
    g.fillRect(-3, -2, 3, 12 - gait * 0.5);
    g.fillRect(8, -2, 3, 12 + gait * 0.5);
    g.fillStyle = preyDeer.buck ? "#6b4423" : "#8b5a2b";
    g.beginPath();
    g.ellipse(0, -8, 15, 7.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c9a36a";
    g.beginPath();
    g.ellipse(2, -6, 8, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = preyDeer.buck ? "#6b4423" : "#8b5a2b";
    g.fillRect(10, -18, 3.5, 12);
    g.beginPath();
    g.ellipse(16, -20, 7, 4.5, -0.25, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1a1208";
    g.beginPath();
    g.arc(19, -21, 1.1, 0, Math.PI * 2);
    g.fill();
    if (preyDeer.buck) {
      g.strokeStyle = "#d9c7a0";
      g.lineWidth = 1.7;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(13, -24);
      g.lineTo(10, -34);
      g.lineTo(6, -31);
      g.moveTo(13, -24);
      g.lineTo(17, -36);
      g.lineTo(21, -32);
      g.stroke();
    }
    g.fillStyle = "#f3e2c0";
    g.fillRect(-16, -11, 5, 4);
    g.restore();
  }

  function drawHealthBar(g, d) {
    if (d.dead > 0 || d.health >= d.maxHealth * 0.97) return;
    const w = 42;
    const x = d.x - w / 2;
    const y = d.y - 62;
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(x, y, w, 5);
    const t = clamp(d.health / d.maxHealth, 0, 1);
    g.fillStyle = t < 0.35 ? "#e85d04" : "#5ee0a8";
    g.fillRect(x, y, w * t, 5);
  }

  function drawCloud(c, alpha) {
    const x = c.x + Math.sin(c.y * 0.001) * 40;
    ctx.globalAlpha = alpha * (0.35 + c.z * 0.4);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.w * 0.5, 28 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - c.w * 0.22, c.y + 8, c.w * 0.28, 20 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + c.w * 0.24, c.y + 6, c.w * 0.26, 18 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMinimap() {
    if (state !== "play") return;
    const mw = 180;
    const mh = 64;
    const x = 22;
    const y = height - 22 - mh;
    ctx.fillStyle = "rgba(8,14,20,0.65)";
    ctx.strokeStyle = "rgba(215,176,86,0.45)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, mw, mh);
    ctx.strokeRect(x, y, mw, mh);
    for (const g of globes) {
      if (g.taken) continue;
      ctx.fillStyle = "#f4e19a";
      ctx.fillRect(x + (g.x / WORLD.w) * mw, y + (g.y / WORLD.h) * mh, 2, 2);
    }
    for (const preyDeer of deer) {
      if (preyDeer.taken) continue;
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(x + (preyDeer.x / WORLD.w) * mw, y + (preyDeer.y / WORLD.h) * mh, 2, 2);
    }
    for (const n of npcs) {
      ctx.fillStyle = "rgba(220,80,80,0.7)";
      ctx.fillRect(x + (n.x / WORLD.w) * mw, y + (n.y / WORLD.h) * mh, 2, 2);
    }
    for (const p of players) {
      ctx.fillStyle = p.tribe.glow;
      ctx.beginPath();
      ctx.arc(x + (p.x / WORLD.w) * mw, y + (p.y / WORLD.h) * mh, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function showBanner(text) {
    bannerText = text;
    bannerTimer = 2.4;
    document.getElementById("banner").textContent = text;
  }

  function syncHud() {
    const p = players[0];
    if (!p) return;
    document.getElementById("hud-p1-name").textContent = p.tribe.name;
    document.getElementById("hp-bar").style.width = (100 * p.health / p.maxHealth) + "%";
    document.getElementById("stamina-bar").style.width = clamp(p.stamina, 0, 100) + "%";
    document.getElementById("breath-bar").style.width = clamp(p.breath, 0, 100) + "%";
    document.getElementById("score").textContent = String(collected);
    document.getElementById("score-max").textContent = String(GLOBE_COUNT);
    document.getElementById("deer-count").textContent = String(deerTaken);
    document.getElementById("kills").textContent = String(downs);
    const p2 = players[1];
    const pill = document.getElementById("p2-pill");
    if (p2) {
      pill.hidden = false;
      document.getElementById("hp2").textContent = String(Math.round(p2.health));
    } else pill.hidden = true;
  }

  function startGame(coop) {
    ensureAudio();
    if (audio && audio.state === "suspended") audio.resume();
    const tribe = TRIBES[selectedTribe];
    players = [
      makeDragon(tribe, 4200, 3180, true, coop ? {
        up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD",
        breath: "Space", dash: "ShiftLeft", roar: "KeyQ", claw: "KeyF",
      } : null),
    ];
    if (coop) {
      const other = TRIBES[(selectedTribe + 1) % TRIBES.length];
      players.push(makeDragon(other, 4680, 3220, true, {
        up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight",
        breath: "Enter", dash: "ShiftRight", roar: "Slash", claw: "KeyK",
      }));
    }
    spawnCollectibles();
    for (let i = 0; i < 6; i++) {
      globes[i].x = 4050 + i * 160;
      globes[i].y = 3050 + Math.sin(i * 1.2) * 140;
      globes[i].taken = false;
    }
    spawnNpcs();
    for (let i = 0; i < 2; i++) {
      npcs[i].x = 3600 + i * 900;
      npcs[i].y = 3000;
      npcs[i].vx = 80;
      npcs[i].aggro = 2;
    }
    collected = 0;
    preyTaken = 0;
    deerTaken = 0;
    downs = 0;
    camera.x = players[0].x;
    camera.y = players[0].y;
    camera.zoom = 0.78;
    state = "play";
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("pause").classList.add("hidden");
    document.getElementById("win").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    document.getElementById("hud-mode").textContent = coop ? "Two dragons" : "Solo";
    document.getElementById("deer-count").textContent = "0";
    document.getElementById("kills").textContent = "0";
    showBanner("Hunt the deer below. Rival dragons will fight.");
  }

  function pauseGame() {
    if (state !== "play") return;
    state = "pause";
    document.getElementById("pause").classList.remove("hidden");
  }

  function resumeGame() {
    state = "play";
    document.getElementById("pause").classList.add("hidden");
  }

  function backToMenu() {
    state = "menu";
    players = [];
    document.getElementById("hud").classList.add("hidden");
    document.getElementById("pause").classList.add("hidden");
    document.getElementById("win").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
  }

  function winGame() {
    state = "win";
    document.getElementById("win").classList.remove("hidden");
    document.getElementById("win-copy").textContent =
      "Your " + players[0].tribe.name + " winglet gathered every moon globe.";
    tone(660, 0.2, "sine");
  }

  function buildTribeUi() {
    const root = document.getElementById("tribes");
    root.innerHTML = "";
    TRIBES.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.className = "tribe-btn" + (i === selectedTribe ? " selected" : "");
      btn.setAttribute("role", "option");
      btn.innerHTML = `<div class="swatch" style="background:linear-gradient(90deg,${t.body},${t.wing},${t.belly})"></div>${t.name}`;
      btn.addEventListener("click", () => {
        selectedTribe = i;
        [...root.children].forEach((c, idx) => c.classList.toggle("selected", idx === i));
        refreshTribeCopy();
      });
      root.appendChild(btn);
    });
    refreshTribeCopy();
  }

  function refreshTribeCopy() {
    const t = TRIBES[selectedTribe];
    document.getElementById("tribe-name").textContent = t.name;
    document.getElementById("tribe-epithet").textContent = t.epithet;
    document.getElementById("tribe-desc").textContent = t.desc;
    document.getElementById("tribe-stats").innerHTML =
      `<li>Speed <b>${t.speed.toFixed(2)}</b></li>` +
      `<li>Stamina <b>${t.stamina.toFixed(2)}</b></li>` +
      `<li>Health <b>${t.health}</b></li>` +
      `<li>Breath <b>${t.breath}</b></li>`;
  }

  function drawPreview(dt) {
    previewPhase += dt;
    pctx.clearRect(0, 0, preview.width, preview.height);
    const grd = pctx.createLinearGradient(0, 0, 0, preview.height);
    grd.addColorStop(0, "#1c334c");
    grd.addColorStop(1, "#0c1824");
    pctx.fillStyle = grd;
    pctx.fillRect(0, 0, preview.width, preview.height);
    const d = makeDragon(TRIBES[selectedTribe], 188, 124, true);
    d.flap = previewPhase * 10;
    d.scale = 1.15;
    d.vx = 0;
    d.vy = 0;
    d.angle = Math.sin(previewPhase) * 0.12;
    drawDragon(pctx, d, previewPhase);
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    timeOfDay = (timeOfDay + dt / 180) % 1;
    bannerTimer = Math.max(0, bannerTimer - dt);
    if (bannerTimer === 0) document.getElementById("banner").textContent = "";

    if (state === "menu") {
      camera.x = 2800 + Math.sin(ts * 0.00007) * 1800;
      camera.y = 1600;
      camera.zoom = 0.7;
      if (npcs.length === 0) spawnNpcs();
      updateNpcs(dt);
      updatePrey(dt);
      updateDeer(dt);
      updateParticles(dt);
      drawPreview(dt);
    } else if (state === "play") {
      for (const p of players) updateDragon(p, dt);
      updateNpcs(dt);
      updatePrey(dt);
      updateDeer(dt);
      updateParticles(dt);
      updateCamera(dt);
      syncHud();
    } else {
      updateParticles(dt);
    }

    for (const c of world.clouds) {
      c.x += (12 + c.z * 28) * dt;
      if (c.x > WORLD.w + 200) c.x = -200;
    }

    drawSky();
    drawWorld();
    drawMinimap();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === "Escape" || e.key === "Escape") {
      if (state === "play") pauseGame();
      else if (state === "pause") resumeGame();
    }
    if (state === "menu") {
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        selectedTribe = (selectedTribe + 1) % TRIBES.length;
        buildTribeUi();
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        selectedTribe = (selectedTribe + TRIBES.length - 1) % TRIBES.length;
        buildTribeUi();
      }
      if (e.code === "Enter") startGame(false);
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.getElementById("btn-solo").addEventListener("click", () => startGame(false));
  document.getElementById("btn-coop").addEventListener("click", () => startGame(true));
  document.getElementById("btn-resume").addEventListener("click", resumeGame);
  document.getElementById("btn-menu").addEventListener("click", backToMenu);
  document.getElementById("btn-again").addEventListener("click", () => startGame(players.length > 1));
  document.getElementById("btn-win-menu").addEventListener("click", backToMenu);

  resize();
  generateWorld();
  spawnCollectibles();
  spawnNpcs();
  buildTribeUi();
  camera.x = 3000;
  camera.y = 1700;
  requestAnimationFrame(loop);
})();
