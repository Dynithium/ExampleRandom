const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
let MAP_WIDTH = 25;
let MAP_HEIGHT = 20;
const MOVE_SPEED = 4;

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
    locationNameEl.textContent = currentArea === 'village' ? 'Elderville Village' : interiors[currentInterior].name;
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
        color: '#4a90d9',
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
        color: '#8b7355',
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
        color: '#73558b',
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
        }
    }
}

function updatePlayer() {
    if (!player.isMoving) return;

    if (player.x < player.targetX) player.x += MOVE_SPEED;
    else if (player.x > player.targetX) player.x -= MOVE_SPEED;

    if (player.y < player.targetY) player.y += MOVE_SPEED;
    else if (player.y > player.targetY) player.y -= MOVE_SPEED;

    if (player.x === player.targetX && player.y === player.targetY) {
        player.isMoving = false;
        updateCamera();
    }
}

function drawTile(tileType, tileX, tileY) {
    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    const screenX = tileX * TILE_SIZE;
    const screenY = tileY * TILE_SIZE;

    switch (tileType) {
        case 0: // Grass - mottled with per-tile variation
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            const gv = (tileX * 7 + tileY * 13) % 4;
            // Mottled patches
            ctx.fillStyle = '#265018';
            ctx.fillRect(screenX + ((gv + 1) % 4) * 8, screenY + (gv * 3 % 4) * 8, 8, 8);
            ctx.fillStyle = '#356b22';
            ctx.fillRect(screenX + ((gv + 3) % 4) * 8, screenY + ((gv + 1) % 4) * 8, 6, 6);
            // Grass blades
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(screenX + 2, screenY + 4, 2, 6);
            ctx.fillRect(screenX + 8, screenY + 2, 2, 8);
            ctx.fillRect(screenX + 14, screenY + 5, 2, 5);
            ctx.fillRect(screenX + 20, screenY + 3, 2, 7);
            ctx.fillRect(screenX + 26, screenY + 6, 2, 5);
            // Blade highlights
            ctx.fillStyle = '#4a9440';
            ctx.fillRect(screenX + 3, screenY + 5, 1, 4);
            ctx.fillRect(screenX + 15, screenY + 6, 1, 3);
            ctx.fillRect(screenX + 21, screenY + 4, 1, 5);
            // Small flowers (position varies by tile)
            const gfx = [6, 22, 12, 26][gv];
            const gfy = [18, 22, 10, 14][gv];
            ctx.fillStyle = gv % 2 ? '#ff6b9d' : '#ffd93d';
            ctx.fillRect(screenX + gfx, screenY + gfy, 2, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(screenX + gfx, screenY + gfy, 1, 1);
            break;
        case 1: // Tree - layered pine with grass base
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grass base around trunk
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(screenX + 4, screenY + 24, 24, 6);
            ctx.fillRect(screenX + 8, screenY + 26, 16, 4);
            // Trunk
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 13, screenY + 20, 6, 10);
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 13, screenY + 20, 2, 10);
            // Tree layers
            ctx.fillStyle = '#1e4d2b';
            ctx.beginPath();
            ctx.moveTo(screenX + 16, screenY + 3);
            ctx.lineTo(screenX + 28, screenY + 18);
            ctx.lineTo(screenX + 4, screenY + 18);
            ctx.fill();
            ctx.fillStyle = '#2a6b3a';
            ctx.beginPath();
            ctx.moveTo(screenX + 16, screenY + 8);
            ctx.lineTo(screenX + 24, screenY + 16);
            ctx.lineTo(screenX + 8, screenY + 16);
            ctx.fill();
            ctx.fillStyle = '#1e4d2b';
            ctx.beginPath();
            ctx.moveTo(screenX + 16, screenY + 11);
            ctx.lineTo(screenX + 20, screenY + 15);
            ctx.lineTo(screenX + 12, screenY + 15);
            ctx.fill();
            // Highlights
            ctx.fillStyle = '#3d8f4d';
            ctx.fillRect(screenX + 14, screenY + 8, 3, 2);
            ctx.fillRect(screenX + 17, screenY + 11, 2, 2);
            ctx.fillRect(screenX + 13, screenY + 14, 3, 2);
            break;
        case 2: // Path - Cobblestone with light/dark stone variation
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Cobblestone pattern
            ctx.fillStyle = '#a08060';
            ctx.fillRect(screenX + 2, screenY + 2, 6, 5);
            ctx.fillRect(screenX + 10, screenY + 2, 8, 6);
            ctx.fillRect(screenX + 20, screenY + 2, 6, 5);
            ctx.fillRect(screenX + 2, screenY + 9, 7, 6);
            ctx.fillRect(screenX + 11, screenY + 10, 6, 5);
            ctx.fillRect(screenX + 19, screenY + 9, 8, 6);
            ctx.fillRect(screenX + 2, screenY + 17, 8, 6);
            ctx.fillRect(screenX + 12, screenY + 17, 6, 5);
            ctx.fillRect(screenX + 20, screenY + 17, 7, 6);
            // Stone highlights
            ctx.fillStyle = '#b89a78';
            ctx.fillRect(screenX + 3, screenY + 3, 4, 2);
            ctx.fillRect(screenX + 12, screenY + 3, 4, 2);
            ctx.fillRect(screenX + 3, screenY + 18, 4, 2);
            ctx.fillRect(screenX + 21, screenY + 18, 4, 2);
            // Mortar lines
            ctx.fillStyle = '#6b5344';
            ctx.fillRect(screenX + 8, screenY + 2, 2, 5);
            ctx.fillRect(screenX + 18, screenY + 2, 2, 5);
            ctx.fillRect(screenX + 9, screenY + 9, 2, 6);
            ctx.fillRect(screenX + 17, screenY + 10, 2, 5);
            break;
        case 3: // Council (Blue House) - drawn as a full building pass
        case 4: // Home (Red House)
        case 20: // Homestead
            // The building itself is drawn in drawBuildings(); tiles just ground it
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case 5: // Water - Animated waves with depth
            ctx.fillStyle = '#1e4a5c';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Depth shading
            ctx.fillStyle = '#183b4a';
            ctx.fillRect(screenX, screenY + 24, TILE_SIZE, 8);
            // Wave highlights
            ctx.fillStyle = '#3d7a9c';
            const waveOffset = Math.floor(Date.now() / 200) % 4;
            ctx.fillRect(screenX + 2 + waveOffset * 2, screenY + 6, 8, 2);
            ctx.fillRect(screenX + 12 + waveOffset * 2, screenY + 12, 8, 2);
            ctx.fillRect(screenX + 4 + waveOffset * 2, screenY + 18, 8, 2);
            ctx.fillRect(screenX + 18 + waveOffset * 2, screenY + 8, 6, 2);
            ctx.fillRect(screenX + 8 + waveOffset * 2, screenY + 22, 6, 2);
            // Sparkles
            ctx.fillStyle = '#5a9cc0';
            ctx.fillRect(screenX + 4 + waveOffset * 2, screenY + 6, 3, 1);
            ctx.fillRect(screenX + 20 + waveOffset * 2, screenY + 12, 2, 1);
            break;
        case 10: // Grand Gardens - crop rows on dirt
            ctx.fillStyle = '#5c4326';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#4a3620';
            ctx.fillRect(screenX, screenY + 15, TILE_SIZE, 2);
            // Crop rows
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(screenX + 3, screenY + 4, 3, 11);
            ctx.fillRect(screenX + 12, screenY + 4, 3, 11);
            ctx.fillRect(screenX + 21, screenY + 4, 3, 11);
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX + 3, screenY + 4, 1, 4);
            ctx.fillRect(screenX + 12, screenY + 4, 1, 4);
            ctx.fillRect(screenX + 21, screenY + 4, 1, 4);
            break;
        case 11: // Central Well
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Stone rim
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(screenX + 6, screenY + 14, 20, 14);
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(screenX + 6, screenY + 14, 20, 3);
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(screenX + 6, screenY + 24, 20, 4);
            // Dark water
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(screenX + 9, screenY + 17, 14, 7);
            // Posts and roof
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 8, screenY + 2, 3, 12);
            ctx.fillRect(screenX + 21, screenY + 2, 3, 12);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(screenX + 4, screenY, 24, 4);
            // Bucket
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(screenX + 14, screenY + 8, 4, 5);
            break;
        case 12: // The Forge
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Chimney
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(screenX + 20, screenY + 6, 8, 10);
            ctx.fillStyle = '#8a5a2a';
            ctx.fillRect(screenX + 20, screenY + 8, 8, 2);
            // Stone base
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(screenX + 4, screenY + 16, 24, 14);
            ctx.fillStyle = '#6e6e6e';
            ctx.fillRect(screenX + 4, screenY + 16, 24, 2);
            // Fire opening
            ctx.fillStyle = '#2a0f0f';
            ctx.fillRect(screenX + 8, screenY + 20, 16, 8);
            ctx.fillStyle = '#ff8c2a';
            ctx.fillRect(screenX + 10, screenY + 22, 12, 4);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(screenX + 12, screenY + 24, 8, 2);
            // Anvil
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(screenX + 2, screenY + 20, 5, 8);
            ctx.fillStyle = '#555';
            ctx.fillRect(screenX + 1, screenY + 18, 7, 3);
            break;
        case 13: // Market stall
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Counter
            ctx.fillStyle = '#6b4a2f';
            ctx.fillRect(screenX + 2, screenY + 18, 28, 10);
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX + 2, screenY + 18, 28, 2);
            // Goods
            ctx.fillStyle = '#ff6b9d';
            ctx.fillRect(screenX + 6, screenY + 14, 4, 4);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(screenX + 12, screenY + 14, 4, 4);
            ctx.fillStyle = '#7cc86b';
            ctx.fillRect(screenX + 18, screenY + 14, 4, 4);
            // Awning
            ctx.fillStyle = '#c93838';
            ctx.fillRect(screenX + 2, screenY + 4, 28, 8);
            ctx.fillStyle = '#e05656';
            ctx.fillRect(screenX + 2, screenY + 4, 28, 2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(screenX + 2, screenY + 10, 28, 2);
            break;
        case 14: // Watchtower
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Lookout platform
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 6, screenY, 20, 3);
            // Tower base
            ctx.fillStyle = '#8a6a44';
            ctx.fillRect(screenX + 8, screenY + 14, 16, 16);
            ctx.fillStyle = '#9a7a54';
            ctx.fillRect(screenX + 8, screenY + 14, 16, 2);
            // Ladder
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 9, screenY + 2, 2, 12);
            ctx.fillRect(screenX + 21, screenY + 2, 2, 12);
            ctx.fillStyle = '#6e4f3e';
            for (let r = 2; r <= 12; r += 3) {
                ctx.fillRect(screenX + 9, screenY + r, 14, 2);
            }
            break;
        case 15: // Village door - drawn in drawDoors() after buildings
            break;
        case 16: // Exit mat (interior door)
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Door frame
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
            ctx.fillRect(screenX + 30, screenY, 2, TILE_SIZE);
            // Mat
            ctx.fillStyle = '#3d2b1e';
            ctx.fillRect(screenX + 5, screenY + 12, 22, 16);
            ctx.fillStyle = '#5a3f2a';
            ctx.fillRect(screenX + 7, screenY + 14, 18, 12);
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 9, screenY + 16, 14, 2);
            ctx.fillRect(screenX + 9, screenY + 21, 14, 2);
            break;
        case 17: // Table
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#8a6a44';
            ctx.fillRect(screenX + 4, screenY + 12, 24, 6);
            ctx.fillStyle = '#9a7a54';
            ctx.fillRect(screenX + 4, screenY + 12, 24, 2);
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 6, screenY + 18, 3, 12);
            ctx.fillRect(screenX + 23, screenY + 18, 3, 12);
            break;
        case 18: // Chair
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#8a6a44';
            ctx.fillRect(screenX + 8, screenY + 18, 16, 6);
            ctx.fillStyle = '#6b4a2f';
            ctx.fillRect(screenX + 8, screenY + 8, 4, 10);
            ctx.fillRect(screenX + 20, screenY + 8, 4, 10);
            ctx.fillRect(screenX + 8, screenY + 8, 16, 2);
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 9, screenY + 24, 2, 6);
            ctx.fillRect(screenX + 21, screenY + 24, 2, 6);
            break;
        case 19: // Bookshelf
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 4, screenY + 2, 24, 28);
            ctx.fillStyle = '#6e4f3e';
            ctx.fillRect(screenX + 4, screenY + 2, 24, 2);
            const bookColors = ['#c93838', '#4a6fa5', '#7cc86b', '#ffd93d', '#8b7355'];
            for (let row = 0; row < 3; row++) {
                const by = screenY + 5 + row * 8;
                ctx.fillStyle = '#5c4033';
                ctx.fillRect(screenX + 6, by, 20, 6);
                for (let b = 0; b < 4; b++) {
                    ctx.fillStyle = bookColors[(b + row) % bookColors.length];
                    ctx.fillRect(screenX + 7 + b * 5, by + 1, 4, 5);
                }
            }
            break;
        case 6: // Wooden floor
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Plank seams
            ctx.fillStyle = '#6b4a2f';
            ctx.fillRect(screenX, screenY + 15, TILE_SIZE, 2);
            ctx.fillRect(screenX + 15, screenY, 2, 15);
            ctx.fillRect(screenX + 30, screenY + 16, 2, 16);
            // Wood grain
            ctx.fillStyle = '#8a6a44';
            ctx.fillRect(screenX + 4, screenY + 4, 6, 2);
            ctx.fillRect(screenX + 20, screenY + 20, 6, 2);
            break;
        case 7: // Wooden wall
            ctx.fillStyle = '#6b4a2f';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Top trim and baseboard
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX + 2, screenY + 2, 28, 2);
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX, screenY + 26, TILE_SIZE, 6);
            // Vertical panel lines
            ctx.fillStyle = '#5c3d26';
            ctx.fillRect(screenX + 7, screenY + 4, 1, 22);
            ctx.fillRect(screenX + 15, screenY + 4, 1, 22);
            ctx.fillRect(screenX + 23, screenY + 4, 1, 22);
            break;
        case 8: // Bed
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Headboard
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 2, screenY + 2, 28, 5);
            // Frame
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 2, screenY + 6, 28, 24);
            // Blanket
            ctx.fillStyle = '#a0503a';
            ctx.fillRect(screenX + 4, screenY + 8, 24, 18);
            ctx.fillStyle = '#b5653f';
            ctx.fillRect(screenX + 4, screenY + 18, 24, 8);
            // Pillow
            ctx.fillStyle = '#f0ead6';
            ctx.fillRect(screenX + 5, screenY + 9, 10, 6);
            break;
        case 9: // Father's sword in a glass case (2 tiles tall)
            ctx.fillStyle = '#7a5c3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            const caseTop = map[tileY - 1] && map[tileY - 1][tileX] === 9;
            const caseBelow = map[tileY + 1] && map[tileY + 1][tileX] === 9;
            // Glass box spans both tiles
            const glassY = caseTop ? screenY - 28 : screenY + 4;
            ctx.fillStyle = 'rgba(180, 220, 255, 0.12)';
            ctx.fillRect(screenX + 3, glassY, 26, 56);
            ctx.strokeStyle = 'rgba(210, 235, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 3, glassY, 26, 56);
            // Pedestal (drawn on the bottom tile)
            if (caseTop) {
                ctx.fillStyle = '#5c4033';
                ctx.fillRect(screenX + 6, screenY + 22, 20, 3);
                ctx.fillStyle = '#4a3020';
                ctx.fillRect(screenX + 4, screenY + 25, 24, 6);
            }
            // Sword (drawn on the top tile, spans downward)
            if (caseBelow) {
                ctx.fillStyle = '#d7dde3';
                ctx.fillRect(screenX + 14, screenY + 8, 4, 42);
                ctx.beginPath();
                ctx.moveTo(screenX + 14, screenY + 8);
                ctx.lineTo(screenX + 18, screenY + 8);
                ctx.lineTo(screenX + 16, screenY + 12);
                ctx.fill();
                ctx.fillStyle = '#b08d3a';
                ctx.fillRect(screenX + 12, screenY + 48, 8, 3);
                ctx.fillStyle = '#4a3020';
                ctx.fillRect(screenX + 14, screenY + 51, 4, 8);
            }
            break;
    }
}

function drawPlayer() {
    const screenX = player.x - (camera.x * TILE_SIZE);
    const screenY = player.y - (camera.y * TILE_SIZE);

    // Animation bobbing when moving
    let bobOffset = 0;
    if (player.isMoving) {
        player.animFrame = (player.animFrame + 1) % 8;
        bobOffset = Math.sin(player.animFrame * Math.PI / 4) * 2;
    }

    const px = screenX;
    const py = screenY + bobOffset;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 31, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.facing === 'down') drawPlayerDown(px, py);
    else if (player.facing === 'up') drawPlayerUp(px, py);
    else if (player.facing === 'left') drawPlayerSide(px, py, -1);
    else drawPlayerSide(px, py, 1);
}

function drawPlayerDown(px, py) {
    // Sword sheathed on back (behind everything)
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + 22, py + 12, 3, 16);
    ctx.fillStyle = '#2f1f12';
    ctx.fillRect(px + 24, py + 12, 1, 16);
    ctx.fillStyle = '#c8a23a';
    ctx.fillRect(px + 21, py + 11, 5, 2);
    ctx.fillStyle = '#d7dde3';
    ctx.fillRect(px + 22, py + 28, 3, 2);

    // Shoulders
    ctx.fillStyle = '#b53030';
    ctx.fillRect(px + 6, py + 14, 20, 4);
    ctx.fillStyle = '#e05656';
    ctx.fillRect(px + 6, py + 14, 20, 1);
    ctx.fillStyle = '#8f2323';
    ctx.fillRect(px + 6, py + 17, 20, 1);

    // Arms
    ctx.fillStyle = '#c93838';
    ctx.fillRect(px + 5, py + 16, 4, 7);
    ctx.fillRect(px + 23, py + 16, 4, 7);
    ctx.fillStyle = '#e05656';
    ctx.fillRect(px + 5, py + 16, 1, 6);
    ctx.fillRect(px + 26, py + 16, 1, 6);
    // Gloved hands
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(px + 5, py + 23, 4, 3);
    ctx.fillRect(px + 23, py + 23, 4, 3);

    // Torso
    ctx.fillStyle = '#c93838';
    ctx.fillRect(px + 8, py + 18, 16, 8);
    // Chest plate
    ctx.fillStyle = '#d04040';
    ctx.fillRect(px + 9, py + 18, 14, 3);
    // Center seam
    ctx.fillStyle = '#7a1f1f';
    ctx.fillRect(px + 15, py + 21, 2, 6);
    // Life-suit breather tube
    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(px + 8, py + 20, 2, 5);
    ctx.fillStyle = '#3aa8ff';
    ctx.fillRect(px + 8, py + 21, 1, 3);
    ctx.fillStyle = '#7cc8ff';
    ctx.fillRect(px + 8, py + 21, 1, 1);

    // Belt
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(px + 7, py + 25, 18, 3);
    ctx.fillStyle = '#555';
    ctx.fillRect(px + 7, py + 25, 18, 1);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(px + 14, py + 25, 4, 3);

    // Legs
    ctx.fillStyle = '#8f2b2b';
    ctx.fillRect(px + 9, py + 28, 6, 2);
    ctx.fillRect(px + 17, py + 28, 6, 2);
    // Boots
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(px + 8, py + 30, 7, 2);
    ctx.fillRect(px + 17, py + 30, 7, 2);

    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(px + 13, py + 12, 6, 2);
    // Face
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(px + 10, py + 4, 12, 10);
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(px + 10, py + 13, 12, 1);
    // Hair
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(px + 9, py + 2, 14, 4);
    ctx.fillRect(px + 9, py + 4, 2, 6);
    ctx.fillRect(px + 21, py + 4, 2, 6);
    ctx.fillRect(px + 11, py + 5, 2, 3);
    ctx.fillRect(px + 16, py + 5, 2, 3);
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(px + 9, py + 2, 14, 1);
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 12, py + 8, 3, 3);
    ctx.fillRect(px + 18, py + 8, 3, 3);
    ctx.fillStyle = '#222';
    ctx.fillRect(px + 13, py + 9, 2, 2);
    ctx.fillRect(px + 19, py + 9, 2, 2);
    // Mouth
    ctx.fillStyle = '#c08a68';
    ctx.fillRect(px + 15, py + 12, 2, 1);
}

function drawPlayerUp(px, py) {
    // Sword sheathed on back
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(px + 22, py + 12, 3, 16);
    ctx.fillStyle = '#c8a23a';
    ctx.fillRect(px + 21, py + 11, 5, 2);
    ctx.fillStyle = '#d7dde3';
    ctx.fillRect(px + 22, py + 28, 3, 2);

    // Shoulders
    ctx.fillStyle = '#b53030';
    ctx.fillRect(px + 6, py + 14, 20, 4);
    ctx.fillStyle = '#8f2323';
    ctx.fillRect(px + 6, py + 17, 20, 1);

    // Arms
    ctx.fillStyle = '#c93838';
    ctx.fillRect(px + 5, py + 16, 4, 7);
    ctx.fillRect(px + 23, py + 16, 4, 7);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(px + 5, py + 23, 4, 3);
    ctx.fillRect(px + 23, py + 23, 4, 3);

    // Torso
    ctx.fillStyle = '#c93838';
    ctx.fillRect(px + 8, py + 18, 16, 8);
    ctx.fillStyle = '#b53030';
    ctx.fillRect(px + 8, py + 18, 16, 1);
    // Life-suit back unit
    ctx.fillStyle = '#a02828';
    ctx.fillRect(px + 10, py + 18, 12, 6);
    ctx.fillStyle = '#3aa8ff';
    ctx.fillRect(px + 14, py + 19, 2, 2);
    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(px + 13, py + 22, 6, 2);

    // Belt
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(px + 7, py + 25, 18, 3);
    ctx.fillStyle = '#555';
    ctx.fillRect(px + 7, py + 25, 18, 1);

    // Legs
    ctx.fillStyle = '#8f2b2b';
    ctx.fillRect(px + 9, py + 28, 6, 2);
    ctx.fillRect(px + 17, py + 28, 6, 2);
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(px + 8, py + 30, 7, 2);
    ctx.fillRect(px + 17, py + 30, 7, 2);

    // Back of head
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(px + 10, py + 3, 12, 11);
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(px + 10, py + 3, 12, 2);
    ctx.fillRect(px + 10, py + 11, 12, 2);
}

function drawPlayerSide(px, py, f) {
    // Sword sheathed on the back (opposite side of the face)
    const sx = f === 1 ? px + 7 : px + 22;
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(sx, py + 13, 3, 14);
    ctx.fillStyle = '#c8a23a';
    ctx.fillRect(sx - 1, py + 12, 5, 2);
    ctx.fillStyle = '#d7dde3';
    ctx.fillRect(sx, py + 27, 3, 1);

    // Shoulders
    ctx.fillStyle = '#b53030';
    ctx.fillRect(px + 5, py + 14, 22, 4);
    ctx.fillStyle = '#e05656';
    ctx.fillRect(px + 5, py + 14, 22, 1);

    // Arms (back arm darker, front arm lighter)
    ctx.fillStyle = '#a02828';
    ctx.fillRect(f === 1 ? px + 6 : px + 23, py + 16, 4, 7);
    ctx.fillStyle = '#c93838';
    ctx.fillRect(f === 1 ? px + 22 : px + 6, py + 16, 4, 7);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(f === 1 ? px + 22 : px + 6, py + 23, 4, 3);

    // Torso
    ctx.fillStyle = '#c93838';
    ctx.fillRect(px + 7, py + 18, 18, 8);
    ctx.fillStyle = '#b53030';
    ctx.fillRect(px + 7, py + 18, 18, 1);
    ctx.fillStyle = '#7a1f1f';
    ctx.fillRect(px + 12, py + 20, 2, 6);

    // Belt
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(px + 6, py + 25, 20, 3);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(px + 13, py + 25, 4, 3);

    // Legs
    ctx.fillStyle = '#8f2b2b';
    ctx.fillRect(px + 9, py + 28, 6, 2);
    ctx.fillRect(px + 17, py + 28, 6, 2);
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(px + 8, py + 30, 7, 2);
    ctx.fillRect(px + 17, py + 30, 7, 2);

    // Neck
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(px + 13, py + 12, 6, 2);
    // Face
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(px + 10, py + 4, 12, 10);
    ctx.fillStyle = '#e8b890';
    ctx.fillRect(px + 10, py + 13, 12, 1);
    // Hair
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(px + 8, py + 2, 16, 4);
    ctx.fillRect(px + 8, py + 4, 3, 9);
    ctx.fillRect(px + 21, py + 4, 3, 9);
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(px + 8, py + 2, 16, 1);
    // Eye (facing side)
    ctx.fillStyle = '#fff';
    ctx.fillRect(f === 1 ? px + 18 : px + 11, py + 8, 3, 3);
    ctx.fillStyle = '#222';
    ctx.fillRect(f === 1 ? px + 19 : px + 12, py + 9, 2, 2);
    // Mouth
    ctx.fillStyle = '#c08a68';
    ctx.fillRect(f === 1 ? px + 17 : px + 14, py + 12, 2, 1);
}

function drawNPC(npc) {
    const screenX = npc.tileX * TILE_SIZE - (camera.x * TILE_SIZE);
    const screenY = npc.tileY * TILE_SIZE - (camera.y * TILE_SIZE);

    // Only draw if visible
    if (screenX < -TILE_SIZE || screenX > canvas.width || screenY < -TILE_SIZE || screenY > canvas.height) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 31, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const isElder = npc.id.includes('elder');
    const dark = adjustColor(npc.color, -40);
    const light = adjustColor(npc.color, 25);

    // Robe
    ctx.fillStyle = npc.color;
    ctx.fillRect(screenX + 7, screenY + 14, 18, 17);
    ctx.fillStyle = light;
    ctx.fillRect(screenX + 7, screenY + 14, 18, 1);
    ctx.fillRect(screenX + 9, screenY + 15, 2, 14);
    // Robe folds
    ctx.fillStyle = dark;
    ctx.fillRect(screenX + 12, screenY + 15, 1, 15);
    ctx.fillRect(screenX + 18, screenY + 15, 1, 15);
    ctx.fillRect(screenX + 23, screenY + 15, 1, 15);
    // Hem
    ctx.fillStyle = dark;
    ctx.fillRect(screenX + 7, screenY + 28, 18, 3);

    // Collar trim for elders
    if (isElder) {
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX + 9, screenY + 14, 14, 2);
    }

    // Head
    ctx.fillStyle = '#e8c4a0';
    ctx.fillRect(screenX + 10, screenY + 4, 12, 10);
    ctx.fillStyle = '#d8b090';
    ctx.fillRect(screenX + 10, screenY + 12, 12, 2);

    if (isElder) {
        // Bald crown, gray side hair, beard
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX + 9, screenY + 3, 14, 3);
        ctx.fillRect(screenX + 8, screenY + 4, 2, 7);
        ctx.fillRect(screenX + 22, screenY + 4, 2, 7);
        ctx.fillRect(screenX + 10, screenY + 11, 12, 3);
        ctx.fillRect(screenX + 11, screenY + 13, 4, 3);
        ctx.fillRect(screenX + 17, screenY + 13, 4, 3);
        // Eyes + stern brows
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + 12, screenY + 8, 2, 2);
        ctx.fillRect(screenX + 18, screenY + 8, 2, 2);
        ctx.fillStyle = '#9a9a9a';
        ctx.fillRect(screenX + 11, screenY + 6, 4, 1);
        ctx.fillRect(screenX + 17, screenY + 6, 4, 1);
    } else {
        // Tinslaire: messy young hair
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(screenX + 9, screenY + 2, 14, 4);
        ctx.fillRect(screenX + 9, screenY + 4, 2, 6);
        ctx.fillRect(screenX + 21, screenY + 4, 2, 6);
        // Eyes + smile
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX + 12, screenY + 8, 2, 2);
        ctx.fillRect(screenX + 18, screenY + 8, 2, 2);
        ctx.fillStyle = '#b08060';
        ctx.fillRect(screenX + 15, screenY + 12, 2, 1);
    }

    // Name plate
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(screenX + 6, screenY - 8, 20, 9);
    ctx.fillStyle = '#ffd93d';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, screenX + 16, screenY - 1);
}

function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

function drawDialog() {
    if (!currentDialog) return;

    // Dialog box background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(40, canvas.height - 70, canvas.width - 80, 60);
    
    // Border
    ctx.strokeStyle = '#6a8faf';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, canvas.height - 70, canvas.width - 80, 60);

    // Speaker name
    ctx.fillStyle = '#ffd93d';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentDialog.name + ':', 50, canvas.height - 52);

    // Dialog text
    ctx.fillStyle = '#eee';
    ctx.font = '11px monospace';
    const text = currentDialog.dialog[dialogIndex];
    
    // Word wrap
    const words = text.split(' ');
    let line = '';
    let lines = [];
    const maxWidth = canvas.width - 100;
    
    for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw lines
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 50, canvas.height - 38 + (i * 14));
    }

    // Continue indicator
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('[Press E to continue]', canvas.width - 140, canvas.height - 18);
}

function drawInteractPrompt() {
    if (currentDialog || player.isMoving) return;

    let label = null;
    if (currentArea === 'interior') {
        if (nearSwordCase()) label = '[E] Inspect';
    } else if (getNearbyNPC()) {
        label = '[E] Talk';
    }

    if (label) {
        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, 20);
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

// Buildings are 5x5 tiles on the outside, but their interiors are 15x10.
// Each building is drawn as one unit from its root tile so it can be seen
// even when the camera only shows part of it.
function drawBuilding(screenX, screenY, type) {
    const c = {
        3: { wall: '#4a6fa5', wallDark: '#3d5c8a', roof: '#8b4513', roofLight: '#a05a1e' },
        4: { wall: '#a54a4a', wallDark: '#8a3a3a', roof: '#6b2323', roofLight: '#843030' },
        20: { wall: '#c0a078', wallDark: '#a58560', roof: '#5c6b2a', roofLight: '#6e7d36' }
    }[type];

    const bw = 5 * TILE_SIZE;
    const bh = 5 * TILE_SIZE;

    // Grass base
    ctx.fillStyle = '#2d5a1e';
    ctx.fillRect(screenX, screenY, bw, bh);

    // Walls
    ctx.fillStyle = c.wall;
    ctx.fillRect(screenX, screenY + 96, bw, bh - 96);
    // Wall shading and trim
    ctx.fillStyle = c.wallDark;
    ctx.fillRect(screenX, screenY + 96, bw, 3);
    ctx.fillRect(screenX, screenY + bh - 16, bw, 8);
    // Foundation
    ctx.fillStyle = '#6b5344';
    ctx.fillRect(screenX, screenY + bh - 10, bw, 10);

    // Roof
    ctx.fillStyle = c.roof;
    ctx.beginPath();
    ctx.moveTo(screenX + 4, screenY + 96);
    ctx.lineTo(screenX + bw / 2, screenY + 30);
    ctx.lineTo(screenX + bw - 4, screenY + 96);
    ctx.fill();
    ctx.fillStyle = c.roofLight;
    ctx.beginPath();
    ctx.moveTo(screenX + bw / 2 - 40, screenY + 82);
    ctx.lineTo(screenX + bw / 2, screenY + 42);
    ctx.lineTo(screenX + bw / 2 + 40, screenY + 82);
    ctx.fill();

    // Chimney
    ctx.fillStyle = '#7a5c4a';
    ctx.fillRect(screenX + bw - 66, screenY + 46, 18, 28);
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(screenX + bw - 66, screenY + 46, 18, 5);

    // Windows
    for (let i = 0; i < 2; i++) {
        const wx = screenX + 22 + i * 82;
        const wy = screenY + 112;
        ctx.fillStyle = type === 4 ? '#ffd93d' : '#87ceeb';
        ctx.fillRect(wx, wy, 34, 26);
        ctx.fillStyle = '#bde3ff';
        ctx.fillRect(wx, wy, 34, 3);
        ctx.fillStyle = c.wallDark;
        ctx.fillRect(wx + 15, wy, 3, 26);
        ctx.fillRect(wx, wy + 11, 34, 3);
    }
}

function drawBuildings() {
    for (let ty = 0; ty < MAP_HEIGHT; ty++) {
        for (let tx = 0; tx < MAP_WIDTH; tx++) {
            const t = map[ty][tx];
            if (t !== 3 && t !== 4 && t !== 20) continue;
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
    // Open doorway over the building wall
    ctx.fillStyle = '#1a120c';
    ctx.fillRect(screenX + 5, screenY + 4, 22, 26);
    ctx.fillStyle = '#2a1d14';
    ctx.fillRect(screenX + 7, screenY + 6, 18, 22);
    // Threshold
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(screenX + 2, screenY + 29, 28, 3);
}

function drawDoors() {
    for (const d of villageDoors) {
        const sx = d.tx * TILE_SIZE - camera.x * TILE_SIZE;
        const sy = d.ty * TILE_SIZE - camera.y * TILE_SIZE;
        if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;
        drawDoor(sx, sy);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTiles();

    // Buildings, doors, and NPCs only exist in the village
    if (currentArea === 'village') {
        drawBuildings();
        drawDoors();
        for (const npc of npcs) {
            drawNPC(npc);
        }
    }

    // Draw player
    drawPlayer();

    // Draw interact prompt
    drawInteractPrompt();

    // Draw dialog (on top of everything)
    drawDialog();
}

function update() {
    handleInput();
    updatePlayer();
    checkAreaTransitions();
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

enterInterior('home');
loop();
