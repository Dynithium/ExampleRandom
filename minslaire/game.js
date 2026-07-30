const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 20;
const MOVE_SPEED = 4; // Pixels per frame (must divide TILE_SIZE evenly, e.g. 32 / 4 = 8 frames per tile)

// Tile types: 0=Grass, 1=Tree, 2=Path, 3=Blue House, 4=Red House, 5=Water
const map = [
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
    st: 100
};

// Camera offset in tiles
const camera = {
    x: 0,
    y: 0,
    width: canvas.width / TILE_SIZE,
    height: canvas.height / TILE_SIZE
};

function updateCamera() {
    camera.x = Math.max(0, Math.min(MAP_WIDTH - camera.width, player.tileX - Math.floor(camera.width / 2)));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - camera.height, player.tileY - Math.floor(camera.height / 2)));
}

function isSolid(tileX, tileY) {
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return true;
    const t = map[tileY][tileX];
    return t === 1 || t === 3 || t === 4 || t === 5;
}

// Input state
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

function handleInput() {
    if (player.isMoving) return;

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

function drawTile(tileType, screenX, screenY) {
    switch (tileType) {
        case 0: // Grass
            ctx.fillStyle = '#3a8732';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#2f7027';
            ctx.fillRect(screenX + 8, screenY + 8, 4, 4);
            ctx.fillRect(screenX + 20, screenY + 20, 4, 4);
            break;
        case 1: // Tree
            ctx.fillStyle = '#3a8732';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1e4d18';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, TILE_SIZE/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 2: // Path
            ctx.fillStyle = '#c2a472';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#b09260';
            ctx.fillRect(screenX + 4, screenY + 4, 8, 4);
            ctx.fillRect(screenX + 16, screenY + 16, 10, 6);
            break;
        case 3: // Blue House
            ctx.fillStyle = '#2c4c88';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1a3260';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            break;
        case 4: // Red House
            ctx.fillStyle = '#882c2c';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#601a1a';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            break;
        case 5: // Water
            ctx.fillStyle = '#326c88';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#4a92b2';
            ctx.fillRect(screenX + 4, screenY + 12, 12, 4);
            break;
    }
}

function drawPlayer() {
    const screenX = player.x - (camera.x * TILE_SIZE);
    const screenY = player.y - (camera.y * TILE_SIZE);

    // Body
    ctx.fillStyle = '#d93838';
    ctx.fillRect(screenX + 6, screenY + 8, TILE_SIZE - 12, TILE_SIZE - 10);

    // Head
    ctx.fillStyle = '#f5d6b0';
    ctx.fillRect(screenX + 8, screenY + 4, TILE_SIZE - 16, 10);

    // Eyes
    ctx.fillStyle = '#222';
    if (player.facing === 'down') {
        ctx.fillRect(screenX + 10, screenY + 8, 2, 2);
        ctx.fillRect(screenX + 20, screenY + 8, 2, 2);
    } else if (player.facing === 'right') {
        ctx.fillRect(screenX + 20, screenY + 8, 2, 2);
    } else if (player.facing === 'left') {
        ctx.fillRect(screenX + 10, screenY + 8, 2, 2);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let ty = 0; ty < camera.height; ty++) {
        for (let tx = 0; tx < camera.width; tx++) {
            const mapX = camera.x + tx;
            const mapY = camera.y + ty;
            if (mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT) {
                const tileType = map[mapY][mapX];
                drawTile(tileType, tx * TILE_SIZE, ty * TILE_SIZE);
            }
        }
    }

    drawPlayer();
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

updateCamera();
loop();
