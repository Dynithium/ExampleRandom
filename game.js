const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// GBA-style crisp pixels (no smoothing, integer coords only)
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 32; // 16px GBA tile at 2x (canvas is 2x GBA 240x160)
let MAP_WIDTH = 25;
let MAP_HEIGHT = 20;

// ------------------------------------------------------------------
// Enriched GBA / Pokémon FireRed palette (limited, warm, soft)
// ------------------------------------------------------------------
const P = {
    // Outdoors
    grass:      '#55a330',
    grassDark:  '#4d9628',
    grassLight: '#6bc43c',
    grassDeep:  '#1b4a10',
    path:       '#e0cb80',
    pathDark:   '#cca358',
    pathLight:  '#ebd898',
    pathEdge:   '#a08340',
    water:      '#3ca0e0',
    waterDark:  '#2074b0',
    waterDeep:  '#144a78',
    waterLight: '#7cd3fc',
    waterFoam:  '#f0f9ff',
    // Trees
    leaf:       '#30781c',
    leafDark:   '#182c10',
    leafLight:  '#50a82c',
    leafSunny:  '#84d440',
    trunk:      '#784c24',
    trunkDark:  '#382008',
    trunkLight: '#986838',
    trunkShadow:'#1e400c',
    // Buildings
    roofRed:    '#cc3328',
    roofRedD:   '#8c1a14',
    roofRedL:   '#eb6c5a',
    roofBlue:   '#284c8c',
    roofBlueD:  '#1a3066',
    roofBlueL:  '#5a8fe0',
    roofGreen:  '#346a2a',
    roofGreenD: '#1c4415',
    wallBlue:   '#ebe6db', // Tudor walls
    wallBlueD:  '#b0a699',
    wallBlueL:  '#ffffff',
    wallRed:    '#f4ebd0', // Red house walls
    wallRedD:   '#cca880',
    wallRedL:   '#ffffff',
    wallTan:    '#bc804c', // Homestead logs
    wallTanD:   '#7d4a22',
    wallTanL:   '#d9a066',
    found:      '#70685c',
    foundD:     '#48433d',
    window:     '#ffd830',
    windowBlue: '#4890c8',
    door:       '#683c18',
    doorL:      '#a06028',
    // Interiors
    floor:      '#cb9358',
    floorD:     '#8b5624',
    floorL:     '#dfae7c',
    wallIn:     '#eddcb8',
    wallInD:    '#7a471c',
    wallInL:    '#f7f0df',
    // Furniture / props
    wood:       '#804d20',
    woodD:      '#543014',
    woodL:      '#ac7038',
    bed:        '#cc3333',
    bedL:       '#eb6c5a',
    pillow:     '#fafaf6',
    metal:      '#808890',
    metalD:     '#404850',
    metalL:     '#c8cacd',
    fire:       '#ffd830',
    fireL:      '#f07010',
    crop:       '#38a020',
    cropD:      '#205010',
    dirt:       '#8a5830',
    dirtD:      '#583018',
    // Characters
    outline:    '#181410',
    skin:       '#f6be94',
    skinD:      '#d69772',
    hair:       '#543b24',
    hairD:      '#382414',
    hairL:      '#8a6245',
    hairGray:   '#dcdce0',
    red:        '#cc3333',
    redD:       '#901a18',
    redL:       '#eb5a5a',
    suit:       '#3a3d45',
    suitL:      '#606870',
    glow:       '#00b8e8',
    glowL:      '#eefdff',
    pants:      '#303038',
    pantsD:     '#202028',
    boot:       '#483320',
    bootL:      '#6c4e30',
    gold:       '#f8b820',
    // UI (Pokémon-style dialog)
    uiWhite:    '#ffffff',
    uiCream:    '#f8f8f0',
    uiBlue:     '#607888',
    uiBlueD:    '#283848',
    uiBlack:    '#101820',
    uiText:     '#18181c',
    uiName:     '#305888',
    uiHint:     '#5e81ac',
    shadow:     'rgba(0, 25, 0, 0.28)'
};

/** Fill a solid pixel rect (integer coords only). */
function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/** Classic GBA oval shadow made of stacked rects (no ellipse). */
function pixelShadow(cx, cy) {
    px(cx - 8, cy, 16, 2, P.shadow);
    px(cx - 6, cy + 2, 12, 1, P.shadow);
    px(cx - 4, cy - 1, 8, 1, P.shadow);
}

/** Deterministic 0..n-1 hash from tile coords. */
function tileVar(tx, ty, n) {
    return Math.abs((tx * 17 + ty * 31 + tx * ty * 7) | 0) % n;
}

// Tile types: 0=Grass, 1=Tree, 2=Path, 3=Council (Blue House), 4=Home (Red House),
// 5=Water, 6=Wood Floor, 7=Wall, 8=Bed, 9=Sword Case, 10=Crops, 11=Well,
// 12=Forge, 13=Market Stall, 14=Watchtower, 15=Village Door, 16=Exit Mat,
// 17=Table, 18=Chair, 19=Bookshelf, 20=Homestead
const VILLAGE_W = 48;
const VILLAGE_H = 30;

function buildVillageMap() {
    const m = [];
    for (let y = 0; y < VILLAGE_H; y++) {
        m.push(new Array(VILLAGE_W).fill(0));
    }
    // Border trees
    for (let x = 0; x < VILLAGE_W; x++) { m[0][x] = 1; m[VILLAGE_H - 1][x] = 1; }
    for (let y = 0; y < VILLAGE_H; y++) { m[y][0] = 1; m[y][VILLAGE_W - 1] = 1; }

    function rect(tile, x1, y1, w, h) {
        for (let y = y1; y < y1 + h; y++) {
            for (let x = x1; x < x1 + w; x++) m[y][x] = tile;
        }
    }

    // Buildings are 5x5 tiles on the outside; interiors are 15x10 (bigger inside)
    rect(3, 6, 3, 5, 5);    // Council of Elders (Blue House)
    rect(4, 28, 3, 5, 5);   // Minslaire's home (Red House)
    rect(20, 6, 16, 5, 5);  // Farmer's Homestead
    rect(20, 28, 16, 5, 5); // Weaver's Homestead

    // Building doors (bottom center of each footprint)
    m[7][8] = 15;
    m[7][30] = 15;
    m[20][8] = 15;
    m[20][30] = 15;

    // The Forge & workshops (artisan district)
    rect(12, 22, 4, 3, 2);

    // Grand Gardens (greenhouse terraces)
    rect(10, 22, 18, 5, 6);

    // Central Well (agricultural outskirts)
    m[16][24] = 11;

    // Southern Marketplace & Bazaar
    rect(13, 22, 26, 5, 2);

    // Pond
    rect(5, 40, 26, 3, 3);

    // Eastern forest with a gate gap
    for (let y = 2; y < VILLAGE_H - 1; y++) {
        for (let x = 44; x <= 46; x++) {
            m[y][x] = (y >= 8 && y <= 9) ? 2 : 1;
        }
    }

    // Watchtower guarding the Eastern Gate
    m[6][44] = 14;

    // Roads
    for (let x = 2; x <= 44; x++) { m[13][x] = 2; m[25][x] = 2; }
    for (let y = 1; y <= 28; y++) { m[y][2] = 2; }
    for (let y = 3; y <= 25; y++) { m[y][18] = 2; }
    for (let y = 4; y <= 23; y++) { m[y][21] = 2; }
    for (let y = 8; y <= 13; y++) { m[y][44] = 2; }

    // Scattered trees
    m[2][21] = 1;
    m[26][4] = 1;
    m[26][15] = 1;
    m[28][20] = 1;

    return m;
}

const villageMap = buildVillageMap();
let map = villageMap;

// Interior maps (all 15x10, matching their exterior footprints)
const homeMap = [
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,8,6,8,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7]
];

const councilMap = [
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,19,19,19,19,19,19,19,19,19,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,18,6,6,6,6,6,6,6,6,6,18,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,6,17,17,17,17,17,17,17,17,17,6,6,7],
    [7,6,18,6,6,6,6,6,6,6,6,6,18,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7]
];

const homesteadAMap = [
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,8,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,18,17,17,18,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7]
];

const homesteadBMap = [
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,8,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,18,17,17,18,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,19,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,16,7,7,7,7,7,7,7]
];

const interiors = {
    home:       { name: 'Your Home',          map: homeMap,       outside: [30, 8] },
    council:    { name: 'Council Hall',       map: councilMap,    outside: [8, 8] },
    homesteadA: { name: "Farmer's Homestead", map: homesteadAMap, outside: [8, 21] },
    homesteadB: { name: "Weaver's Homestead", map: homesteadBMap, outside: [30, 21] }
};

const villageDoors = [
    { tx: 8,  ty: 7,  interior: 'council' },
    { tx: 30, ty: 7,  interior: 'home' },
    { tx: 8,  ty: 20, interior: 'homesteadA' },
    { tx: 30, ty: 20, interior: 'homesteadB' }
];

// Current area: 'village' or 'interior'
let currentArea = 'village';
let currentInterior = null;
const locationNameEl = document.getElementById('location-name');

function placePlayer(tileX, tileY, facing) {
    player.tileX = tileX;
    player.tileY = tileY;
    player.x = tileX * TILE_SIZE;
    player.y = tileY * TILE_SIZE;
    player.targetX = player.x;
    player.targetY = player.y;
    player.isMoving = false;
    player.facing = facing;
}

function updateHUD() {
    if (locationNameEl) {
        locationNameEl.textContent = currentArea === 'village' ? 'Elderville Village' : interiors[currentInterior].name;
    }
    const hpEl = document.getElementById('hp');
    const stEl = document.getElementById('st');
    if (hpEl) hpEl.textContent = Math.floor(player.hp);
    if (stEl) stEl.textContent = Math.floor(player.st);
    
    const hpFill = document.getElementById('hp-fill');
    const stFill = document.getElementById('st-fill');
    if (hpFill) hpFill.style.width = `${Math.floor(player.hp)}%`;
    if (stFill) stFill.style.width = `${Math.floor(player.st)}%`;
}

function enterInterior(key) {
    const interior = interiors[key];
    currentInterior = key;
    currentArea = 'interior';
    map = interior.map;
    MAP_WIDTH = interior.map[0].length;
    MAP_HEIGHT = interior.map.length;
    placePlayer(7, 8, 'down');
    updateCamera();
    updateHUD();
}

function exitInterior() {
    const interior = interiors[currentInterior];
    currentArea = 'village';
    map = villageMap;
    MAP_WIDTH = VILLAGE_W;
    MAP_HEIGHT = VILLAGE_H;
    placePlayer(interior.outside[0], interior.outside[1], 'down');
    updateCamera();
    updateHUD();
}

function villageDoorAt(tx, ty) {
    for (const d of villageDoors) {
        if (d.tx === tx && d.ty === ty) return d.interior;
    }
    return null;
}

function checkAreaTransitions() {
    const t = map[player.tileY] && map[player.tileY][player.tileX];
    if (currentArea === 'village' && t === 15) {
        const key = villageDoorAt(player.tileX, player.tileY);
        if (key) enterInterior(key);
    } else if (currentArea === 'interior' && t === 16) {
        exitInterior();
    }
}

function nearSwordCase() {
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
        for (let tx = 0; tx < MAP_WIDTH; tx++) {
            if (map[ty][tx] !== 9) continue;
            if (Math.abs(player.tileX - tx) + Math.abs(player.tileY - ty) <= 1) return true;
        }
    }
    return false;
}

// Player state
const player = {
    tileX: 12,
    tileY: 6,
    x: 12 * TILE_SIZE,
    y: 6 * TILE_SIZE,
    targetX: 12 * TILE_SIZE,
    targetY: 6 * TILE_SIZE,
    facing: 'down',
    isMoving: false,
    speed: 4,
    isSprinting: false,
    hp: 100,
    st: 100,
    animFrame: 0
};

// Camera offset in tiles
const camera = {
    x: 0,
    y: 0,
    width: canvas.width / TILE_SIZE,
    height: canvas.height / TILE_SIZE
};

// NPC data
const npcs = [
    {
        id: 'tinslaire',
        name: 'Tinslaire',
        tileX: 30,
        tileY: 9,
        color: '#2c60c0', // Cobalt robe
        dialog: [
            "Brother! You're finally awake.",
            "The Elders are waiting for you at the Council Hall.",
            "They speak of an ancient artifact... the Elemental Box.",
            "Please, be careful out there."
        ],
        repeatDialog: [
            "Speak with the Elders when you're ready."
        ],
        spoken: false
    },
    {
        id: 'elder1',
        name: 'Elder Marcus',
        tileX: 8,
        tileY: 9,
        color: '#8b5b2c', // Brown robe
        dialog: [
            "Ah, Minslaire. The chosen one.",
            "Long ago, our ancestors sealed away great power in the Elemental Box.",
            "The time has come to retrieve it.",
            "Follow the path north. The box awaits."
        ],
        repeatDialog: [
            "The Elemental Box awaits. Follow the path north."
        ],
        spoken: false
    },
    {
        id: 'elder2',
        name: 'Elder Sarah',
        tileX: 23,
        tileY: 14,
        color: '#5a2b85', // Royal purple robe
        dialog: [
            "The Scrap Bots have been restless lately...",
            "Something stirs in the old ruins.",
            "Trust in your blade, young one.",
            "And trust in us."
        ],
        repeatDialog: [
            "Trust in your blade, young one."
        ],
        spoken: false
    }
];

let currentDialog = null;
let dialogIndex = 0;
let canInteract = true;

function updateCamera() {
    camera.x = Math.max(0, Math.min(MAP_WIDTH - camera.width, player.tileX - Math.floor(camera.width / 2)));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - camera.height, player.tileY - Math.floor(camera.height / 2)));
    
    // CRITICAL FIX: Snap camera to integer values to prevent sub-pixel rendering glitches
    camera.x = Math.floor(camera.x);
    camera.y = Math.floor(camera.y);
}

function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return true;
    const t = map[tileY][tileX];
    return t === 1 || t === 3 || t === 4 || t === 5 || t === 7 || t === 8 || t === 9 || t === 20;
}

// NPCs block movement in the village (they are solid obstacles)
function npcOccupied(tileX, tileY) {
    if (currentArea !== 'village') return false;
    for (const npc of npcs) {
        if (npc.tileX === tileX && npc.tileY === tileY) return true;
    }
    return false;
}

function getNearbyNPC() {
    for (const npc of npcs) {
        const dx = Math.abs(player.tileX - npc.tileX);
        const dy = Math.abs(player.tileY - npc.tileY);
        if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
            return npc;
        }
    }
    return null;
}

// Input state
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;
    
    // Handle interaction
    if ((e.key.toLowerCase() === 'e' || e.key === ' ') && canInteract && !player.isMoving) {
        if (currentDialog) {
            // Advance dialog
            dialogIndex++;
            if (dialogIndex >= currentDialog.dialog.length) {
                currentDialog.source.spoken = true;
                currentDialog = null;
                dialogIndex = 0;
            }
        } else if (currentArea === 'interior' && nearSwordCase()) {
            currentDialog = {
                source: { spoken: true },
                name: 'Sword Case',
                dialog: [
                    "Your father's blade...",
                    "Encased in glass the day he and mother vanished.",
                    "It waits for its master."
                ]
            };
            dialogIndex = 0;
        } else if (currentArea === 'village') {
            const npc = getNearbyNPC();
            if (npc) {
                currentDialog = {
                    source: npc,
                    name: npc.name,
                    dialog: npc.spoken ? (npc.repeatDialog || ['...']) : npc.dialog
                };
                dialogIndex = 0;
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

function handleInput() {
    if (player.isMoving || currentDialog) return;

    let dx = 0;
    let dy = 0;

    if (keys['arrowup'] || keys['w']) {
        dy = -1;
        player.facing = 'up';
    } else if (keys['arrowdown'] || keys['s']) {
        dy = 1;
        player.facing = 'down';
    } else if (keys['arrowleft'] || keys['a']) {
        dx = -1;
        player.facing = 'left';
    } else if (keys['arrowright'] || keys['d']) {
        dx = 1;
        player.facing = 'right';
    }

    if (dx !== 0 || dy !== 0) {
        const nextTileX = player.tileX + dx;
        const nextTileY = player.tileY + dy;

        if (!isSolid(nextTileX, nextTileY) && !npcOccupied(nextTileX, nextTileY)) {
            player.tileX = nextTileX;
            player.tileY = nextTileY;
            player.targetX = player.tileX * TILE_SIZE;
            player.targetY = player.tileY * TILE_SIZE;
            player.isMoving = true;
            
            // Lock in speed and sprinting state at the start of tile step
            const wantsSprint = (keys['shift'] || keys['Shift']) && player.st > 10;
            player.speed = wantsSprint ? 8 : 4;
            player.isSprinting = wantsSprint;
        }
    }
}

function updatePlayer() {
    if (!player.isMoving) {
        player.st = Math.min(100, player.st + 0.4); // Recover stamina when idle
        player.isSprinting = false;
        return;
    }

    const currentSpeed = player.speed || 4;

    if (player.x < player.targetX) player.x += currentSpeed;
    else if (player.x > player.targetX) player.x -= currentSpeed;

    if (player.y < player.targetY) player.y += currentSpeed;
    else if (player.y > player.targetY) player.y -= currentSpeed;

    // Deplete or recover stamina during step
    if (player.isSprinting) {
        player.st = Math.max(0, player.st - 0.5);
    } else {
        player.st = Math.min(100, player.st + 0.1);
    }

    if (player.x === player.targetX && player.y === player.targetY) {
        player.isMoving = false;
        updateCamera();
    }
}

// ------------------------------------------------------------------
// High-Fidelity Tile Drawing — 16x16 GBA Pokémon-style procedurals
// ------------------------------------------------------------------

function drawGrassBase(sx, sy, mapX, mapY) {
    // 1. Draw solid lush green base
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.grass);
    
    // 2. Subtle checkerboard GBA-style dither
    for (let dy = 0; dy < TILE_SIZE; dy += 4) {
        for (let dx = 0; dx < TILE_SIZE; dx += 4) {
            if (((dx + dy) / 4) % 2 === 0) {
                px(sx + dx, sy + dy, 4, 4, P.grassDark);
            }
        }
    }

    // 3. Draw beautiful grass details & wildflowers based on tile variance hash
    const v = tileVar(mapX, mapY, 8);
    
    // Draw 1 or 2 small grass blades/clumps
    const ox1 = (v * 5) % 18 + 4;
    const oy1 = (v * 7) % 18 + 4;
    
    // Grass clump 1
    px(sx + ox1, sy + oy1, 2, 4, P.grassDeep);
    px(sx + ox1 + 2, sy + oy1 - 2, 2, 6, P.grassDeep);
    px(sx + ox1 + 4, sy + oy1, 2, 4, P.grassDeep);
    px(sx + ox1 + 2, sy + oy1 - 2, 2, 2, P.grassLight); // tip highlight
    
    // Grass clump 2 (for variety)
    if (v > 3) {
        const ox2 = (ox1 + 12) % 24 + 4;
        const oy2 = (oy1 + 10) % 24 + 4;
        px(sx + ox2, sy + oy2, 2, 4, P.grassDeep);
        px(sx + ox2 - 2, sy + oy2 - 1, 2, 5, P.grassDeep);
        px(sx + ox2 - 2, sy + oy2 - 1, 2, 1, P.grassLight);
    }

    // Beautiful occasional wildflowers (Red Tulip, Yellow Daisy, Bluebell)
    if (v === 1) {
        // Red tulip
        const fx = sx + 14;
        const fy = sy + 14;
        px(fx, fy, 4, 4, P.red);
        px(fx + 1, fy - 2, 2, 2, P.redL);
        px(fx + 1, fy + 1, 2, 2, P.gold);
        px(fx + 1, fy + 4, 2, 2, P.grassDeep); // stem
    } else if (v === 4) {
        // Yellow daisy
        const fx = sx + 22;
        const fy = sy + 8;
        px(fx, fy, 4, 4, P.gold);
        px(fx + 1, fy + 1, 2, 2, P.uiWhite);
    } else if (v === 6) {
        // Bluebell
        const fx = sx + 6;
        const fy = sy + 22;
        px(fx, fy, 4, 4, P.glow);
        px(fx + 1, fy - 1, 2, 2, P.glowL);
        px(fx + 1, fy + 3, 2, 2, P.grassDeep);
    }
}

function drawTree(sx, sy, mapX, mapY) {
    // Underneath the tree canopy, draw the grass so we don't have visual seams
    drawGrassBase(sx, sy, mapX, mapY);
    
    // 1. Draw a beautiful dark green ground shadow
    px(sx + 4, sy + 26, 24, 4, P.trunkShadow);
    px(sx + 8, sy + 28, 16, 2, P.trunkShadow);

    // 2. Draw trunk
    px(sx + 12, sy + 18, 8, 11, P.trunkDark);
    px(sx + 14, sy + 18, 4, 11, P.trunk);
    px(sx + 14, sy + 20, 2, 6, P.trunkLight);
    
    // 3. Overlapping scalloped leaf canopy (pure pixel curves)
    // Dark canopy outline first
    const drawLeafPixel = (x, y, color) => px(sx + x * 2, sy + y * 2, 2, 2, color);

    // Outer leaf bounds (using 16x16 coordinate map)
    const bounds = [
        { y: 1,  xMin: 6, xMax: 9 },
        { y: 2,  xMin: 4, xMax: 11 },
        { y: 3,  xMin: 3, xMax: 12 },
        { y: 4,  xMin: 2, xMax: 13 },
        { y: 5,  xMin: 2, xMax: 13 },
        { y: 6,  xMin: 1, xMax: 14 },
        { y: 7,  xMin: 1, xMax: 14 },
        { y: 8,  xMin: 1, xMax: 14 },
        { y: 9,  xMin: 2, xMax: 13 },
        { y: 10, xMin: 3, xMax: 12 },
        { y: 11, xMin: 4, xMax: 11 }
    ];

    for (const b of bounds) {
        // Outline ends
        drawLeafPixel(b.xMin, b.y, P.leafDark);
        drawLeafPixel(b.xMax, b.y, P.leafDark);
        
        for (let x = b.xMin + 1; x < b.xMax; x++) {
            // Shadowing on bottom right, light on top left
            if (b.y > 7 || x > 10) {
                drawLeafPixel(x, b.y, P.leafDark);
            } else if (b.y > 5 || x > 7) {
                drawLeafPixel(x, b.y, P.leaf);
            } else if (b.y < 3 || x < 5) {
                drawLeafPixel(x, b.y, P.leafSunny);
            } else {
                drawLeafPixel(x, b.y, P.leafLight);
            }
        }
    }

    // Scalloped internal detail lines & sun highlights (bubble volume)
    // Left cluster highlight
    drawLeafPixel(5, 3, P.leafSunny);
    drawLeafPixel(4, 4, P.leafSunny);
    drawLeafPixel(5, 4, P.leafSunny);
    drawLeafPixel(4, 5, P.leafSunny);
    // Top peak highlight
    drawLeafPixel(7, 2, P.leafSunny);
    drawLeafPixel(8, 2, P.leafSunny);
    // Right shading creases
    drawLeafPixel(10, 5, P.leafDark);
    drawLeafPixel(11, 6, P.leafDark);
    drawLeafPixel(9, 8, P.leafDark);
    drawLeafPixel(10, 8, P.leafDark);
}

function drawPath(sx, sy, mapX, mapY) {
    // Warm, golden sandy dirt path
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.path);
    
    // Subtle sand grain pattern
    for (let dy = 0; dy < TILE_SIZE; dy += 4) {
        for (let dx = 0; dx < TILE_SIZE; dx += 4) {
            const v = tileVar(mapX + dx, mapY + dy, 4);
            if (v === 0) {
                px(sx + dx, sy + dy, 4, 4, P.pathLight);
            } else if (v === 2) {
                px(sx + dx, sy + dy, 4, 4, P.pathDark);
            }
        }
    }

    // Wavy gravel edge scuffs
    px(sx, sy, TILE_SIZE, 2, P.pathEdge);
    px(sx, sy + 30, TILE_SIZE, 2, P.pathEdge);

    // Decorative pebbles based on tile hash
    const v = tileVar(mapX, mapY, 5);
    if (v === 1) {
        // Double pebble
        px(sx + 10, sy + 12, 4, 4, P.metalD);
        px(sx + 10, sy + 12, 2, 2, P.metal);
        px(sx + 14, sy + 14, 2, 2, P.metalL);
    } else if (v === 3) {
        // Embedded flat stone
        px(sx + 20, sy + 22, 6, 4, P.foundD);
        px(sx + 22, sy + 22, 4, 2, P.found);
    }
}

function drawWater(sx, sy, mapX, mapY) {
    // Base blue depth
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.water);
    
    // Smooth horizontal water depth bands
    px(sx, sy + 16, TILE_SIZE, 16, P.waterDark);
    px(sx, sy + 26, TILE_SIZE, 6, P.waterDeep);

    // Animated shimmering currents
    const frame = Math.floor(Date.now() / 250) % 4;
    const shift = frame * 4; // Shift pixels horizontally
    
    // Light sparkling wave stripes
    const wy1 = ((mapY * TILE_SIZE + shift) % 12) + 4;
    const wx1 = ((mapX * TILE_SIZE + shift * 2) % 24) + 2;
    px(sx + wx1, sy + wy1, 10, 2, P.waterLight);
    px(sx + wx1 + 2, sy + wy1, 6, 1, P.waterFoam);

    const wy2 = ((mapY * TILE_SIZE - shift + 18) % 16) + 12;
    const wx2 = ((mapX * TILE_SIZE - shift) % 20) + 10;
    px(sx + wx2, sy + wy2, 8, 2, P.waterLight);
    
    // Deep currents
    const dwy = ((mapY * TILE_SIZE + shift) % 14) + 20;
    px(sx + 4, sy + dwy, 14, 1, P.waterDeep);
}

function drawCrops(sx, sy) {
    // Base cultivated dirt
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.dirt);
    // Dark irrigation trenches
    px(sx, sy + 8, TILE_SIZE, 4, P.dirtD);
    px(sx, sy + 20, TILE_SIZE, 4, P.dirtD);

    // Lush plant rows (Berry bushes with red fruit!)
    for (let i = 0; i < 3; i++) {
        const cx = sx + 4 + i * 10;
        
        // Bottom plant bush
        px(cx, sy + 14, 6, 8, P.cropD);
        px(cx + 1, sy + 12, 4, 8, P.crop);
        px(cx + 2, sy + 12, 2, 4, P.grassLight);
        // Little berries!
        px(cx + 1, sy + 16, 2, 2, P.red);
        px(cx + 4, sy + 14, 2, 2, P.red);

        // Top plant bush
        px(cx, sy + 2, 6, 6, P.cropD);
        px(cx + 1, sy + 1, 4, 6, P.crop);
        px(cx + 2, sy + 1, 2, 2, P.grassLight);
        px(cx + 3, sy + 4, 2, 2, P.red);
    }
}

function drawWell(sx, sy, mapX, mapY) {
    // Behind well
    drawGrassBase(sx, sy, mapX, mapY);
    
    // Stone brick circular rim
    px(sx + 4, sy + 14, 24, 14, P.metalD);
    px(sx + 6, sy + 16, 20, 10, P.metal);
    px(sx + 6, sy + 16, 20, 2, P.metalL); // Rim highlight
    
    // Bricks seams
    for (let i = sx + 10; i < sx + 28; i += 6) {
        px(i, sy + 18, 2, 8, P.metalD);
    }

    // Deep water hole
    px(sx + 10, sy + 18, 12, 6, P.outline);
    px(sx + 12, sy + 19, 8, 4, P.waterDeep);
    px(sx + 14, sy + 20, 4, 2, P.water);

    // Wooden pillars holding the roof
    px(sx + 6, sy + 4, 4, 12, P.woodD);
    px(sx + 7, sy + 4, 2, 12, P.wood);
    px(sx + 22, sy + 4, 4, 12, P.woodD);
    px(sx + 23, sy + 4, 2, 12, P.wood);

    // Red-tiled roof
    px(sx + 2, sy + 1, 28, 4, P.roofRedD);
    px(sx + 2, sy + 2, 28, 2, P.roofRed);
    px(sx + 2, sy + 2, 28, 1, P.roofRedL);

    // Hanging rope & bucket
    px(sx + 15, sy + 6, 2, 10, P.woodL); // Rope
    px(sx + 14, sy + 11, 4, 4, P.metalD); // Bucket
    px(sx + 14, sy + 11, 4, 1, P.metalL);
}

function drawForge(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    
    // Dark stone forge body
    px(sx + 2, sy + 12, 28, 18, P.metalD);
    px(sx + 4, sy + 14, 24, 14, P.metal);
    px(sx + 4, sy + 14, 24, 2, P.metalL);

    // Fire mouth (hearth) with active flicker
    px(sx + 10, sy + 18, 12, 8, P.outline);
    const flicker = Math.floor(Date.now() / 100) % 3;
    const fColor = flicker === 0 ? P.fire : (flicker === 1 ? P.fireL : P.redL);
    const fColorCore = flicker === 0 ? P.uiWhite : P.fire;
    
    px(sx + 11, sy + 19, 10, 6, fColor);
    px(sx + 13, sy + 21, 6, 4, fColorCore);

    // Stone Chimney
    px(sx + 20, sy + 2, 8, 12, P.metalD);
    px(sx + 21, sy + 2, 6, 12, P.metal);
    px(sx + 21, sy + 4, 2, 8, P.metalL);
    
    // Generate forge black soot smoke
    drawChimneySmoke(sx + 23, sy - 2);

    // Blacksmith's Anvil on wooden stump
    px(sx + 4, sy + 24, 5, 4, P.metalD); // Anvil body
    px(sx + 2, sy + 22, 7, 2, P.metal);  // Anvil horn/face
    px(sx + 2, sy + 22, 3, 1, P.metalL);
}

function drawMarket(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    
    // Supports
    px(sx + 4, sy + 10, 2, 18, P.woodD);
    px(sx + 26, sy + 10, 2, 18, P.woodD);

    // Striped Canvas Awning (Red & White) with scallops
    px(sx + 2, sy + 3, 28, 8, P.roofRedD);
    for (let i = 0; i < 4; i++) {
        // Red Stripes
        px(sx + 2 + i * 8, sy + 4, 4, 6, P.roofRed);
        px(sx + 2 + i * 8, sy + 4, 4, 1, P.roofRedL);
        // White Stripes
        if (i < 3) {
            px(sx + 6 + i * 8, sy + 4, 4, 6, P.uiCream);
            px(sx + 6 + i * 8, sy + 4, 4, 1, P.uiWhite);
        }
    }
    // Awning hanging scallops
    for (let i = 0; i < 7; i++) {
        px(sx + 3 + i * 4, sy + 10, 3, 2, i % 2 === 0 ? P.roofRedD : P.metal);
    }

    // Wooden Countertop
    px(sx + 2, sy + 18, 28, 10, P.woodD);
    px(sx + 3, sy + 19, 26, 8, P.wood);
    px(sx + 3, sy + 19, 26, 1, P.woodL);

    // Marketplace Goods on table
    // Red Apples basket
    px(sx + 6, sy + 15, 6, 4, P.trunk);
    px(sx + 7, sy + 13, 2, 2, P.red);
    px(sx + 9, sy + 13, 2, 2, P.redL);
    
    // Gold Loaves
    px(sx + 15, sy + 14, 4, 4, P.gold);
    px(sx + 15, sy + 14, 4, 1, P.uiWhite);

    // Blue potion flask
    px(sx + 22, sy + 14, 3, 4, P.windowBlue);
    px(sx + 23, sy + 12, 1, 2, P.uiWhite); // cork/neck
}

function drawWatchtower(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    
    // Criss-cross Timber Base
    px(sx + 8, sy + 12, 16, 18, P.woodD);
    px(sx + 10, sy + 12, 12, 18, P.wood);
    // Draw hollow center of tower beams
    px(sx + 12, sy + 14, 8, 16, P.grass);
    // Beams diagonal criss-cross
    for (let i = 0; i < 14; i += 2) {
        px(sx + 10 + i, sy + 14 + i, 2, 2, P.woodD);
        px(sx + 20 - i, sy + 14 + i, 2, 2, P.woodD);
    }

    // Ladder
    px(sx + 14, sy + 10, 4, 20, P.woodD);
    for (let r = sy + 12; r < sy + 30; r += 4) {
        px(sx + 14, r, 4, 1, P.woodL);
    }

    // Lookout platform
    px(sx + 6, sy + 6, 20, 6, P.woodD);
    px(sx + 7, sy + 7, 18, 4, P.wood);
    px(sx + 7, sy + 7, 18, 1, P.woodL);

    // Glowing security lantern!
    px(sx + 22, sy + 10, 4, 6, P.outline);
    const flicker = Math.floor(Date.now() / 150) % 2;
    px(sx + 23, sy + 11, 2, 4, flicker ? P.window : P.gold);
    // Lantern light beam overlay (translucent/soft pixels)
    px(sx + 21, sy + 15, 6, 2, 'rgba(248, 216, 48, 0.15)');
}

function drawFloor(sx, sy, mapX, mapY) {
    // Rich, warm wooden planks
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.floor);
    
    // Horizontal bevel grooves
    px(sx, sy + 10, TILE_SIZE, 2, P.floorD);
    px(sx, sy + 21, TILE_SIZE, 2, P.floorD);
    px(sx, sy, TILE_SIZE, 1, P.floorL); // highlight

    // Staggered vertical seams & wood grain
    const shift = (mapX + mapY) % 2 === 0 ? 0 : 16;
    px(sx + shift, sy, 2, 10, P.floorD);
    px(sx + (16 - shift), sy + 12, 2, 10, P.floorD);
    px(sx + shift, sy + 23, 2, 10, P.floorD);

    // Shiny tiny nail heads
    px(sx + shift + 1, sy + 8, 1, 1, P.metalD);
    px(sx + (16 - shift) + 1, sy + 20, 1, 1, P.metalD);
}

function drawInteriorWall(sx, sy) {
    // Cozy wainscoting interior wall
    // 1. Plaster top wall
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.wallIn);
    
    // Floral or stripe wallpaper detail
    for (let dx = 4; dx < TILE_SIZE; dx += 8) {
        px(sx + dx, sy + 2, 2, 14, P.wallInL);
    }

    // 2. Wainscoting bottom half (dark mahogany panels)
    px(sx, sy + 16, TILE_SIZE, 16, P.wallInD);
    px(sx, sy + 16, TILE_SIZE, 2, P.woodD); // divider rail
    px(sx, sy + 17, TILE_SIZE, 1, P.woodL);
    
    // Baseboard trim
    px(sx, sy + 28, TILE_SIZE, 4, P.woodD);
    px(sx, sy + 28, TILE_SIZE, 1, P.wood);
}

function drawBed(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    
    // Headboard
    px(sx + 2, sy + 2, 28, 6, P.woodD);
    px(sx + 2, sy + 2, 28, 2, P.woodL);

    // Wooden bedposts
    px(sx + 2, sy + 2, 4, 18, P.woodD);
    px(sx + 26, sy + 2, 4, 18, P.woodD);

    // Cozy mattress / sheet
    px(sx + 4, sy + 8, 24, 22, P.pillow);

    // Heavy red blanket with gold border
    px(sx + 4, sy + 12, 24, 18, P.bed);
    px(sx + 4, sy + 12, 24, 2, P.gold); // Gold stitching border
    px(sx + 4, sy + 14, 24, 4, P.bedL);  // highlight fold
    
    // Fluffy pillows
    px(sx + 6, sy + 6, 8, 5, P.pillow);
    px(sx + 6, sy + 9, 8, 2, P.metalL); // pillow shadow
    px(sx + 18, sy + 6, 8, 5, P.pillow);
    px(sx + 18, sy + 9, 8, 2, P.metalL);
}

function drawSwordCase(sx, sy, mapX, mapY) {
    drawFloor(sx, sy, mapX, mapY);
    
    const caseTop = map[mapY - 1] && map[mapY - 1][mapX] === 9;
    
    if (!caseTop) {
        // Top part: glass showcase with sheathed shiny sword
        px(sx + 4, sy + 4, 24, 28, P.woodD);
        px(sx + 6, sy + 6, 20, 26, P.outline); // glass interior
        px(sx + 8, sy + 8, 16, 24, '#141434'); // deep blue velvet backing
        
        // The glowing blade!
        px(sx + 14, sy + 10, 4, 20, P.metalL);
        px(sx + 15, sy + 10, 2, 20, P.uiWhite); // razor edge glint
        px(sx + 14, sy + 8, 4, 2, P.gold);    // tip cap
        
        // Shiny glass diagonal reflection lines (double pass)
        px(sx + 6, sy + 12, 10, 2, 'rgba(255,255,255,0.18)');
        px(sx + 12, sy + 6, 12, 2, 'rgba(255,255,255,0.18)');
    } else {
        // Bottom part: wood pedestal base with golden handles
        px(sx + 4, sy, 24, 26, P.woodD);
        px(sx + 6, sy + 2, 20, 22, P.wood);
        px(sx + 6, sy + 2, 20, 2, P.woodL);

        // Drawers with golden pull knobs
        px(sx + 8, sy + 6, 16, 6, P.woodD);
        px(sx + 15, sy + 8, 2, 2, P.gold); // Handle 1
        px(sx + 8, sy + 14, 16, 6, P.woodD);
        px(sx + 15, sy + 16, 2, 2, P.gold); // Handle 2
        
        // Bottom feet base
        px(sx + 2, sy + 24, 28, 4, P.woodD);
    }
}

function drawTable(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    
    // Table legs
    px(sx + 4, sy + 14, 4, 14, P.woodD);
    px(sx + 24, sy + 14, 4, 14, P.woodD);

    // Checkered tablecloth (Red & White)
    px(sx + 2, sy + 8, 28, 8, P.roofRed);
    px(sx + 2, sy + 8, 28, 2, P.roofRedL);
    for (let i = 0; i < 7; i++) {
        if (i % 2 === 0) {
            px(sx + 2 + i * 4, sy + 10, 4, 4, P.uiCream);
            px(sx + 2 + i * 4, sy + 10, 4, 1, P.uiWhite);
        }
    }

    // Steaming tea cup!
    px(sx + 14, sy + 5, 4, 3, P.uiWhite);
    px(sx + 13, sy + 6, 1, 2, P.uiWhite); // handle
    
    // Steam animation (floating pixel waves)
    const tick = Math.floor(Date.now() / 150) % 4;
    px(sx + 14 + (tick % 2 === 0 ? 1 : 0), sy + 2, 1, 2, 'rgba(255, 255, 255, 0.4)');
    px(sx + 15 + (tick % 2 !== 0 ? 1 : 0), sy, 1, 2, 'rgba(255, 255, 255, 0.4)');
}

function drawChair(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    
    // Back support slats
    px(sx + 8, sy + 4, 4, 16, P.woodD);
    px(sx + 20, sy + 4, 4, 16, P.woodD);
    px(sx + 12, sy + 6, 8, 2, P.wood);
    px(sx + 12, sy + 11, 8, 2, P.wood);

    // Velvet padded seat cushion
    px(sx + 6, sy + 15, 20, 5, P.woodD);
    px(sx + 7, sy + 14, 18, 5, P.bed);
    px(sx + 8, sy + 14, 16, 2, P.bedL); // light fold

    // Front legs
    px(sx + 8, sy + 20, 3, 10, P.woodD);
    px(sx + 21, sy + 20, 3, 10, P.woodD);
}

function drawBookshelf(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    
    // Heavy wooden frame
    px(sx + 2, sy + 2, 28, 28, P.woodD);
    px(sx + 4, sy + 4, 24, 26, P.wood);
    px(sx + 4, sy + 4, 24, 2, P.woodL);

    // Book rows (vivid spines)
    const colors = [P.red, P.glow, P.crop, P.gold, P.roofBlue, P.pillow];
    for (let shelf = 0; shelf < 3; shelf++) {
        const sy1 = sy + 6 + shelf * 8;
        // Wooden horizontal shelves
        px(sx + 4, sy1 + 6, 24, 2, P.woodD);
        
        for (let b = 0; b < 5; b++) {
            const bx = sx + 6 + b * 4.5;
            const bCol = colors[(shelf * 3 + b) % colors.length];
            // Leaning book effect
            if (shelf === 1 && b === 3) {
                px(bx + 1, sy1 + 1, 2, 5, bCol);
                px(bx + 2, sy1, 2, 5, bCol);
            } else {
                px(bx, sy1, 3, 6, bCol);
                px(bx, sy1, 3, 1, P.uiWhite); // top pages/spine highlight
            }
        }
    }
}

function drawExitMat(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    
    // Door frames
    px(sx, sy, 4, TILE_SIZE, P.woodD);
    px(sx + 28, sy, 4, TILE_SIZE, P.woodD);

    // Traditional woven doormat with concentric bands and fringe
    px(sx + 5, sy + 10, 22, 18, P.woodD);
    px(sx + 6, sy + 11, 20, 16, P.gold); // Gold outer band
    px(sx + 10, sy + 13, 12, 12, P.red); // Burgundy center
    px(sx + 12, sy + 15, 8, 8, P.suit);  // Dark crest
    
    // Braided fringes
    for (let fy = sy + 11; fy < sy + 27; fy += 2) {
        px(sx + 4, fy, 1, 1, P.uiCream);
        px(sx + 27, fy, 1, 1, P.uiCream);
    }
}

function drawTile(tileType, tileX, tileY) {
    const screenX = tileX * TILE_SIZE;
    const screenY = tileY * TILE_SIZE;
    const mapX = camera.x + tileX;
    const mapY = camera.y + tileY;

    switch (tileType) {
        case 0: drawGrassBase(screenX, screenY, mapX, mapY); break;
        case 1: drawTree(screenX, screenY, mapX, mapY); break;
        case 2: drawPath(screenX, screenY, mapX, mapY); break;
        case 3:
        case 4:
        case 20:
            // Drawn as grass baseline; the actual 3D building overlay draws on top later
            drawGrassBase(screenX, screenY, mapX, mapY);
            break;
        case 5: drawWater(screenX, screenY, mapX, mapY); break;
        case 6: drawFloor(screenX, screenY, mapX, mapY); break;
        case 7: drawInteriorWall(screenX, screenY); break;
        case 8: drawBed(screenX, screenY); break;
        case 9: drawSwordCase(screenX, screenY, mapX, mapY); break;
        case 10: drawCrops(screenX, screenY); break;
        case 11: drawWell(screenX, screenY, mapX, mapY); break;
        case 12: drawForge(screenX, screenY, mapX, mapY); break;
        case 13: drawMarket(screenX, screenY, mapX, mapY); break;
        case 14: drawWatchtower(screenX, screenY, mapX, mapY); break;
        case 15: break; // Door sprite drawn in a separate pass
        case 16: drawExitMat(screenX, screenY); break;
        case 17: drawTable(screenX, screenY); break;
        case 18: drawChair(screenX, screenY); break;
        case 19: drawBookshelf(screenX, screenY); break;
        default: drawGrassBase(screenX, screenY, mapX, mapY); break;
    }
}

// ------------------------------------------------------------------
// Breathtaking Building Drawing — 3D-slanted GBA Cottage Overlay
// ------------------------------------------------------------------

function drawChimneySmoke(cx, cy) {
    // Elegant floating/swaying pixel smoke puffs (light grey to white)
    for (let i = 0; i < 3; i++) {
        const age = (Date.now() + i * 500) % 1500;
        const t = age / 1500;
        
        const dy = t * 45;
        const dx = Math.sin(t * 6 + i * 3) * 10;
        const sx = cx + dx;
        const sy = cy - dy;
        
        // Smoke size ballooning then dissolving
        const r = Math.sin(t * Math.PI) * 7 + 1.5;
        if (r < 1) continue;
        
        const baseColor = '#e0e6ed';
        const shadowColor = '#a0aab8';
        const lightColor = '#ffffff';
        
        const ri = Math.floor(r);
        for (let row = -ri; row <= ri; row++) {
            const width = Math.floor(Math.sqrt(r * r - row * row));
            if (width <= 0) continue;
            
            // Draw dithered retro smoke circle by stacking horizontal rects
            px(sx - width * 2, sy + row * 2, width * 4, 2, shadowColor);
            if (width > 1) {
                px(sx - (width - 1) * 2, sy + row * 2, (width - 1) * 4, 2, baseColor);
            }
            if (row < 0 && width > 2) {
                px(sx - (width - 2) * 2, sy + row * 2, (width - 2) * 2, 2, lightColor);
            }
        }
    }
}

function drawBuilding(screenX, screenY, type) {
    const pal = {
        3: { // Blue House - Council Hall (Cozy half-timbered stone cottage)
            roof: P.roofBlue, roofD: P.roofBlueD, roofL: P.roofBlueL,
            wall: P.wallBlue, wallD: P.wallBlueD, wallL: P.wallBlueL,
            timber: P.woodD, timberD: '#3a1e0d',
            found: P.metal, foundD: P.metalD
        },
        4: { // Red House - Player Home (Charming white horizontal clapboard)
            roof: P.roofRed, roofD: P.roofRedD, roofL: P.roofRedL,
            wall: P.wallRed, wallD: P.wallRedD, wallL: P.wallRedL,
            timber: P.wood, timberD: P.woodD,
            found: P.found, foundD: P.foundD
        },
        20: { // Green House - Homestead (Log cabin with green moss shingle roof)
            roof: P.roofGreen, roofD: P.roofGreenD, roofL: P.crop,
            wall: P.wallTan, wallD: P.wallTanD, wallL: P.wallTanL,
            timber: P.woodD, timberD: '#241408',
            found: P.found, foundD: P.foundD
        }
    }[type];

    const bw = 5 * TILE_SIZE; // 160
    const bh = 5 * TILE_SIZE; // 160

    // 1. Base footprint grass
    for (let ty = 0; ty < 5; ty++) {
        for (let tx = 0; tx < 5; tx++) {
            drawGrassBase(screenX + tx * TILE_SIZE, screenY + ty * TILE_SIZE, tx, ty);
        }
    }

    // 2. Beautiful soft shadow on grass
    px(screenX - 6, screenY + 124, bw + 12, 10, P.shadow);

    // 3. Slanted Gabled Roof (GBA ridge tiles)
    const roofBaseY = screenY + 76;
    
    // Draw 8 overlapping horizontal shingles layers
    for (let step = 0; step < 8; step++) {
        const ry = screenY + 14 + step * 8;
        const inset = (7 - step) * 8; // narrow to peak
        const width = bw - inset * 2;
        const rx = screenX + inset;
        
        px(rx, ry, width, 8, pal.roofD);
        px(rx + 2, ry + 2, width - 4, 4, pal.roof);
        px(rx + 2, ry, width - 4, 2, pal.roofL); // edge highlight

        // Vertical tile grout lines
        for (let sx = rx + 8; sx < rx + width; sx += 12) {
            px(sx, ry + 2, 2, 6, pal.roofD);
        }
    }

    // White trim (bargeboards) on roof gable sides
    for (let step = 0; step < 8; step++) {
        const ry = screenY + 14 + step * 8;
        const inset = (7 - step) * 8;
        // Left Trim
        px(screenX + inset - 2, ry, 4, 8, P.uiCream);
        px(screenX + inset - 4, ry + 2, 2, 6, pal.timberD);
        // Right Trim
        px(screenX + bw - inset - 2, ry, 4, 8, P.uiCream);
        px(screenX + bw - inset, ry + 2, 2, 6, pal.timberD);
    }

    // Roof peak ridge cap
    px(screenX + 54, screenY + 10, 52, 6, P.uiCream);
    px(screenX + 54, screenY + 14, 52, 2, P.metalL);
    px(screenX + 52, screenY + 12, 2, 4, P.metalL);
    px(screenX + 106, screenY + 12, 2, 4, P.metalL);

    // 4. Brick/Stone Chimney & Smoke
    const chimX = screenX + bw - 36;
    const chimY = screenY + 20;
    px(chimX, chimY, 14, 38, type === 3 ? P.metal : '#9c301c'); // stone vs red brick
    px(chimX, chimY, 14, 4, P.outline); // soot cap
    px(chimX + 2, chimY + 4, 10, 34, type === 3 ? P.metalL : P.roofRed);
    // Mortar lines
    for (let cy = chimY + 8; cy < chimY + 38; cy += 8) {
        px(chimX, cy, 14, 2, type === 3 ? P.metalD : P.roofRedD);
    }
    // rising chimney smoke
    drawChimneySmoke(chimX + 7, chimY - 4);

    // 5. Cottage Walls
    const wallY = screenY + 76;
    const wallH = 50;
    px(screenX + 4, wallY, bw - 8, wallH, pal.wallD);
    px(screenX + 6, wallY, bw - 12, wallH - 2, pal.wall);
    px(screenX + 6, wallY, bw - 12, 2, pal.wallL);

    // Cut-stone Foundation
    px(screenX + 4, wallY + wallH - 6, bw - 8, 6, pal.foundD);
    px(screenX + 6, wallY + wallH - 6, bw - 12, 4, pal.found);
    for (let fx = screenX + 12; fx < screenX + bw - 12; fx += 14) {
        px(fx, wallY + wallH - 6, 2, 6, pal.foundD);
    }

    // Wall unique textures
    if (type === 3) {
        // Tudor half-timbered vertical/diagonal framing
        px(screenX + 6, wallY, 4, wallH - 6, pal.timberD);
        px(screenX + bw - 10, wallY, 4, wallH - 6, pal.timberD);
        px(screenX + 42, wallY, 4, wallH - 6, pal.timber);
        px(screenX + 114, wallY, 4, wallH - 6, pal.timber);
        // Diagonals
        for (let d = 0; d < 20; d++) {
            px(screenX + 10 + d, wallY + d, 3, 2, pal.timberD);
            px(screenX + bw - 13 - d, wallY + d, 3, 2, pal.timberD);
        }
    } else if (type === 4) {
        // Cozy horizontal white wood siding planks
        for (let cy = wallY + 6; cy < wallY + wallH - 6; cy += 6) {
            px(screenX + 6, cy, bw - 12, 2, pal.wallD);
            px(screenX + 6, cy - 2, bw - 12, 2, pal.wallL);
        }
        // Corner timber columns
        px(screenX + 6, wallY, 6, wallH - 6, pal.timber);
        px(screenX + bw - 12, wallY, 6, wallH - 6, pal.timber);
    } else if (type === 20) {
        // Log cabin layers
        for (let cy = wallY; cy < wallY + wallH - 6; cy += 8) {
            px(screenX + 6, cy, bw - 12, 8, pal.wallD);
            px(screenX + 6, cy + 2, bw - 12, 4, pal.wall);
            px(screenX + 6, cy + 1, bw - 12, 1, pal.wallL);
            // Interlocking log ends on sides
            px(screenX + 2, cy + 1, 6, 6, pal.timberD);
            px(screenX + 3, cy + 2, 4, 4, pal.timber);
            px(screenX + bw - 8, cy + 1, 6, 6, pal.timberD);
            px(screenX + bw - 7, cy + 2, 4, 4, pal.timber);
        }
    }

    // 6. Double-hung multi-pane Windows
    for (let i = 0; i < 2; i++) {
        const wx = screenX + (i === 0 ? 22 : 106);
        const wy = wallY + 10;
        
        px(wx - 2, wy - 2, 36, 26, pal.timberD); // trim border
        px(wx, wy, 32, 22, P.uiWhite); // frame
        
        if (type === 3) {
            // Council: Gothic glowing arched stained glass
            px(wx + 2, wy + 2, 28, 18, '#ffd830');
            px(wx + 2, wy + 2, 28, 2, '#ffa010'); // gradient
            for (let lx = 0; lx < 28; lx += 6) {
                px(wx + 2 + lx, wy + 2, 1, 18, 'rgba(40, 20, 0, 0.4)');
            }
        } else if (type === 20) {
            // Homestead: opened green window shutters on sides
            px(wx + 2, wy + 2, 28, 18, '#243c5c');
            px(wx + 4, wy + 2, 24, 18, '#4370a0');
            px(wx + 10, wy + 2, 4, 18, P.uiWhite); // glint
            px(wx + 18, wy + 2, 2, 18, P.uiWhite);
            
            // Shutters opened wide
            // Left shutter
            px(wx - 14, wy - 1, 12, 24, '#1c4415');
            px(wx - 13, wy, 10, 22, '#346a2a');
            px(wx - 10, wy + 4, 4, 14, '#1c4415');
            // Right shutter
            px(wx + 34, wy - 1, 12, 24, '#1c4415');
            px(wx + 35, wy, 10, 22, '#346a2a');
            px(wx + 38, wy + 4, 4, 14, '#1c4415');
        } else {
            // Player: Beautiful sky blue windows with shiny diagonals
            px(wx + 2, wy + 2, 28, 18, '#285880');
            px(wx + 4, wy + 2, 24, 18, '#4890c8');
            px(wx + 8, wy + 2, 4, 18, '#9cd0f0');
            px(wx + 18, wy + 2, 2, 18, P.uiWhite);
            px(wx + 22, wy + 2, 1, 18, P.uiWhite);
            
            px(wx + 14, wy + 2, 4, 18, P.uiWhite); // white cross bars
            px(wx + 2, wy + 10, 28, 3, P.uiWhite);
        }
    }
}

function drawBuildings() {
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
        for (let tx = 0; tx < MAP_WIDTH; tx++) {
            const t = map[ty][tx];
            if (t !== 3 && t !== 4 && t !== 20) continue;
            // Draw only from top-left anchor tile of the 5x5 footprint
            if (map[ty - 1] && map[ty - 1][tx] === t) continue;
            if (map[ty] && map[ty][tx - 1] === t) continue;

            const bx = tx * TILE_SIZE - camera.x * TILE_SIZE;
            const by = ty * TILE_SIZE - camera.y * TILE_SIZE;
            const bw = 5 * TILE_SIZE;
            const bh = 5 * TILE_SIZE;
            if (bx + bw < 0 || bx > canvas.width || by + bh < 0 || by > canvas.height) continue;
            drawBuilding(bx, by, t);
        }
    }
}

function drawDoor(screenX, screenY) {
    // Elegant arched wooden entry door with heavy iron brackets
    px(screenX + 4, screenY + 2, 24, 28, P.outline);
    px(screenX + 6, screenY + 4, 20, 24, P.door);
    px(screenX + 6, screenY + 4, 20, 2, P.doorL); // lintel highlight

    // Classic GBA wooden door panel engravings
    // Iron hinge straps on the left side
    px(screenX + 4, screenY + 8, 8, 2, P.metalD);
    px(screenX + 4, screenY + 20, 8, 2, P.metalD);
    px(screenX + 8, screenY + 8, 7, 8, P.doorL);
    px(screenX + 17, screenY + 8, 7, 8, P.doorL);
    px(screenX + 8, screenY + 18, 7, 8, P.doorL);
    px(screenX + 17, screenY + 18, 7, 8, P.doorL);

    // Golden entry ring handle
    px(screenX + 22, screenY + 15, 2, 3, P.gold);
    px(screenX + 21, screenY + 16, 1, 1, P.gold);

    // Stone brick door threshold doorstep
    px(screenX + 2, screenY + 28, 28, 4, P.metal);
    px(screenX + 2, screenY + 28, 28, 1, P.metalL);
}

function drawDoors() {
    for (const d of villageDoors) {
        const sx = d.tx * TILE_SIZE - camera.x * TILE_SIZE;
        const sy = d.ty * TILE_SIZE - camera.y * TILE_SIZE;
        if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
        drawDoor(sx, sy);
    }
}

// ------------------------------------------------------------------
// High-Fidelity Pokémon Sprite Drawing (Cute heads, precise walk)
// ------------------------------------------------------------------

function drawPlayer() {
    const screenX = Math.floor(player.x - camera.x * TILE_SIZE);
    const screenY = Math.floor(player.y - camera.y * TILE_SIZE);

    // Smooth walking foot stepping cycle (4-steps)
    let walkPhase = 0; // 0=standing, 1=left forward, 2=standing, 3=right forward
    let bob = 0;
    
    if (player.isMoving) {
        player.animFrame = (player.animFrame + 1) % 16;
        walkPhase = Math.floor(player.animFrame / 4);
        bob = (player.animFrame < 8) ? 0 : -1;
    }

    const ox = screenX;
    const oy = screenY + bob;
    pixelShadow(ox + 16, oy + 30); // shadow

    if (player.facing === 'down') drawPlayerDown(ox, oy, walkPhase);
    else if (player.facing === 'up') drawPlayerUp(ox, oy, walkPhase);
    else if (player.facing === 'left') drawPlayerSide(ox, oy, -1, walkPhase);
    else drawPlayerSide(ox, oy, 1, walkPhase);
}

function drawPlayerDown(ox, oy, walkPhase) {
    // Sheathed sword strapped diagonally on back
    px(ox + 21, oy + 12, 5, 16, P.woodD);
    px(ox + 22, oy + 12, 2, 16, P.wood);
    px(ox + 20, oy + 9, 6, 3, P.gold);

    // Legs / boots stepping cycle animation
    if (walkPhase === 0 || walkPhase === 2) {
        // Standing Still Boots
        px(ox + 10, oy + 25, 5, 4, P.pants);
        px(ox + 17, oy + 25, 5, 4, P.pants);
        px(ox + 9, oy + 29, 6, 3, P.boot);
        px(ox + 17, oy + 29, 6, 3, P.boot);
    } else if (walkPhase === 1) {
        // Left boot forward, right boot back
        px(ox + 10, oy + 26, 5, 4, P.pants);
        px(ox + 17, oy + 24, 5, 4, P.pants);
        px(ox + 9, oy + 30, 6, 3, P.boot); // forward
        px(ox + 17, oy + 28, 6, 3, P.boot); // back
    } else {
        // Right boot forward, left boot back
        px(ox + 10, oy + 24, 5, 4, P.pants);
        px(ox + 17, oy + 26, 5, 4, P.pants);
        px(ox + 9, oy + 28, 6, 3, P.boot);
        px(ox + 17, oy + 30, 6, 3, P.boot);
    }

    // Body Outline + Crimson Coat
    px(ox + 8, oy + 14, 16, 13, P.outline);
    px(ox + 9, oy + 15, 14, 11, P.red);
    px(ox + 9, oy + 15, 14, 2, P.redL);
    // Arms with skin cuffs
    px(ox + 6, oy + 16, 3, 8, P.redD);
    px(ox + 23, oy + 16, 3, 8, P.redD);
    px(ox + 6, oy + 24, 3, 3, P.skin);
    px(ox + 23, oy + 24, 3, 3, P.skin);
    
    // Tech Life-Suit Chest Plate (Pulse effect!)
    px(ox + 12, oy + 17, 8, 6, P.suit);
    const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
    const glowColor = pulse > 0.8 ? P.glowL : (pulse > 0.5 ? '#70f0ff' : P.glow);
    px(ox + 13, oy + 18, 2, 4, glowColor);
    px(ox + 13, oy + 18, 2, 1, P.glowL);

    // Belt
    px(ox + 9, oy + 24, 14, 2, P.suit);
    px(ox + 14, oy + 24, 4, 2, P.gold);

    // Beautiful Big GBA Head
    px(ox + 10, oy + 4, 12, 11, P.outline);
    px(ox + 11, oy + 5, 10, 9, P.skin);
    
    // Chocolate Hair Cap + messy bangs
    px(ox + 10, oy + 3, 12, 4, P.hair);
    px(ox + 10, oy + 3, 12, 2, P.hairD);
    px(ox + 10, oy + 5, 2, 5, P.hair);
    px(ox + 20, oy + 5, 2, 5, P.hair);
    px(ox + 12, oy + 4, 3, 2, P.hairL);
    px(ox + 12, oy + 5, 2, 2, P.hair);
    px(ox + 18, oy + 5, 2, 2, P.hair);

    // Deep black express eyes with shinny glints
    px(ox + 13, oy + 8, 2, 2, P.outline);
    px(ox + 17, oy + 8, 2, 2, P.outline);
    px(ox + 13, oy + 8, 1, 1, P.uiWhite); // glint
    px(ox + 17, oy + 8, 1, 1, P.uiWhite);
    
    px(ox + 15, oy + 11, 2, 1, P.skinD); // mouth
}

function drawPlayerUp(ox, oy, walkPhase) {
    // Legs stepping cycle
    if (walkPhase === 0 || walkPhase === 2) {
        px(ox + 10, oy + 25, 5, 4, P.pants);
        px(ox + 17, oy + 25, 5, 4, P.pants);
        px(ox + 9, oy + 29, 6, 3, P.boot);
        px(ox + 17, oy + 29, 6, 3, P.boot);
    } else if (walkPhase === 1) {
        px(ox + 10, oy + 26, 5, 4, P.pants);
        px(ox + 17, oy + 24, 5, 4, P.pants);
        px(ox + 9, oy + 30, 6, 3, P.boot);
        px(ox + 17, oy + 28, 6, 3, P.boot);
    } else {
        px(ox + 10, oy + 24, 5, 4, P.pants);
        px(ox + 17, oy + 26, 5, 4, P.pants);
        px(ox + 9, oy + 28, 6, 3, P.boot);
        px(ox + 17, oy + 30, 6, 3, P.boot);
    }

    // Body Back
    px(ox + 8, oy + 14, 16, 13, P.outline);
    px(ox + 9, oy + 15, 14, 11, P.redD);
    px(ox + 9, oy + 15, 14, 2, P.red);
    px(ox + 6, oy + 16, 3, 8, P.redD);
    px(ox + 23, oy + 16, 3, 8, P.redD);
    px(ox + 6, oy + 24, 3, 3, P.skin);
    px(ox + 23, oy + 24, 3, 3, P.skin);
    
    // Backpack unit
    px(ox + 12, oy + 17, 8, 5, P.suit);
    px(ox + 14, oy + 18, 2, 2, P.glow);
    px(ox + 9, oy + 24, 14, 2, P.suit);

    // Diagonally slung sword
    px(ox + 21, oy + 10, 5, 16, P.woodD);
    px(ox + 20, oy + 7, 6, 3, P.gold);

    // Head back (all hair)
    px(ox + 10, oy + 3, 12, 12, P.outline);
    px(ox + 11, oy + 4, 10, 10, P.hair);
    px(ox + 11, oy + 4, 10, 2, P.hairD);
    px(ox + 13, oy + 6, 3, 2, P.hairL);
    px(ox + 18, oy + 6, 2, 2, P.hairL);
}

function drawPlayerSide(ox, oy, dir, walkPhase) {
    const m = (x) => (dir === 1 ? ox + 16 + x : ox + 16 - x - 1);
    const mw = (x, w) => (dir === 1 ? ox + 16 + x : ox + 16 - x - w);

    // Sword on back
    px(mw(-12, 4), oy + 10, 4, 14, P.woodD);
    px(mw(-13, 5), oy + 7, 5, 3, P.gold);

    // Legs walk cycle (profile)
    if (walkPhase === 0 || walkPhase === 2) {
        px(mw(-7, 5), oy + 25, 5, 5, P.pants);
        px(mw(2, 5), oy + 25, 5, 5, P.pants);
        px(mw(-8, 6), oy + 29, 6, 3, P.boot);
        px(mw(2, 6), oy + 29, 6, 3, P.boot);
    } else if (walkPhase === 1) {
        // Legs splayed
        px(mw(-9, 5), oy + 24, 5, 4, P.pants); // back up
        px(mw(4, 5), oy + 26, 5, 4, P.pants);  // front down
        px(mw(-10, 6), oy + 28, 6, 3, P.boot);
        px(mw(4, 6), oy + 30, 6, 3, P.boot);
    } else {
        px(mw(-5, 5), oy + 26, 5, 4, P.pants);
        px(mw(0, 5), oy + 24, 5, 4, P.pants);
        px(mw(-6, 6), oy + 30, 6, 3, P.boot);
        px(mw(0, 6), oy + 28, 6, 3, P.boot);
    }

    // Body side profile
    px(mw(-8, 16), oy + 14, 16, 13, P.outline);
    px(mw(-7, 14), oy + 15, 14, 11, P.red);
    px(mw(-7, 14), oy + 15, 14, 2, P.redL);
    
    // Front arm swinging
    px(mw(6, 3), oy + 16, 3, 8, P.redD);
    px(mw(6, 3), oy + 24, 3, 3, P.skin);
    
    // Side Chest plate pulse
    px(mw(0, 5), oy + 17, 5, 6, P.suit);
    const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
    const glowColor = pulse > 0.8 ? P.glowL : (pulse > 0.5 ? '#70f0ff' : P.glow);
    px(mw(1, 2), oy + 18, 2, 3, glowColor);

    px(mw(-7, 14), oy + 24, 14, 2, P.suit);

    // Head profile
    px(mw(-6, 12), oy + 4, 12, 11, P.outline);
    px(mw(-5, 10), oy + 5, 10, 9, P.skin);
    
    // Side hair flowing
    px(mw(-6, 12), oy + 2, 12, 4, P.hair);
    px(mw(-6, 12), oy + 2, 12, 2, P.hairD);
    px(mw(-6, 2), oy + 4, 2, 6, P.hair);
    px(mw(3, 3), oy + 4, 3, 3, P.hair); // fringe

    // Eye profile facing right/left
    px(m(2), oy + 8, 2, 2, P.outline);
    px(m(2), oy + 8, 1, 1, P.uiWhite);
    
    px(mw(3, 2), oy + 11, 2, 1, P.skinD); // mouth crease
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function drawNPC(npc) {
    const screenX = npc.tileX * TILE_SIZE - camera.x * TILE_SIZE;
    const screenY = npc.tileY * TILE_SIZE - camera.y * TILE_SIZE;
    if (screenX < -TILE_SIZE || screenX > canvas.width || screenY < -TILE_SIZE || screenY > canvas.height) return;

    pixelShadow(screenX + 16, screenY + 30); // shadow

    const isElder = npc.id.includes('elder');
    const robe = npc.color;
    const robeD = adjustColor(npc.color, -35);
    const robeL = adjustColor(npc.color, 30);

    // Robe gown outline
    px(screenX + 8, screenY + 14, 16, 16, P.outline);
    px(screenX + 9, screenY + 15, 14, 14, robe);
    px(screenX + 9, screenY + 15, 14, 2, robeL);
    px(screenX + 11, screenY + 16, 1, 12, robeD);
    px(screenX + 20, screenY + 16, 1, 12, robeD);
    px(screenX + 9, screenY + 27, 14, 2, robeD);
    
    if (isElder) {
        px(screenX + 10, screenY + 14, 12, 2, P.hairGray);
    }

    // Head
    px(screenX + 10, screenY + 4, 12, 11, P.outline);
    px(screenX + 11, screenY + 5, 10, 9, P.skin);

    if (isElder) {
        // Bald cap + long gray beard
        px(screenX + 11, screenY + 4, 10, 3, P.skinD);
        px(screenX + 10, screenY + 5, 2, 6, P.hairGray);
        px(screenX + 20, screenY + 5, 2, 6, P.hairGray);
        px(screenX + 12, screenY + 11, 8, 5, P.hairGray); // Majestic split beard
        px(screenX + 13, screenY + 15, 2, 2, P.hairGray);
        px(screenX + 17, screenY + 15, 2, 2, P.hairGray);
        
        // Eyes
        px(screenX + 13, screenY + 8, 2, 2, P.outline);
        px(screenX + 17, screenY + 8, 2, 2, P.outline);
        
        // Glasses! Round gold wire rims
        px(screenX + 12, screenY + 7, 4, 1, P.gold);
        px(screenX + 16, screenY + 7, 4, 1, P.gold);
    } else {
        // Tinslaire (cute younger brother brown hair)
        px(screenX + 10, screenY + 2, 12, 4, P.hair);
        px(screenX + 10, screenY + 2, 12, 2, P.hairD);
        px(screenX + 10, screenY + 4, 2, 5, P.hair);
        px(screenX + 20, screenY + 4, 2, 5, P.hair);
        
        px(screenX + 13, screenY + 8, 2, 2, P.outline);
        px(screenX + 17, screenY + 8, 2, 2, P.outline);
        px(screenX + 13, screenY + 8, 1, 1, P.uiWhite);
        px(screenX + 17, screenY + 8, 1, 1, P.uiWhite);
        
        px(screenX + 15, screenY + 11, 2, 1, P.skinD); // mouth
    }

    // Name tag banner above NPC's head (Capsule style)
    const label = npc.name;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    const tw = Math.ceil(ctx.measureText(label).width) + 8;
    
    // Draw Capsule Tag
    px(screenX + 16 - tw / 2, screenY - 10, tw, 10, P.uiBlueD);
    px(screenX + 16 - tw / 2 + 1, screenY - 9, tw - 2, 8, P.uiCream);
    
    // Double pass text for gorgeous retro shadow
    ctx.fillStyle = P.metalD;
    ctx.fillText(label, screenX + 16 + 0.5, screenY - 2.5); // shadow
    ctx.fillStyle = P.uiName;
    ctx.fillText(label, screenX + 16, screenY - 3);
}

// ------------------------------------------------------------------
// Breathtaking GBA/FireRed Dialogue System
// ------------------------------------------------------------------

function drawDialog() {
    if (!currentDialog) return;

    // Standard Pokémon FireRed Dialogue layout:
    // Cream inner fill, dark charcoal outer border, light slate inner double frame.
    const boxX = 16;
    const boxY = canvas.height - 78;
    const boxW = canvas.width - 32;
    const boxH = 66;

    // Truncated pixel corners to simulate beautiful round edges
    const drawRoundedRect = (x, y, w, h, borderCol, fillCol) => {
        px(x, y, w, h, borderCol);
        // Truncate corners
        px(x, y, 2, 2, P.shadow);
        px(x + w - 2, y, 2, 2, P.shadow);
        px(x, y + h - 2, 2, 2, P.shadow);
        px(x + w - 2, y + h - 2, 2, 2, P.shadow);
        
        // Inner fill
        px(x + 2, y + 2, w - 4, h - 4, fillCol);
    };

    // Draw borders layers
    drawRoundedRect(boxX, boxY, boxW, boxH, P.uiBlack, P.uiBlue);
    px(boxX + 2, boxY + 2, boxW - 4, boxH - 4, P.uiBlack);
    px(boxX + 4, boxY + 4, boxW - 8, boxH - 8, P.uiCream);

    // Name tag capsule floating over the top-left edge of dialogue box
    const nTagX = boxX + 12;
    const nTagY = boxY - 12;
    ctx.font = 'bold 9px monospace';
    const nTagW = Math.ceil(ctx.measureText(currentDialog.name).width) + 16;
    const nTagH = 15;
    
    drawRoundedRect(nTagX, nTagY, nTagW, nTagH, P.uiBlueD, P.uiBlue);
    px(nTagX + 1, nTagY + 1, nTagW - 2, nTagH - 2, P.uiBlueD);
    px(nTagX + 2, nTagY + 2, nTagW - 4, nTagH - 4, P.uiWhite);
    
    // Draw Speaker Name with shadow
    ctx.textAlign = 'left';
    ctx.fillStyle = P.uiBlue;
    ctx.fillText(currentDialog.name, nTagX + 9, nTagY + 11);
    ctx.fillStyle = P.uiBlueD;
    ctx.fillText(currentDialog.name, nTagX + 8, nTagY + 10);

    // Body Text with standard 1px GBA pixel shadow
    ctx.font = 'bold 11px monospace';
    const text = currentDialog.dialog[dialogIndex];
    const words = text.split(' ');
    let line = '';
    const lines = [];
    const maxWidth = boxW - 36;
    
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
        } else {
            line = test;
        }
    }
    lines.push(line);

    for (let i = 0; i < Math.min(lines.length, 3); i++) {
        const lx = boxX + 16;
        const ly = boxY + 22 + i * 13;
        
        // Double pass for drop-shadow
        ctx.fillStyle = '#b0b8c0'; // soft blue shadow
        ctx.fillText(lines[i], lx + 1, ly + 1);
        ctx.fillStyle = P.uiText; // deep slate text
        ctx.fillText(lines[i], lx, ly);
    }

    // Continuing blinking arrow prompt (▼)
    const arrowX = boxX + boxW - 22;
    const arrowY = boxY + boxH - 18;
    const bob = Math.sin(Date.now() / 100) * 2; // high speed bobbing
    
    if (Math.floor(Date.now() / 300) % 2 === 0) {
        px(arrowX, arrowY + bob, 8, 2, P.uiBlueD);
        px(arrowX + 2, arrowY + 2 + bob, 4, 2, P.uiBlueD);
        px(arrowX + 3, arrowY + 4 + bob, 2, 2, P.uiBlueD);
    }
}

function drawInteractPrompt() {
    if (currentDialog || player.isMoving) return;

    let label = null;
    if (currentArea === 'interior') {
        if (nearSwordCase()) label = 'E · Inspect';
    } else if (getNearbyNPC()) {
        label = 'E · Talk';
    }

    if (label) {
        // Beautiful GBA-style overlay badge pill
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        const tw = Math.ceil(ctx.measureText(label).width) + 14;
        const x = canvas.width / 2 - tw / 2;
        
        px(x, 8, tw, 14, P.uiBlack);
        px(x + 1, 9, tw - 2, 12, P.uiBlue);
        px(x + 2, 10, tw - 4, 10, P.uiCream);
        
        ctx.fillStyle = P.uiBlueD;
        ctx.fillText(label, canvas.width / 2 + 0.5, 18.5); // shadow
        ctx.fillStyle = P.uiText;
        ctx.fillText(label, canvas.width / 2, 18);
    }
}

function drawTiles() {
    for (let ty = 0; ty < camera.height; ty++) {
        for (let tx = 0; tx < camera.width; tx++) {
            const mapX = camera.x + tx;
            const mapY = camera.y + ty;
            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                const tileType = map[mapY][mapX];
                drawTile(tileType, tx, ty);
            }
        }
    }
}

function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTiles();

    if (currentArea === 'village') {
        drawBuildings();
        drawDoors();
        for (const npc of npcs) drawNPC(npc);
    }

    drawPlayer();
    drawInteractPrompt();
    drawDialog();
}

function update() {
    handleInput();
    updatePlayer();
    checkAreaTransitions();
    updateHUD(); // Constantly sync bars & loc tag
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

enterInterior('home');
loop();
