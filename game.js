const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// GBA-style crisp pixels (no smoothing, integer coords only)
ctx.imageSmoothingEnabled = false;

const TILE_SIZE = 32; // 16px GBA tile at 2x (canvas is 2x GBA 240x160)
let MAP_WIDTH = 25;
let MAP_HEIGHT = 20;
const MOVE_SPEED = 4;

// ------------------------------------------------------------------
// Game Boy Advance / Pokémon FireRed palette (limited, warm, soft)
// ------------------------------------------------------------------
const P = {
    // Outdoors
    grass:      '#48a028',
    grassDark:  '#308018',
    grassLight: '#68c040',
    grassDeep:  '#206010',
    path:       '#e0c878',
    pathDark:   '#c8a858',
    pathLight:  '#f0d890',
    pathEdge:   '#b09048',
    water:      '#3890c8',
    waterDark:  '#2870a8',
    waterDeep:  '#185888',
    waterLight: '#68b8e0',
    waterFoam:  '#a8d8f0',
    // Trees
    leaf:       '#208028',
    leafDark:   '#106018',
    leafLight:  '#40a038',
    trunk:      '#906030',
    trunkDark:  '#684020',
    // Buildings
    roofRed:    '#c04038',
    roofRedD:   '#902828',
    roofRedL:   '#e05848',
    roofBlue:   '#4068a8',
    roofBlueD:  '#284888',
    roofBlueL:  '#5888c0',
    roofGreen:  '#508028',
    roofGreenD: '#386018',
    wallBlue:   '#6890c0',
    wallBlueD:  '#4870a0',
    wallBlueL:  '#88b0d8',
    wallRed:    '#d07060',
    wallRedD:   '#a85048',
    wallRedL:   '#e89080',
    wallTan:    '#d0b078',
    wallTanD:   '#b09058',
    wallTanL:   '#e8c898',
    found:      '#887868',
    foundD:     '#685848',
    window:     '#f8e060',
    windowBlue: '#90d0f0',
    door:       '#402818',
    doorL:      '#604028',
    // Interiors
    floor:      '#c89858',
    floorD:     '#a87840',
    floorL:     '#d8b070',
    wallIn:     '#a07048',
    wallInD:    '#805830',
    wallInL:    '#b88858',
    // Furniture / props
    wood:       '#906848',
    woodD:      '#684830',
    woodL:      '#b08860',
    bed:        '#c05050',
    bedL:       '#e07068',
    pillow:     '#f0e8d0',
    metal:      '#a0a8b0',
    metalD:     '#687078',
    metalL:     '#c8d0d8',
    fire:       '#f87828',
    fireL:      '#f8d038',
    crop:       '#48a028',
    cropD:      '#287018',
    dirt:       '#a87840',
    dirtD:      '#886030',
    // Characters
    outline:    '#201810',
    skin:       '#f0c090',
    skinD:      '#d0a070',
    hair:       '#503828',
    hairD:      '#302018',
    hairL:      '#705040',
    hairGray:   '#c0c0c0',
    red:        '#d03838',
    redD:       '#982828',
    redL:       '#e86058',
    suit:       '#282830',
    suitL:      '#404048',
    glow:       '#48a0f0',
    glowL:      '#98d0f8',
    pants:      '#703040',
    pantsD:     '#502028',
    boot:       '#282020',
    bootL:      '#484038',
    gold:       '#e8b040',
    // UI (Pokémon-style dialog)
    uiWhite:    '#f8f8f0',
    uiCream:    '#f0e8c8',
    uiBlue:     '#4868a0',
    uiBlueD:    '#203868',
    uiBlack:    '#181818',
    uiText:     '#181818',
    uiName:     '#2868c0',
    uiHint:     '#687888',
    shadow:     '#183010'
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

// ------------------------------------------------------------------
// Story state — Scenes 1, 1.5, 2 (The Hum / Memory / Elders at Door)
// ------------------------------------------------------------------
let openingBlack = true; // Scene 1: black screen + hum, press E to wake
let memoryDone = false;
let tinslaireInsideTalked = false;
let eldersAtDoorReady = false;
let eldersDoorDialogDone = false;

const fatherMemoryLines = [
    "Everything and everyone has a purpose, which reflects their maker.",
    "Like this blade. It was made by me. It's designed for fighting — that's what it's for. But look.",
    "It has a sheath. And that sheath is made to show that it is not time for battle.",
    "I fear that one day, calamities might befall you. And it might just be... time for war."
];
const fatherMemorySource = { spoken: true, isMemory: true };

// Interior Tinslaire (Scene 1) — lives inside Red House until you talk to him
const tinslaireInside = {
    id: 'tinslaireInside',
    name: 'Tinslaire',
    tileX: 6,
    tileY: 5,
    color: '#4a90d9',
    dialog: [
        "You're up! The elders are at the door. The actual elders! They came to our house!",
        "They've been waiting since sunrise. You should go talk to them.",
        "And... don't forget father's blade. But not yet — they said not yet."
    ],
    repeatDialog: [
        "Go on! The elders are waiting outside!"
    ],
    spoken: false
};

// Elders at door (Scene 2) — spawn around Red House door after talking to Tinslaire inside
// Per MDs: they do NOT send you to the cave immediately — first they must test your character and blade.
const eldersAtDoorNPCs = [
    {
        id: 'elderMossDoor',
        name: 'Elder Moss',
        tileX: 29,
        tileY: 8,
        color: '#8b7355',
        dialog: [
            "Good morning, Minslaire. I'm sorry for the early visit.",
            "We heard sounds from the cave — the old one, just on the outskirts of town, where the forest begins. Something's stirring in there that shouldn't be.",
            "We'd look ourselves, but we're old, and our bones aren't for crawling. You're young, you're quick, you know every path in this village.",
            "But before we ask you to go in there — and we will — we need to know who you are.",
            "The elders test character before blade. Four small trials, to see what kind of person we are sending.",
            "Come to the Blue House when you are ready. Moss will watch the Well, Sage his study, Thorn the widow. And the Bazaar watches honesty."
        ],
        repeatDialog: [
            "We will not send you to the cave untested. Find us at the Blue House — the trials await."
        ],
        spoken: false
    },
    {
        id: 'elderSageDoor',
        name: 'Elder Sage',
        tileX: 31,
        tileY: 8,
        color: '#73558b',
        dialog: null, // decorative, Moss speaks for the group
        spoken: false
    },
    {
        id: 'elderThornDoor',
        name: 'Elder Thorn',
        tileX: 30,
        tileY: 9,
        color: '#6b6b8b',
        dialog: null,
        spoken: false
    }
];

function isDoorElder(npc) {
    return npc.id === 'elderMossDoor' || npc.id === 'elderSageDoor' || npc.id === 'elderThornDoor';
}
function isDoorElderVisible() {
    return eldersAtDoorReady && !eldersDoorDialogDone;
}

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
        // Block exit from Red House until you have talked to Tinslaire inside (Scene 1)
        if (currentInterior === 'home' && !tinslaireInsideTalked) {
            // Nudge player back one tile
            player.tileY -= 1;
            player.targetY = player.tileY * TILE_SIZE;
            player.y = player.targetY;
            player.isMoving = false;
            updateCamera();
            // Prompt to talk to Tinslaire
            if (!currentDialog) {
                currentDialog = {
                    source: { spoken: true },
                    name: 'Tinslaire',
                    dialog: ["Minslaire! Wait — the elders are at the door! Talk to me first!"]
                };
                dialogIndex = 0;
            }
            return;
        }
        exitInterior();
        // If we just left home for the first time and door elders should appear, they will now be visible
        if (currentInterior === 'home' && eldersAtDoorReady && !eldersDoorDialogDone) {
            updateCamera();
        }
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

// NPC data (village) — dialog scrubbed of spoilers per MDs (no Box/Scrap before Cave)
const npcs = [
    {
        id: 'tinslaire',
        name: 'Tinslaire',
        tileX: 30,
        tileY: 10,
        color: '#4a90d9',
        dialog: [
            "Brother! You talked to them, right? What did they say?",
            "Trials first? That sounds like Moss. He always watches.",
            "You'll pass. You always do. Then... the cave."
        ],
        repeatDialog: [
            "Four trials, then the cave. I'll be here."
        ],
        spoken: false,
        isVillageTinslaire: true
    },
    {
        id: 'elder1',
        name: 'Elder Marcus',
        tileX: 8,
        tileY: 9,
        color: '#8b7355',
        dialog: [
            "Ah, Minslaire. You spoke with the council at your door.",
            "Moss speaks of the cave, but Sage and I speak of you. Who you are matters more than what you swing.",
            "We test character before blade. Four small trials, Minslaire. Come find us when you are ready."
        ],
        repeatDialog: [
            "Four trials, then the cave. Find us at the Blue House."
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
            "The old records can wait. First, we watch how you watch.",
            "The Well, the study, the widow's table, the Trader's purse — each sees a different part of you.",
            "Pass them, and we will trust you with steel."
        ],
        repeatDialog: [
            "The trials await. Speak at the Well, the study, the widow, the Bazaar."
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
function isNpcVisible(npc) {
    // Village Tinslaire hidden until door elders dialog done (he stays inside until then)
    if (npc.isVillageTinslaire && !eldersDoorDialogDone) return false;
    return true;
}
function npcOccupied(tileX, tileY) {
    if (currentArea !== 'village') return false;
    // Check regular village NPCs
    for (const npc of npcs) {
        if (!isNpcVisible(npc)) continue;
        if (npc.tileX === tileX && npc.tileY === tileY) return true;
    }
    // Check door elders if visible
    if (isDoorElderVisible()) {
        for (const npc of eldersAtDoorNPCs) {
            if (npc.tileX === tileX && npc.tileY === tileY) return true;
        }
    }
    return false;
}

// Interior NPC blocking
function interiorNpcOccupied(tileX, tileY) {
    if (currentArea !== 'interior' || currentInterior !== 'home') return false;
    // Tinslaire inside blocks his tile while he is in the room
    // After you talk to him and elders are ready, he stays but still blocks (you must walk around)
    // Once you leave, you won't be inside to check
    if (tinslaireInside.tileX === tileX && tinslaireInside.tileY === tileY) return true;
    return false;
}

function getNearbyNPC() {
    // Check door elders first (higher priority when visible)
    if (currentArea === 'village' && isDoorElderVisible()) {
        for (const npc of eldersAtDoorNPCs) {
            if (!npc.dialog) continue; // decorative ones have no dialog
            const dx = Math.abs(player.tileX - npc.tileX);
            const dy = Math.abs(player.tileY - npc.tileY);
            if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
                return npc;
            }
        }
        // Also allow decorative elders to be talked to via Moss?
        // If near a decorative elder but not Moss, still return Moss if within range of any
        for (const npc of eldersAtDoorNPCs) {
            if (npc.dialog) continue;
            const dx = Math.abs(player.tileX - npc.tileX);
            const dy = Math.abs(player.tileY - npc.tileY);
            if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
                // Redirect to Moss
                return eldersAtDoorNPCs[0];
            }
        }
    }
    for (const npc of npcs) {
        if (!isNpcVisible(npc)) continue;
        const dx = Math.abs(player.tileX - npc.tileX);
        const dy = Math.abs(player.tileY - npc.tileY);
        if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
            return npc;
        }
    }
    return null;
}

function getInteriorNearbyNPC() {
    if (currentArea !== 'interior' || currentInterior !== 'home') return null;
    const dx = Math.abs(player.tileX - tinslaireInside.tileX);
    const dy = Math.abs(player.tileY - tinslaireInside.tileY);
    if (dx <= 1 && dy <= 1 && (dx + dy) <= 1) {
        return tinslaireInside;
    }
    return null;
}

// Input state
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;
    
    // Handle interaction — opening black screen has priority
    if ((e.key.toLowerCase() === 'e' || e.key === ' ') && canInteract && !player.isMoving) {
        if (openingBlack) {
            // Wake up — dismiss black, play father's memory
            openingBlack = false;
            currentDialog = {
                source: fatherMemorySource,
                name: 'Father',
                dialog: fatherMemoryLines
            };
            dialogIndex = 0;
            return;
        }
        if (currentDialog) {
            // Advance dialog
            dialogIndex++;
            if (dialogIndex >= currentDialog.dialog.length) {
                const finishedSource = currentDialog.source;
                // Special handling for story flags
                if (finishedSource === fatherMemorySource) {
                    memoryDone = true;
                } else if (finishedSource === tinslaireInside) {
                    tinslaireInsideTalked = true;
                    tinslaireInside.spoken = true;
                    eldersAtDoorReady = true;
                } else if (finishedSource && finishedSource.id === 'elderMossDoor') {
                    finishedSource.spoken = true;
                    eldersDoorDialogDone = true;
                } else if (finishedSource) {
                    finishedSource.spoken = true;
                }
                currentDialog = null;
                dialogIndex = 0;
            }
        } else if (currentArea === 'interior' && currentInterior === 'home') {
            // Check interior Tinslaire first
            const interiorNpc = getInteriorNearbyNPC();
            if (interiorNpc) {
                currentDialog = {
                    source: interiorNpc,
                    name: interiorNpc.name,
                    dialog: interiorNpc.spoken ? (interiorNpc.repeatDialog || ['...']) : interiorNpc.dialog
                };
                dialogIndex = 0;
            } else if (nearSwordCase()) {
                currentDialog = {
                    source: { spoken: true },
                    name: 'Sword Case',
                    dialog: [
                        "Your father's blade...",
                        "Encased in glass the day he and mother vanished.",
                        "It waits for its master. Not yet."
                    ]
                };
                dialogIndex = 0;
            }
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
    if (openingBlack) return;
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

        let blocked = isSolid(nextTileX, nextTileY) || npcOccupied(nextTileX, nextTileY) || interiorNpcOccupied(nextTileX, nextTileY);
        if (!blocked) {
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

// ------------------------------------------------------------------
// Tile drawing — pure fillRect GBA / FireRed style
// ------------------------------------------------------------------

function drawGrassBase(sx, sy, mapX, mapY) {
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.grass);
    const v = tileVar(mapX, mapY, 8);
    // Dark mottles (FireRed ground grass)
    px(sx + (v % 4) * 8, sy + ((v * 3) % 4) * 8, 6, 4, P.grassDark);
    px(sx + ((v + 2) % 4) * 8 + 2, sy + ((v + 1) % 4) * 8 + 2, 4, 4, P.grassDeep);
    // Light speckles
    px(sx + 4 + (v % 3) * 8, sy + 6 + (v % 2) * 10, 2, 2, P.grassLight);
    px(sx + 18 + (v % 2) * 6, sy + 20, 2, 2, P.grassLight);
    px(sx + 10, sy + 14 + (v % 3) * 4, 2, 2, P.grassLight);
    // Occasional flower (very FireRed)
    if (v === 1 || v === 5) {
        const fx = sx + 8 + (v % 3) * 6;
        const fy = sy + 18;
        px(fx, fy, 2, 2, v === 1 ? '#f07090' : '#f0d040');
        px(fx, fy, 1, 1, '#f8f8f0');
    }
}

function drawTree(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    // FireRed-style round canopy (blocky circles, not pine triangles)
    // Bottom canopy ring
    px(sx + 4, sy + 14, 24, 10, P.leafDark);
    px(sx + 2, sy + 16, 28, 6, P.leafDark);
    // Mid canopy
    px(sx + 6, sy + 8, 20, 10, P.leaf);
    px(sx + 4, sy + 10, 24, 6, P.leaf);
    // Top canopy
    px(sx + 8, sy + 4, 16, 8, P.leaf);
    px(sx + 10, sy + 2, 12, 4, P.leafLight);
    // Highlights
    px(sx + 12, sy + 6, 4, 2, P.leafLight);
    px(sx + 18, sy + 10, 3, 2, P.leafLight);
    // Trunk
    px(sx + 13, sy + 22, 6, 8, P.trunk);
    px(sx + 13, sy + 22, 2, 8, P.trunkDark);
    px(sx + 14, sy + 24, 2, 2, P.woodL);
    // Root shadow on grass
    px(sx + 10, sy + 29, 12, 2, P.grassDeep);
}

function drawPath(sx, sy, mapX, mapY) {
    // Sandy dirt path like Route 1 / town roads in FireRed
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.path);
    const v = tileVar(mapX, mapY, 6);
    px(sx + 2, sy + 2, 10, 8, P.pathLight);
    px(sx + 16, sy + 4, 12, 6, P.pathDark);
    px(sx + 4, sy + 14, 14, 8, P.pathDark);
    px(sx + 18, sy + 18, 10, 8, P.pathLight);
    // Edge scuffs
    px(sx, sy, TILE_SIZE, 2, P.pathEdge);
    px(sx, sy + 30, TILE_SIZE, 2, P.pathEdge);
    // Tiny pebbles
    px(sx + 6 + v * 2, sy + 10, 2, 2, P.pathEdge);
    px(sx + 20 - v, sy + 22, 2, 2, P.found);
}

function drawWater(sx, sy, mapX, mapY) {
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.water);
    px(sx, sy + 20, TILE_SIZE, 12, P.waterDark);
    px(sx, sy + 26, TILE_SIZE, 6, P.waterDeep);
    // Animated wave bands (2px steps, GBA-friendly)
    const w = Math.floor(Date.now() / 280) % 4;
    const ox = w * 2;
    px(sx + 2 + ox, sy + 6, 10, 2, P.waterLight);
    px(sx + 14 + ox, sy + 12, 12, 2, P.waterLight);
    px(sx + 4 + ox, sy + 18, 10, 2, P.waterLight);
    px(sx + 2 + ox, sy + 6, 4, 1, P.waterFoam);
    px(sx + 16 + ox, sy + 12, 3, 1, P.waterFoam);
}

function drawCrops(sx, sy) {
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.dirt);
    px(sx, sy + 14, TILE_SIZE, 2, P.dirtD);
    px(sx, sy + 28, TILE_SIZE, 2, P.dirtD);
    // Crop rows (berry/farm look)
    for (let i = 0; i < 3; i++) {
        const cx = sx + 4 + i * 10;
        px(cx, sy + 6, 4, 10, P.crop);
        px(cx, sy + 6, 4, 3, P.cropD);
        px(cx + 1, sy + 4, 2, 2, P.grassLight);
        px(cx, sy + 18, 4, 8, P.crop);
        px(cx + 1, sy + 16, 2, 2, P.grassLight);
    }
}

function drawWell(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    // Stone cylinder
    px(sx + 6, sy + 14, 20, 14, P.metal);
    px(sx + 6, sy + 14, 20, 3, P.metalL);
    px(sx + 6, sy + 25, 20, 3, P.metalD);
    // Dark water hole
    px(sx + 10, sy + 17, 12, 6, P.waterDeep);
    px(sx + 12, sy + 18, 8, 2, P.water);
    // Posts + roof
    px(sx + 8, sy + 4, 3, 12, P.woodD);
    px(sx + 21, sy + 4, 3, 12, P.woodD);
    px(sx + 4, sy + 2, 24, 4, P.roofRed);
    px(sx + 4, sy + 2, 24, 1, P.roofRedL);
    // Bucket
    px(sx + 14, sy + 8, 4, 5, P.metalD);
    px(sx + 14, sy + 8, 4, 1, P.metal);
}

function drawForge(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    // Stone forge body
    px(sx + 4, sy + 14, 24, 16, P.metal);
    px(sx + 4, sy + 14, 24, 3, P.metalL);
    px(sx + 4, sy + 27, 24, 3, P.metalD);
    // Fire mouth
    px(sx + 10, sy + 18, 12, 8, P.outline);
    const flicker = Math.floor(Date.now() / 120) % 2;
    px(sx + 12, sy + 20, 8, 5, flicker ? P.fire : P.fireL);
    px(sx + 14, sy + 22, 4, 3, flicker ? P.fireL : P.fire);
    // Chimney
    px(sx + 20, sy + 4, 8, 12, P.metalD);
    px(sx + 20, sy + 4, 8, 2, P.metal);
    // Anvil
    px(sx + 2, sy + 22, 7, 3, P.metalL);
    px(sx + 3, sy + 25, 5, 5, P.metalD);
}

function drawMarket(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    // Posts
    px(sx + 4, sy + 10, 2, 18, P.woodD);
    px(sx + 26, sy + 10, 2, 18, P.woodD);
    // Striped awning (FireRed mart vibe)
    px(sx + 2, sy + 4, 28, 8, P.roofRed);
    px(sx + 2, sy + 4, 28, 2, P.roofRedL);
    for (let i = 0; i < 4; i++) {
        px(sx + 4 + i * 7, sy + 6, 3, 6, P.uiWhite);
    }
    // Counter + goods
    px(sx + 2, sy + 18, 28, 10, P.wood);
    px(sx + 2, sy + 18, 28, 2, P.woodL);
    px(sx + 6, sy + 14, 4, 4, '#e05080');
    px(sx + 12, sy + 14, 4, 4, P.gold);
    px(sx + 18, sy + 14, 4, 4, P.crop);
    px(sx + 24, sy + 14, 4, 4, P.windowBlue);
}

function drawWatchtower(sx, sy, mapX, mapY) {
    drawGrassBase(sx, sy, mapX, mapY);
    // Tower body
    px(sx + 8, sy + 12, 16, 18, P.wallTan);
    px(sx + 8, sy + 12, 16, 2, P.wallTanL);
    px(sx + 8, sy + 26, 16, 4, P.wallTanD);
    // Window slit
    px(sx + 14, sy + 16, 4, 6, P.window);
    px(sx + 15, sy + 16, 2, 6, P.outline);
    // Platform + ladder
    px(sx + 6, sy + 2, 20, 4, P.woodD);
    px(sx + 6, sy + 2, 20, 1, P.woodL);
    px(sx + 10, sy + 6, 2, 8, P.wood);
    px(sx + 20, sy + 6, 2, 8, P.wood);
    for (let r = 0; r < 3; r++) {
        px(sx + 10, sy + 6 + r * 3, 12, 2, P.woodL);
    }
}

function drawFloor(sx, sy, mapX, mapY) {
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.floor);
    // Horizontal planks
    px(sx, sy + 10, TILE_SIZE, 1, P.floorD);
    px(sx, sy + 21, TILE_SIZE, 1, P.floorD);
    // Staggered seams
    const shift = (mapX + mapY) % 2 === 0 ? 0 : 16;
    px(sx + shift, sy, 1, 10, P.floorD);
    px(sx + (16 - shift), sy + 11, 1, 10, P.floorD);
    px(sx + shift, sy + 22, 1, 10, P.floorD);
    // Grain
    px(sx + 4, sy + 4, 6, 1, P.floorL);
    px(sx + 18, sy + 14, 8, 1, P.floorL);
}

function drawInteriorWall(sx, sy) {
    px(sx, sy, TILE_SIZE, TILE_SIZE, P.wallIn);
    px(sx, sy, TILE_SIZE, 3, P.wallInL);
    px(sx, sy + 26, TILE_SIZE, 6, P.wallInD);
    // Panel lines
    px(sx + 10, sy + 4, 1, 22, P.wallInD);
    px(sx + 21, sy + 4, 1, 22, P.wallInD);
}

function drawBed(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    // Headboard
    px(sx + 2, sy + 2, 28, 5, P.woodD);
    px(sx + 2, sy + 2, 28, 1, P.woodL);
    // Frame
    px(sx + 3, sy + 7, 26, 22, P.wood);
    // Blanket
    px(sx + 5, sy + 10, 22, 16, P.bed);
    px(sx + 5, sy + 20, 22, 6, P.bedL);
    // Pillow
    px(sx + 6, sy + 9, 10, 6, P.pillow);
    px(sx + 6, sy + 9, 10, 1, P.uiWhite);
}

function drawSwordCase(sx, sy, mapX, mapY) {
    drawFloor(sx, sy, mapX, mapY);
    const caseTop = map[mapY - 1] && map[mapY - 1][mapX] === 9;
    const caseBelow = map[mapY + 1] && map[mapY + 1][mapX] === 9;
    // Glass frame (solid pixel border, no alpha)
    if (caseBelow || !caseTop) {
        // Top tile: upper glass + blade tip
        px(sx + 6, sy + 4, 20, 28, P.windowBlue);
        px(sx + 8, sy + 6, 16, 24, P.uiCream);
        // Blade
        px(sx + 14, sy + 8, 4, 22, P.metalL);
        px(sx + 15, sy + 8, 2, 22, P.metal);
        px(sx + 14, sy + 6, 4, 2, P.metalL); // tip block
        px(sx + 15, sy + 4, 2, 2, P.metalL);
        // Frame outline
        px(sx + 6, sy + 4, 20, 2, P.metal);
        px(sx + 6, sy + 4, 2, 28, P.metal);
        px(sx + 24, sy + 4, 2, 28, P.metal);
    }
    if (caseTop) {
        // Bottom tile: lower glass + hilt + pedestal
        px(sx + 6, sy, 20, 22, P.windowBlue);
        px(sx + 8, sy, 16, 18, P.uiCream);
        px(sx + 14, sy, 4, 14, P.metalL);
        px(sx + 15, sy, 2, 14, P.metal);
        // Crossguard + hilt
        px(sx + 10, sy + 12, 12, 3, P.gold);
        px(sx + 14, sy + 15, 4, 6, P.woodD);
        // Pedestal
        px(sx + 8, sy + 22, 16, 3, P.wood);
        px(sx + 4, sy + 25, 24, 5, P.woodD);
        px(sx + 4, sy + 25, 24, 1, P.woodL);
        // Frame
        px(sx + 6, sy, 2, 22, P.metal);
        px(sx + 24, sy, 2, 22, P.metal);
        px(sx + 6, sy + 20, 20, 2, P.metal);
    }
}

function drawTable(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    px(sx + 4, sy + 10, 24, 8, P.wood);
    px(sx + 4, sy + 10, 24, 2, P.woodL);
    px(sx + 6, sy + 18, 3, 10, P.woodD);
    px(sx + 23, sy + 18, 3, 10, P.woodD);
}

function drawChair(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    px(sx + 8, sy + 8, 4, 12, P.woodD);
    px(sx + 20, sy + 8, 4, 12, P.woodD);
    px(sx + 8, sy + 8, 16, 3, P.wood);
    px(sx + 8, sy + 18, 16, 6, P.woodL);
    px(sx + 9, sy + 24, 2, 6, P.woodD);
    px(sx + 21, sy + 24, 2, 6, P.woodD);
}

function drawBookshelf(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    px(sx + 4, sy + 2, 24, 28, P.woodD);
    px(sx + 4, sy + 2, 24, 2, P.woodL);
    const books = [P.red, P.glow, P.crop, P.gold, P.wallBlue];
    for (let row = 0; row < 3; row++) {
        const by = sy + 5 + row * 8;
        px(sx + 6, by, 20, 7, P.wood);
        for (let b = 0; b < 4; b++) {
            px(sx + 7 + b * 5, by + 1, 4, 5, books[(b + row) % books.length]);
        }
    }
}

function drawExitMat(sx, sy) {
    drawFloor(sx, sy, 0, 0);
    // Door frame sides
    px(sx, sy, 3, TILE_SIZE, P.wallInD);
    px(sx + 29, sy, 3, TILE_SIZE, P.wallInD);
    // Doormat
    px(sx + 6, sy + 10, 20, 18, P.woodD);
    px(sx + 8, sy + 12, 16, 14, P.wood);
    px(sx + 10, sy + 14, 12, 2, P.woodD);
    px(sx + 10, sy + 20, 12, 2, P.woodD);
}

function drawTile(tileType, tileX, tileY) {
    const screenX = tileX * TILE_SIZE;
    const screenY = tileY * TILE_SIZE;
    // map coords for variation (tileX/Y here are screen tile indices)
    const mapX = camera.x + tileX;
    const mapY = camera.y + tileY;

    switch (tileType) {
        case 0: drawGrassBase(screenX, screenY, mapX, mapY); break;
        case 1: drawTree(screenX, screenY, mapX, mapY); break;
        case 2: drawPath(screenX, screenY, mapX, mapY); break;
        case 3:
        case 4:
        case 20:
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
        case 15: break; // door drawn later
        case 16: drawExitMat(screenX, screenY); break;
        case 17: drawTable(screenX, screenY); break;
        case 18: drawChair(screenX, screenY); break;
        case 19: drawBookshelf(screenX, screenY); break;
        default: drawGrassBase(screenX, screenY, mapX, mapY); break;
    }
}

// ------------------------------------------------------------------
// Sprites — FireRed-style proportions (big head, simple eyes, outlines)
// ------------------------------------------------------------------

function drawPlayer() {
    const screenX = Math.floor(player.x - camera.x * TILE_SIZE);
    const screenY = Math.floor(player.y - camera.y * TILE_SIZE);

    // 2-frame bob while walking (integer pixels only)
    let bob = 0;
    if (player.isMoving) {
        player.animFrame = (player.animFrame + 1) % 16;
        bob = (player.animFrame < 8) ? 0 : -1;
    }

    const ox = screenX;
    const oy = screenY + bob;
    pixelShadow(ox + 16, oy + 30);

    if (player.facing === 'down') drawPlayerDown(ox, oy);
    else if (player.facing === 'up') drawPlayerUp(ox, oy);
    else if (player.facing === 'left') drawPlayerSide(ox, oy, -1);
    else drawPlayerSide(ox, oy, 1);
}

function drawPlayerDown(ox, oy) {
    // Sheathed sword (behind)
    px(ox + 21, oy + 12, 5, 16, P.woodD);
    px(ox + 22, oy + 12, 2, 16, P.wood);
    px(ox + 20, oy + 9, 6, 3, P.gold);

    // Legs / boots
    px(ox + 10, oy + 25, 5, 5, P.pants);
    px(ox + 17, oy + 25, 5, 5, P.pants);
    px(ox + 9, oy + 29, 6, 3, P.boot);
    px(ox + 17, oy + 29, 6, 3, P.boot);

    // Body outline + tunic
    px(ox + 8, oy + 14, 16, 13, P.outline);
    px(ox + 9, oy + 15, 14, 11, P.red);
    px(ox + 9, oy + 15, 14, 2, P.redL);
    // Arms
    px(ox + 6, oy + 16, 3, 8, P.redD);
    px(ox + 23, oy + 16, 3, 8, P.redD);
    px(ox + 6, oy + 24, 3, 3, P.skin);
    px(ox + 23, oy + 24, 3, 3, P.skin);
    // Life-suit chest plate
    px(ox + 12, oy + 17, 8, 6, P.suit);
    px(ox + 13, oy + 18, 2, 4, P.glow);
    px(ox + 13, oy + 18, 2, 1, P.glowL);
    // Belt
    px(ox + 9, oy + 24, 14, 2, P.suit);
    px(ox + 14, oy + 24, 4, 2, P.gold);

    // Head (large FireRed proportion)
    px(ox + 10, oy + 4, 12, 11, P.outline);
    px(ox + 11, oy + 5, 10, 9, P.skin);
    // Hair cap + sideburns
    px(ox + 10, oy + 3, 12, 4, P.hair);
    px(ox + 10, oy + 3, 12, 2, P.hairD);
    px(ox + 10, oy + 5, 2, 5, P.hair);
    px(ox + 20, oy + 5, 2, 5, P.hair);
    px(ox + 12, oy + 4, 3, 2, P.hairL);
    // Bangs
    px(ox + 12, oy + 5, 2, 2, P.hair);
    px(ox + 18, oy + 5, 2, 2, P.hair);
    // Eyes (simple black dots — classic GBA)
    px(ox + 13, oy + 8, 2, 2, P.outline);
    px(ox + 17, oy + 8, 2, 2, P.outline);
    // Mouth
    px(ox + 15, oy + 11, 2, 1, P.skinD);
}

function drawPlayerUp(ox, oy) {
    // Legs
    px(ox + 10, oy + 25, 5, 5, P.pants);
    px(ox + 17, oy + 25, 5, 5, P.pants);
    px(ox + 9, oy + 29, 6, 3, P.boot);
    px(ox + 17, oy + 29, 6, 3, P.boot);

    // Body
    px(ox + 8, oy + 14, 16, 13, P.outline);
    px(ox + 9, oy + 15, 14, 11, P.redD);
    px(ox + 9, oy + 15, 14, 2, P.red);
    px(ox + 6, oy + 16, 3, 8, P.redD);
    px(ox + 23, oy + 16, 3, 8, P.redD);
    px(ox + 6, oy + 24, 3, 3, P.skin);
    px(ox + 23, oy + 24, 3, 3, P.skin);
    // Back life-suit unit
    px(ox + 12, oy + 17, 8, 5, P.suit);
    px(ox + 14, oy + 18, 2, 2, P.glow);
    px(ox + 9, oy + 24, 14, 2, P.suit);
    // Sword on back
    px(ox + 21, oy + 10, 5, 16, P.woodD);
    px(ox + 20, oy + 7, 6, 3, P.gold);

    // Head from behind (all hair)
    px(ox + 10, oy + 3, 12, 12, P.outline);
    px(ox + 11, oy + 4, 10, 10, P.hair);
    px(ox + 11, oy + 4, 10, 2, P.hairD);
    px(ox + 13, oy + 6, 3, 2, P.hairL);
    px(ox + 18, oy + 6, 2, 2, P.hairL);
}

function drawPlayerSide(ox, oy, dir) {
    // dir: 1 = right, -1 = left. Draw relative to center with manual mirror.
    const m = (x) => (dir === 1 ? ox + 16 + x : ox + 16 - x - 1);
    const mw = (x, w) => (dir === 1 ? ox + 16 + x : ox + 16 - x - w);

    // Sword behind
    px(mw(-12, 4), oy + 10, 4, 14, P.woodD);
    px(mw(-13, 5), oy + 7, 5, 3, P.gold);

    // Legs
    px(mw(-7, 5), oy + 25, 5, 5, P.pants);
    px(mw(2, 5), oy + 25, 5, 5, P.pants);
    px(mw(-8, 6), oy + 29, 6, 3, P.boot);
    px(mw(2, 6), oy + 29, 6, 3, P.boot);

    // Body
    px(mw(-8, 16), oy + 14, 16, 13, P.outline);
    px(mw(-7, 14), oy + 15, 14, 11, P.red);
    px(mw(-7, 14), oy + 15, 14, 2, P.redL);
    // Front arm
    px(mw(6, 3), oy + 16, 3, 8, P.redD);
    px(mw(6, 3), oy + 24, 3, 3, P.skin);
    // Life suit side
    px(mw(0, 5), oy + 17, 5, 6, P.suit);
    px(mw(1, 2), oy + 18, 2, 3, P.glow);
    px(mw(-7, 14), oy + 24, 14, 2, P.suit);

    // Head
    px(mw(-6, 12), oy + 4, 12, 11, P.outline);
    px(mw(-5, 10), oy + 5, 10, 9, P.skin);
    // Hair
    px(mw(-6, 12), oy + 2, 12, 4, P.hair);
    px(mw(-6, 12), oy + 2, 12, 2, P.hairD);
    px(mw(-6, 2), oy + 4, 2, 6, P.hair);
    px(mw(3, 3), oy + 4, 3, 3, P.hair); // forelock
    // Eye facing forward
    px(m(2), oy + 8, 2, 2, P.outline);
    px(m(3), oy + 11, 2, 1, P.skinD);
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

    pixelShadow(screenX + 16, screenY + 30);

    const isElder = npc.id.includes('elder');
    const robe = npc.color;
    const robeD = adjustColor(npc.color, -35);
    const robeL = adjustColor(npc.color, 30);

    // Robe body (FireRed NPC silhouette)
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
        // Bald + gray sides + beard
        px(screenX + 11, screenY + 4, 10, 3, P.skinD);
        px(screenX + 10, screenY + 5, 2, 6, P.hairGray);
        px(screenX + 20, screenY + 5, 2, 6, P.hairGray);
        px(screenX + 12, screenY + 11, 8, 3, P.hairGray);
        px(screenX + 13, screenY + 13, 3, 2, P.hairGray);
        px(screenX + 16, screenY + 13, 3, 2, P.hairGray);
        px(screenX + 13, screenY + 8, 2, 2, P.outline);
        px(screenX + 17, screenY + 8, 2, 2, P.outline);
        px(screenX + 12, screenY + 7, 4, 1, P.metalD);
        px(screenX + 16, screenY + 7, 4, 1, P.metalD);
    } else {
        // Tinslaire young hair
        px(screenX + 10, screenY + 2, 12, 4, P.hair);
        px(screenX + 10, screenY + 2, 12, 2, P.hairD);
        px(screenX + 10, screenY + 4, 2, 5, P.hair);
        px(screenX + 20, screenY + 4, 2, 5, P.hair);
        px(screenX + 13, screenY + 8, 2, 2, P.outline);
        px(screenX + 17, screenY + 8, 2, 2, P.outline);
        px(screenX + 15, screenY + 11, 2, 1, P.skinD);
    }

    // Name tag (solid, no alpha)
    const label = npc.name.length > 8 ? npc.name.slice(0, 7) + '.' : npc.name;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    const tw = Math.ceil(ctx.measureText(label).width) + 6;
    px(screenX + 16 - tw / 2, screenY - 10, tw, 9, P.uiBlueD);
    px(screenX + 16 - tw / 2 + 1, screenY - 9, tw - 2, 7, P.uiCream);
    ctx.fillStyle = P.uiBlueD;
    ctx.fillText(label, screenX + 16, screenY - 3);
}

// ------------------------------------------------------------------
// Scene 1.5 — Father Memory Cutscene (visual, not just dialog)
// Shows father and young Minslaire in the yard with the blade/sheath
// ------------------------------------------------------------------
function drawYoungMinslaireMemory(ox, oy) {
    // 75% scale child, facing father (right)
    pixelShadow(ox + 12, oy + 28);
    // Legs small
    px(ox + 6, oy + 20, 4, 4, P.pants);
    px(ox + 14, oy + 20, 4, 4, P.pants);
    px(ox + 5, oy + 24, 5, 3, P.boot);
    px(ox + 14, oy + 24, 5, 3, P.boot);
    // Small red tunic (child)
    px(ox + 4, oy + 10, 16, 12, P.outline);
    px(ox + 5, oy + 11, 14, 9, P.red);
    px(ox + 5, oy + 11, 14, 2, P.redL);
    px(ox + 3, oy + 12, 3, 6, P.redD);
    px(ox + 18, oy + 12, 3, 6, P.redD);
    // Head — big for child (FireRed chibi)
    px(ox + 6, oy + 1, 12, 11, P.outline);
    px(ox + 7, oy + 2, 10, 9, P.skin);
    // Tiny hair
    px(ox + 6, oy + 0, 12, 3, P.hair);
    px(ox + 6, oy + 0, 12, 1, P.hairD);
    px(ox + 6, oy + 2, 2, 4, P.hair);
    px(ox + 16, oy + 2, 2, 4, P.hair);
    px(ox + 8, oy + 1, 3, 1, P.hairL);
    // Eyes looking at father (right)
    px(ox + 9, oy + 5, 2, 2, P.outline);
    px(ox + 13, oy + 5, 2, 2, P.outline);
    px(ox + 10, oy + 9, 2, 1, P.skinD);
}

function drawFatherMemory(ox, oy, pose) {
    // pose 0=hold flat 1=hold explain 2=sheathed click 3=kneeling eye-to-eye
    let baseOy = oy;
    if (pose === 3) baseOy += 14; // kneel lower
    pixelShadow(ox + 16, baseOy + 32);
    // Legs / boots
    if (pose === 3) {
        // Kneeling: one knee down
        px(ox + 8, baseOy + 22, 6, 8, P.pantsD);
        px(ox + 18, baseOy + 22, 6, 6, P.pantsD);
        px(ox + 7, baseOy + 29, 7, 3, P.boot);
        px(ox + 18, baseOy + 27, 7, 3, P.boot);
        // knee pad
        px(ox + 8, baseOy + 26, 6, 4, P.pants);
    } else {
        px(ox + 8, baseOy + 22, 6, 8, P.pantsD);
        px(ox + 18, baseOy + 22, 6, 8, P.pantsD);
        px(ox + 7, baseOy + 29, 7, 3, P.boot);
        px(ox + 18, baseOy + 29, 7, 3, P.boot);
    }
    // Body — tan work tunic (not elder robe, not red)
    px(ox + 6, baseOy + 10, 20, 16, P.outline);
    px(ox + 7, baseOy + 11, 18, 14, P.wallTan);
    px(ox + 7, baseOy + 11, 18, 2, P.wallTanL);
    px(ox + 7, baseOy + 23, 18, 2, P.wallTanD);
    // Belt
    px(ox + 7, baseOy + 23, 18, 2, P.woodD);
    px(ox + 13, baseOy + 23, 4, 2, P.gold); // buckle
    // Sheath on belt (always visible)
    if (pose === 2) {
        // Blade fully in sheath — sheath looks full
        px(ox + 8, baseOy + 16, 5, 14, P.woodD);
        px(ox + 9, baseOy + 16, 2, 14, P.wood);
        px(ox + 8, baseOy + 16, 5, 1, P.gold);
        // click sparkle
        px(ox + 10, baseOy + 14, 2, 2, P.gold);
        px(ox + 11, baseOy + 15, 1, 1, P.uiWhite);
    } else {
        // Empty sheath (blade out)
        px(ox + 8, baseOy + 18, 5, 10, P.woodD);
        px(ox + 9, baseOy + 18, 2, 10, P.woodL);
        px(ox + 8, baseOy + 18, 5, 1, P.wood);
    }
    // Arms — extended holding blade when pose 0/1
    if (pose === 0 || pose === 1) {
        // Left arm
        px(ox + 1, baseOy + 14, 6, 3, P.skin);
        px(ox + 1, baseOy + 14, 6, 1, P.skinD);
        // Right arm
        px(ox + 25, baseOy + 14, 6, 3, P.skin);
        px(ox + 25, baseOy + 14, 6, 1, P.skinD);
    } else if (pose === 2) {
        // Hands closing sheath
        px(ox + 3, baseOy + 14, 5, 3, P.skin);
        px(ox + 24, baseOy + 14, 5, 3, P.skin);
    } else {
        // Kneeling — hands on knees / one on child's shoulder
        px(ox + 3, baseOy + 14, 6, 3, P.skin);
        px(ox + 23, baseOy + 16, 4, 3, P.skin);
    }
    // Head — father, older, short hair + beard, kind eyes
    px(ox + 10, baseOy + 0, 14, 13, P.outline);
    px(ox + 11, baseOy + 1, 12, 11, P.skin);
    // Hair receding, brown with gray sides
    px(ox + 10, baseOy + 0, 14, 3, P.hair);
    px(ox + 10, baseOy + 0, 14, 1, P.hairD);
    px(ox + 10, baseOy + 2, 3, 5, P.hair);
    px(ox + 21, baseOy + 2, 3, 5, P.hair);
    // Gray temples
    px(ox + 10, baseOy + 2, 2, 3, P.hairGray);
    px(ox + 22, baseOy + 2, 2, 3, P.hairGray);
    // Highlight
    px(ox + 12, baseOy + 1, 3, 1, P.hairL);
    // Beard
    px(ox + 12, baseOy + 9, 10, 4, P.hairD);
    px(ox + 13, baseOy + 10, 8, 2, P.hair);
    px(ox + 14, baseOy + 12, 4, 1, P.hairD);
    // Eyes — wise, soft
    px(ox + 13, baseOy + 5, 2, 2, P.outline);
    px(ox + 18, baseOy + 5, 2, 2, P.outline);
    px(ox + 14, baseOy + 6, 1, 1, P.uiWhite);
    px(ox + 19, baseOy + 6, 1, 1, P.uiWhite);
    // Mouth gentle
    px(ox + 15, baseOy + 9, 3, 1, P.skinD);
    if (pose === 3) {
        // Soften mouth when kneeling
        px(ox + 15, baseOy + 9, 2, 1, P.skinD);
        px(ox + 16, baseOy + 10, 1, 1, P.skin);
    }
}

function drawBladeMemory(ox, oy, pose) {
    if (pose === 0 || pose === 1) {
        // Blade held flat horizontally, 30px long, glinting
        // Positioned between father and child at chest height
        px(ox, oy, 32, 4, P.metalD); // shadow under
        px(ox, oy, 32, 3, P.metalL);
        px(ox + 1, oy, 30, 1, P.uiWhite); // top highlight
        px(ox + 1, oy + 1, 30, 1, P.metal);
        // Tip point
        px(ox + 32, oy + 1, 3, 1, P.metalL);
        px(ox + 33, oy, 2, 1, P.metalL);
        // Cross guard / hilt at father's side
        px(ox, oy - 1, 3, 5, P.gold);
        px(ox - 1, oy, 5, 3, P.gold);
        // Pommel
        px(ox - 2, oy, 2, 3, P.woodD);
    }
}

function drawMemoryCutscene() {
    // Full-screen memory — warm, dusty yard, not the bedroom
    // Sky — soft late-afternoon blue (FireRed palette)
    px(0, 0, canvas.width, canvas.height, P.wallBlueL);
    px(0, 0, canvas.width, 90, P.windowBlue);
    px(0, 0, canvas.width, 90, P.windowBlue);
    // Sun haze top right
    px(canvas.width - 80, 20, 40, 20, P.found);
    px(canvas.width - 76, 24, 32, 12, P.window);
    px(canvas.width - 72, 28, 24, 4, P.uiWhite);
    // Distant hills
    px(0, 70, canvas.width, 30, P.grassDark);
    px(0, 80, canvas.width, 20, P.grass);
    px(0, 90, canvas.width, 10, P.grassLight);
    // Yard ground — dirt + grass
    px(0, 120, canvas.width, canvas.height - 120, P.grass);
    // Dirt path in yard center
    px(120, 160, 240, 60, P.path);
    px(120, 160, 240, 4, P.pathLight);
    px(120, 210, 240, 6, P.pathDark);
    // Fence posts back
    px(20, 110, 4, 30, P.woodD);
    px(460, 110, 4, 30, P.woodD);
    px(20, 110, 440, 4, P.woodD);
    // Scattered flowers in yard (memory warmth)
    px(40, 170, 2, 2, P.window);
    px(42, 172, 1, 1, P.uiWhite);
    px(400, 180, 2, 2, '#f07090');
    px(402, 182, 1, 1, P.uiWhite);
    px(80, 200, 2, 2, P.gold);
    // Father and young Minslaire facing each other
    const pose = dialogIndex; // 0..3 maps directly to visual
    // Clamp pose to 0-3
    const p = Math.min(pose, 3);
    drawFatherMemory(148, 118, p);
    drawYoungMinslaireMemory(286, 148);
    if (p === 0 || p === 1) {
        drawBladeMemory(164, 138, p);
    }
    // Action captions — italic stage directions from walkthrough
    ctx.textAlign = 'center';
    ctx.font = 'italic 10px monospace';
    ctx.fillStyle = P.uiCream;
    if (p === 0) {
        // No caption yet — just father's first line
    } else if (p === 1) {
        ctx.fillStyle = P.uiHint;
        ctx.fillText("* He holds the blade up, flat in his palm. *", canvas.width/2, 108);
    } else if (p === 2) {
        ctx.fillStyle = P.gold;
        ctx.font = 'bold italic 11px monospace';
        ctx.fillText("* He slides it into its sheath. Click. *", canvas.width/2, 106);
        // Click sparkle already drawn on sheath
    } else if (p === 3) {
        ctx.fillStyle = P.uiCream;
        ctx.font = 'italic 10px monospace';
        ctx.fillText("* He kneels, so he's eye to eye with you. *", canvas.width/2, 104);
    }
    // Soft vignette — darken edges to feel like memory
    px(0, 0, canvas.width, 4, P.uiBlack);
    px(0, canvas.height-4, canvas.width, 4, P.uiBlack);
    px(0, 0, 4, canvas.height, P.uiBlack);
    px(canvas.width-4, 0, 4, canvas.height, P.uiBlack);
    // Memory label top
    ctx.textAlign = 'left';
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = P.gold;
    ctx.fillText("MEMORY — YEARS AGO", 10, 16);
    ctx.fillStyle = P.uiCream;
    ctx.font = '9px monospace';
    ctx.fillText("Your father's yard", 10, 26);
}

function drawDialog() {
    if (!currentDialog) return;

    // Pokémon FireRed-style text box: cream fill, blue/black double border
    const boxX = 16;
    const boxY = canvas.height - 78;
    const boxW = canvas.width - 32;
    const boxH = 66;

    px(boxX, boxY, boxW, boxH, P.uiBlack);
    px(boxX + 2, boxY + 2, boxW - 4, boxH - 4, P.uiBlue);
    px(boxX + 4, boxY + 4, boxW - 8, boxH - 8, P.uiBlack);
    px(boxX + 6, boxY + 6, boxW - 12, boxH - 12, P.uiCream);

    // Name
    ctx.fillStyle = P.uiName;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentDialog.name, boxX + 14, boxY + 20);

    // Body text
    ctx.fillStyle = P.uiText;
    ctx.font = '11px monospace';
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
        ctx.fillText(lines[i], boxX + 14, boxY + 36 + i * 12);
    }

    // Blink continue arrow (▼)
    if (Math.floor(Date.now() / 400) % 2 === 0) {
        px(boxX + boxW - 22, boxY + boxH - 18, 8, 2, P.uiBlueD);
        px(boxX + boxW - 20, boxY + boxH - 16, 4, 2, P.uiBlueD);
        px(boxX + boxW - 18, boxY + boxH - 14, 2, 2, P.uiBlueD);
    }
}

function drawInteractPrompt() {
    if (openingBlack) return;
    if (currentDialog || player.isMoving) return;

    let label = null;
    if (currentArea === 'interior' && currentInterior === 'home' && getInteriorNearbyNPC()) {
        label = 'E · Talk';
    } else if (currentArea === 'interior') {
        if (nearSwordCase()) label = 'E · Inspect';
    } else if (getNearbyNPC()) {
        label = 'E · Talk';
    }

    if (label) {
        // Small FireRed-style prompt pill
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        const tw = Math.ceil(ctx.measureText(label).width) + 16;
        const x = canvas.width / 2 - tw / 2;
        px(x, 8, tw, 14, P.uiBlack);
        px(x + 1, 9, tw - 2, 12, P.uiBlue);
        px(x + 2, 10, tw - 4, 10, P.uiCream);
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

// Buildings are 5x5 tiles outside; drawn as one unit from the NW root tile.
// Roofs use stepped horizontal bands (no triangle paths) — pure GBA pixels.
function drawBuilding(screenX, screenY, type) {
    const pal = {
        3:  { wall: P.wallBlue, wallD: P.wallBlueD, wallL: P.wallBlueL, roof: P.roofBlue, roofD: P.roofBlueD, roofL: P.roofBlueL, win: P.windowBlue },
        4:  { wall: P.wallRed,  wallD: P.wallRedD,  wallL: P.wallRedL,  roof: P.roofRed,  roofD: P.roofRedD,  roofL: P.roofRedL,  win: P.window },
        20: { wall: P.wallTan,  wallD: P.wallTanD,  wallL: P.wallTanL,  roof: P.roofGreen,roofD: P.roofGreenD,roofL: P.crop,     win: P.window }
    }[type];

    const bw = 5 * TILE_SIZE; // 160
    const bh = 5 * TILE_SIZE; // 160

    // Grass under footprint
    px(screenX, screenY, bw, bh, P.grass);

    // ---- Stepped gable roof (FireRed house silhouette) ----
    // Each band is 8px tall, narrowing toward the peak
    const roofBaseY = screenY + 72;
    const bands = [
        { y: 0,  inset: 56 },
        { y: 8,  inset: 44 },
        { y: 16, inset: 32 },
        { y: 24, inset: 20 },
        { y: 32, inset: 8 },
        { y: 40, inset: 0 },
        { y: 48, inset: 0 },
        { y: 56, inset: 0 }
    ];
    for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        const color = (i % 2 === 0) ? pal.roof : pal.roofD;
        px(screenX + b.inset, roofBaseY - 56 + b.y, bw - b.inset * 2, 8, color);
        // highlight on top edge of each band
        px(screenX + b.inset, roofBaseY - 56 + b.y, bw - b.inset * 2, 2, pal.roofL);
    }
    // Roof overhang lip
    px(screenX - 4, roofBaseY + 8, bw + 8, 6, pal.roofD);
    px(screenX - 4, roofBaseY + 8, bw + 8, 2, pal.roof);

    // Chimney
    px(screenX + bw - 40, roofBaseY - 40, 14, 28, P.metal);
    px(screenX + bw - 40, roofBaseY - 40, 14, 4, P.metalD);
    px(screenX + bw - 38, roofBaseY - 36, 4, 8, P.metalL);

    // ---- Walls ----
    px(screenX, roofBaseY + 14, bw, bh - (roofBaseY - screenY) - 14, pal.wall);
    px(screenX, roofBaseY + 14, bw, 3, pal.wallL);
    // Side shading
    px(screenX, roofBaseY + 14, 4, bh - (roofBaseY - screenY) - 14, pal.wallD);
    px(screenX + bw - 4, roofBaseY + 14, 4, bh - (roofBaseY - screenY) - 14, pal.wallD);
    // Foundation
    px(screenX, screenY + bh - 10, bw, 10, P.found);
    px(screenX, screenY + bh - 10, bw, 2, P.foundD);

    // Windows (cross-mullion, warm interior glow)
    for (let i = 0; i < 2; i++) {
        const wx = screenX + 18 + i * 78;
        const wy = roofBaseY + 28;
        px(wx - 2, wy - 2, 36, 28, pal.wallD);
        px(wx, wy, 32, 24, pal.win);
        px(wx, wy, 32, 3, P.uiWhite);
        // Cross
        px(wx + 14, wy, 4, 24, pal.wallD);
        px(wx, wy + 10, 32, 4, pal.wallD);
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
    // Wooden door inset into building wall (FireRed house door)
    px(screenX + 4, screenY + 2, 24, 28, P.outline);
    px(screenX + 6, screenY + 4, 20, 24, P.door);
    px(screenX + 6, screenY + 4, 20, 2, P.doorL);
    // Panels
    px(screenX + 8, screenY + 8, 7, 8, P.doorL);
    px(screenX + 17, screenY + 8, 7, 8, P.doorL);
    px(screenX + 8, screenY + 18, 7, 8, P.doorL);
    px(screenX + 17, screenY + 18, 7, 8, P.doorL);
    // Knob
    px(screenX + 22, screenY + 16, 2, 2, P.gold);
    // Stone threshold
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

function drawOpeningBlack() {
    if (!openingBlack) return;
    // Full black cover with hum text
    px(0, 0, canvas.width, canvas.height, P.uiBlack);
    // Center text — GBA style, cream on black
    ctx.textAlign = 'center';
    ctx.fillStyle = P.uiCream;
    ctx.font = 'bold 14px monospace';
    ctx.fillText("You wake to the hum.", canvas.width/2, canvas.height/2 - 16);
    ctx.fillStyle = P.uiHint;
    ctx.font = '11px monospace';
    ctx.fillText("Your suit hums before you do.", canvas.width/2, canvas.height/2 + 2);
    ctx.fillStyle = P.glowL;
    ctx.font = 'bold 11px monospace';
    // Blinking prompt
    if (Math.floor(Date.now()/500)%2===0) {
        ctx.fillText("[ Press E to wake ]", canvas.width/2, canvas.height/2 + 24);
    }
    // Dust motes drifting (subtle)
    const t = Date.now()/80;
    for (let i=0;i<4;i++) {
        const x = (Math.sin(t*0.03+i)*30 + canvas.width/2 + i*40) % canvas.width;
        const y = (Math.cos(t*0.02+i)*20 + canvas.height/2 + i*20) % canvas.height;
        px(Math.floor(x), Math.floor(y), 1, 1, P.uiCream);
    }
}

function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (openingBlack) {
        drawOpeningBlack();
        return;
    }

    // Father memory cutscene — full-screen visual, not the bedroom
    if (currentDialog && currentDialog.source === fatherMemorySource) {
        drawMemoryCutscene();
        drawDialog();
        return;
    }

    drawTiles();

    if (currentArea === 'village') {
        drawBuildings();
        drawDoors();
        for (const npc of npcs) {
            if (!isNpcVisible(npc)) continue;
            drawNPC(npc);
        }
        if (isDoorElderVisible()) {
            for (const npc of eldersAtDoorNPCs) {
                drawNPC(npc);
            }
        }
    } else if (currentArea === 'interior' && currentInterior === 'home') {
        // Interior Tinslaire (Scene 1) — draws on top of tiles but under player
        drawNPC(tinslaireInside);
    }

    drawPlayer();
    drawInteractPrompt();
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

// Start at Scene 1 — wake in Red House, not at door
function startOpening() {
    const interior = interiors['home'];
    currentInterior = 'home';
    currentArea = 'interior';
    map = interior.map;
    MAP_WIDTH = interior.map[0].length;
    MAP_HEIGHT = interior.map.length;
    // Scene 1: Minslaire wakes beside his bed. Beds at (3,3) and (5,3).
    // Place player just south of beds, facing down, Tinslaire at 6,5 near table.
    placePlayer(4, 5, 'down');
    updateCamera();
    updateHUD();
    openingBlack = true;
    memoryDone = false;
    tinslaireInsideTalked = false;
    eldersAtDoorReady = false;
    eldersDoorDialogDone = false;
    // Reset NPC spoken flags for fresh story run
    tinslaireInside.spoken = false;
    for (const n of eldersAtDoorNPCs) n.spoken = false;
    for (const n of npcs) n.spoken = false;
}

startOpening();
loop();
