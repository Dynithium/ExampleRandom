const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
let MAP_WIDTH = 25;
let MAP_HEIGHT = 20;
const MOVE_SPEED = 4;

// Tile types: 0=Grass, 1=Tree, 2=Path, 3=Blue House, 4=Red House, 5=Water
const villageMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,3,3,3,0,0,0,0,0,1,1,1,1,1,0,4,4,0,0,0,0,0,0,1],
    [1,0,3,3,3,0,0,0,0,0,0,2,2,2,0,0,4,4,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,0,0,2,2,2,0,0,1,1,1,1,1,1,1,1,1],
    [1,5,5,5,5,5,5,5,5,5,5,2,2,2,5,5,5,5,5,5,5,5,5,5,1],
    [1,5,5,5,5,5,5,5,5,5,5,2,2,2,5,5,5,5,5,5,5,5,5,5,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = villageMap;

// Interior tiles: 6=Wooden Floor, 7=Wall, 8=Bed, 9=Father's Sword Case
const interiorMap = [
    [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,8,6,8,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,9,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
    [7,7,7,7,7,7,7,6,7,7,7,7,7,7,7]
];

// Current area: 'home' (interior) or 'village'
let currentArea = 'home';
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
    locationNameEl.textContent = currentArea === 'home' ? 'Your Home' : 'Elderville Village';
}

function setArea(area) {
    currentArea = area;
    if (area === 'home') {
        map = interiorMap;
        MAP_WIDTH = 15;
        MAP_HEIGHT = 10;
        placePlayer(7, 8, 'down');
    } else {
        map = villageMap;
        MAP_WIDTH = 25;
        MAP_HEIGHT = 20;
        placePlayer(17, 4, 'down');
    }
    updateCamera();
    updateHUD();
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

function getNearbyHouseEntry() {
    if (player.tileY === 4 && (player.tileX === 16 || player.tileX === 17) && player.facing === 'up') {
        return true;
    }
    return null;
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
        tileX: 17,
        tileY: 3,
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
        tileX: 3,
        tileY: 3,
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
        tileX: 4,
        tileY: 3,
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
    return t === 1 || t === 3 || t === 4 || t === 5 || t === 7 || t === 8 || t === 9;
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
        } else if (currentArea === 'home') {
            if (player.tileX === 7 && player.tileY === 9) {
                setArea('village');
            } else if (nearSwordCase()) {
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
            }
        } else {
            // Village: enter the red house, otherwise talk to NPCs
            if (getNearbyHouseEntry()) {
                setArea('home');
            } else {
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

        if (!isSolid(nextTileX, nextTileY)) {
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
        case 0: // Grass - Detailed pixel art with variation
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grass blades
            ctx.fillStyle = '#3a7a2a';
            ctx.fillRect(screenX + 2, screenY + 4, 2, 6);
            ctx.fillRect(screenX + 8, screenY + 2, 2, 8);
            ctx.fillRect(screenX + 14, screenY + 5, 2, 5);
            ctx.fillRect(screenX + 20, screenY + 3, 2, 7);
            ctx.fillRect(screenX + 26, screenY + 6, 2, 5);
            // Small flowers
            ctx.fillStyle = '#ff6b9d';
            ctx.fillRect(screenX + 6, screenY + 18, 2, 2);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(screenX + 22, screenY + 22, 2, 2);
            break;
        case 1: // Tree - Detailed pine tree with trunk
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Trunk
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 13, screenY + 20, 6, 10);
            // Tree layers (pine style)
            ctx.fillStyle = '#1e4d2b';
            ctx.beginPath();
            ctx.moveTo(screenX + 16, screenY + 4);
            ctx.lineTo(screenX + 28, screenY + 18);
            ctx.lineTo(screenX + 4, screenY + 18);
            ctx.fill();
            ctx.fillStyle = '#2a6b3a';
            ctx.beginPath();
            ctx.moveTo(screenX + 16, screenY + 8);
            ctx.lineTo(screenX + 24, screenY + 16);
            ctx.lineTo(screenX + 8, screenY + 16);
            ctx.fill();
            // Highlights
            ctx.fillStyle = '#3d8f4d';
            ctx.fillRect(screenX + 14, screenY + 10, 2, 2);
            ctx.fillRect(screenX + 18, screenY + 12, 2, 2);
            break;
        case 2: // Path - Cobblestone texture
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
            // Mortar lines
            ctx.fillStyle = '#6b5344';
            ctx.fillRect(screenX + 8, screenY + 2, 2, 5);
            ctx.fillRect(screenX + 18, screenY + 2, 2, 5);
            ctx.fillRect(screenX + 9, screenY + 9, 2, 6);
            ctx.fillRect(screenX + 17, screenY + 10, 2, 5);
            break;
        case 3: // Blue House - Detailed building
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // House base
            ctx.fillStyle = '#4a6fa5';
            ctx.fillRect(screenX + 2, screenY + 12, 28, 18);
            // Roof
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.moveTo(screenX + 1, screenY + 12);
            ctx.lineTo(screenX + 16, screenY + 2);
            ctx.lineTo(screenX + 31, screenY + 12);
            ctx.fill();
            // Door
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(screenX + 12, screenY + 20, 8, 10);
            // Window
            ctx.fillStyle = '#87ceeb';
            ctx.fillRect(screenX + 6, screenY + 16, 6, 6);
            ctx.fillRect(screenX + 20, screenY + 16, 6, 6);
            // Window panes
            ctx.fillStyle = '#4a6fa5';
            ctx.fillRect(screenX + 8, screenY + 16, 2, 6);
            ctx.fillRect(screenX + 22, screenY + 16, 2, 6);
            ctx.fillRect(screenX + 6, screenY + 18, 6, 2);
            ctx.fillRect(screenX + 20, screenY + 18, 6, 2);
            break;
        case 4: // Red House - Minslaire's home
            ctx.fillStyle = '#2d5a1e';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // House base
            ctx.fillStyle = '#a54a4a';
            ctx.fillRect(screenX + 2, screenY + 12, 28, 18);
            // Roof
            ctx.fillStyle = '#6b2323';
            ctx.beginPath();
            ctx.moveTo(screenX + 1, screenY + 12);
            ctx.lineTo(screenX + 16, screenY + 2);
            ctx.lineTo(screenX + 31, screenY + 12);
            ctx.fill();
            // Door
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 12, screenY + 20, 8, 10);
            // Window with warm light
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(screenX + 6, screenY + 16, 6, 6);
            ctx.fillRect(screenX + 20, screenY + 16, 6, 6);
            // Window panes
            ctx.fillStyle = '#a54a4a';
            ctx.fillRect(screenX + 8, screenY + 16, 2, 6);
            ctx.fillRect(screenX + 22, screenY + 16, 2, 6);
            ctx.fillRect(screenX + 6, screenY + 18, 6, 2);
            ctx.fillRect(screenX + 20, screenY + 18, 6, 2);
            break;
        case 5: // Water - Animated waves
            ctx.fillStyle = '#1e4a5c';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Wave highlights
            ctx.fillStyle = '#3d7a9c';
            const waveOffset = Math.floor(Date.now() / 200) % 4;
            ctx.fillRect(screenX + 2 + waveOffset * 2, screenY + 6, 8, 2);
            ctx.fillRect(screenX + 12 + waveOffset * 2, screenY + 12, 8, 2);
            ctx.fillRect(screenX + 4 + waveOffset * 2, screenY + 18, 8, 2);
            ctx.fillRect(screenX + 18 + waveOffset * 2, screenY + 8, 6, 2);
            ctx.fillRect(screenX + 8 + waveOffset * 2, screenY + 22, 6, 2);
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

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 28, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body/Life Suit
    ctx.fillStyle = '#c93838';
    ctx.fillRect(screenX + 8, screenY + 14 + bobOffset, 16, 12);
    
    // Suit details
    ctx.fillStyle = '#a02828';
    ctx.fillRect(screenX + 10, screenY + 16 + bobOffset, 12, 8);
    
    // Belt
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(screenX + 8, screenY + 22 + bobOffset, 16, 3);

    // Head
    ctx.fillStyle = '#f5d6b0';
    ctx.fillRect(screenX + 10, screenY + 4 + bobOffset, 12, 10);

    // Hair
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(screenX + 10, screenY + 4 + bobOffset, 12, 3);
    ctx.fillRect(screenX + 8, screenY + 5 + bobOffset, 2, 6);
    ctx.fillRect(screenX + 22, screenY + 5 + bobOffset, 2, 6);

    // Eyes based on facing direction
    ctx.fillStyle = '#222';
    if (player.facing === 'down' || player.facing === 'up') {
        ctx.fillRect(screenX + 12, screenY + 8 + bobOffset, 2, 2);
        ctx.fillRect(screenX + 18, screenY + 8 + bobOffset, 2, 2);
    } else if (player.facing === 'right') {
        ctx.fillRect(screenX + 17, screenY + 8 + bobOffset, 3, 2);
    } else if (player.facing === 'left') {
        ctx.fillRect(screenX + 12, screenY + 8 + bobOffset, 3, 2);
    }

    // Sword on back (family heirloom)
    ctx.fillStyle = '#888';
    if (player.facing === 'down') {
        ctx.fillRect(screenX + 18, screenY + 10 + bobOffset, 3, 10);
        ctx.fillStyle = '#6b4020';
        ctx.fillRect(screenX + 17, screenY + 18 + bobOffset, 5, 3);
    } else if (player.facing === 'right') {
        ctx.fillRect(screenX + 14, screenY + 10 + bobOffset, 3, 10);
        ctx.fillStyle = '#6b4020';
        ctx.fillRect(screenX + 13, screenY + 18 + bobOffset, 5, 3);
    } else if (player.facing === 'left') {
        ctx.fillRect(screenX + 14, screenY + 10 + bobOffset, 3, 10);
        ctx.fillStyle = '#6b4020';
        ctx.fillRect(screenX + 13, screenY + 18 + bobOffset, 5, 3);
    }
}

function drawNPC(npc) {
    const screenX = npc.tileX * TILE_SIZE - (camera.x * TILE_SIZE);
    const screenY = npc.tileY * TILE_SIZE - (camera.y * TILE_SIZE);
    
    // Only draw if visible
    if (screenX < -TILE_SIZE || screenX > canvas.width || screenY < -TILE_SIZE || screenY > canvas.height) return;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 28, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body/Robes
    ctx.fillStyle = npc.color;
    ctx.fillRect(screenX + 8, screenY + 14, 16, 14);
    
    // Robe details
    ctx.fillStyle = adjustColor(npc.color, -30);
    ctx.fillRect(screenX + 10, screenY + 16, 12, 10);

    // Head
    ctx.fillStyle = '#e8c4a0';
    ctx.fillRect(screenX + 10, screenY + 4, 12, 10);

    // Elder beard or regular hair
    if (npc.id.includes('elder')) {
        // Beard
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX + 10, screenY + 11, 12, 6);
        // Bald head with side hair
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(screenX + 8, screenY + 4, 2, 8);
        ctx.fillRect(screenX + 22, screenY + 4, 2, 8);
    } else {
        // Regular hair for Tinslaire
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(screenX + 10, screenY + 4, 12, 3);
    }

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX + 12, screenY + 8, 2, 2);
    ctx.fillRect(screenX + 18, screenY + 8, 2, 2);

    // Name indicator
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, screenX + 16, screenY - 2);
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
    if (currentArea === 'home') {
        if (player.tileX === 7 && player.tileY === 9) {
            label = '[E] Leave Home';
        } else if (nearSwordCase()) {
            label = '[E] Inspect';
        }
    } else {
        if (getNearbyHouseEntry()) {
            label = '[E] Enter';
        } else if (getNearbyNPC()) {
            label = '[E] Talk';
        }
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

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTiles();

    // NPCs only exist in the village, never inside interiors
    if (currentArea === 'village') {
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
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

setArea('home');
loop();
