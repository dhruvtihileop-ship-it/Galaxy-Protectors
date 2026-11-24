
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const normalMusic = document.getElementById("normalMusic");
const bossMusic = document.getElementById("bossMusic");

normalMusic.volume = 0.5;
bossMusic.volume = 0.6;

let musicEnabled = false;
let musicMode = "normal";

function startMusic() {
    if (musicEnabled) return;

    musicEnabled = true;
    const track = musicMode === "boss" ? bossMusic : normalMusic;
    track.play().catch(() => {
        musicEnabled = false;
        console.log("Tap the game once to enable music.");
    });
}

function setMusicMode(mode) {
    if (musicMode === mode) return;

    musicMode = mode;

    if (!musicEnabled) return;

    normalMusic.pause();
    bossMusic.pause();

    normalMusic.currentTime = 0;
    bossMusic.currentTime = 0;

    const track = mode === "boss" ? bossMusic : normalMusic;

    track.play().catch(() => {
        console.log("Music could not start.");
    });
}

function stopMusic() {
    musicEnabled = false;
    normalMusic.pause();
    bossMusic.pause();
}

// Images
const background = new Image();
background.src = "assets/Background.jpg";

const heroImage = new Image();
heroImage.src = "assets/Hero.png";

const enemyImage = new Image();
enemyImage.src = "assets/Enemy1.jpg";

const bossImage = new Image();
bossImage.src = "assets/Boss.jpg";

const heroBulletImage = new Image();
heroBulletImage.src = "assets/Hero%20Bullet.png";

const enemyBulletImage = new Image();
enemyBulletImage.src = "assets/Enemy%20bullet.png";

// Game variables
let player = {
    x: 175,
    y: 510,
    width: 50,
    height: 60,
    speed: 5,
    lives: 3
};

let bullets = [];
let enemyBullets = [];
let enemies = [];

let score = 0;
let gameState = "playing";

let boss = null;
let bossActive = false;

let playerHitCooldown = 0;
let enemySpawnTimer = 0;
let shootTimer = 0;

let keys = {
    left: false,
    right: false
};

// Start music after the first user interaction.
// Browsers may block autoplay until the player taps.
function enableMusic() {
    startMusic();
}

canvas.addEventListener("pointerdown", enableMusic, { once: true });

// Player movement
function updatePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }

    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Automatic shooting
    shootTimer++;

    if (shootTimer >= 18) {
        shoot();
        shootTimer = 0;
    }

    if (playerHitCooldown > 0) {
        playerHitCooldown--;
    }
}

// Shooting
function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 5,
        y: player.y,
        width: 10,
        height: 22,
        speed: 8
    });
}

// Create enemies
function createEnemy() {
    enemies.push({
        x: Math.random() * 340,
        y: -60,
        width: 45,
        height: 45,
        speed: 2 + Math.random() * 2,
        health: 1
    });
}

// Create boss
function createBoss() {
    bossActive = true;

    setMusicMode("boss");

    enemies = [];
    enemyBullets = [];

    boss = {
        x: 125,
        y: 35,
        width: 150,
        height: 110,
        health: 150,
        maxHealth: 150,
        speed: 2,
        direction: 1,
        shootTimer: 0
    };
}

// Enemy movement
function updateEnemies() {
    enemySpawnTimer++;

    if (enemySpawnTimer > 65 && score < 500) {
        createEnemy();
        enemySpawnTimer = 0;
    }

    enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;

        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });
}

// Boss movement
function updateBoss() {
    if (!boss) return;

    boss.x += boss.speed * boss.direction;

    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
        boss.direction *= -1;
    }

    boss.shootTimer++;

    if (boss.shootTimer >= 55) {
        enemyBullets.push({
            x: boss.x + boss.width / 2 - 5,
            y: boss.y + boss.height,
            width: 12,
            height: 22,
            speed: 4
        });

        boss.shootTimer = 0;
    }
}

// Update bullets
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;

        if (bullet.y < -30) {
            bullets.splice(index, 1);
        }
    });

    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;

        if (bullet.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
    });
}

// Collision detection
function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function checkCollisions() {
    // Player bullets vs enemies
    bullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (isColliding(bullet, enemy)) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                score += 10;
            }
        });
    });

    // Player bullets vs boss
    if (boss) {
        bullets.forEach((bullet, index) => {
            if (isColliding(bullet, boss)) {
                bullets.splice(index, 1);
                boss.health -= 1;

                if (boss.health <= 0) {
                    boss = null;
                    gameState = "win";
                    stopMusic();
                }
            }
        });
    }

    // Enemy bullets vs player
    enemyBullets.forEach((bullet, index) => {
        if (isColliding(bullet, player)) {
            enemyBullets.splice(index, 1);
            damagePlayer();
        }
    });

    // Enemies vs player
    enemies.forEach((enemy, index) => {
        if (isColliding(enemy, player)) {
            enemies.splice(index, 1);
            damagePlayer();
        }
    });
}

function damagePlayer() {
    if (playerHitCooldown > 0) return;

    player.lives--;
    playerHitCooldown = 60;

    if (player.lives <= 0) {
        gameState = "over";
        stopMusic();
    }
}

// Draw player
function drawPlayer() {
    ctx.drawImage(
        heroImage,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(
            enemyImage,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );
    });
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.drawImage(
            heroBulletImage,
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    });

    enemyBullets.forEach(bullet => {
        ctx.drawImage(
            enemyBulletImage,
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    });
}

// Draw boss
function drawBoss() {
    if (!boss) return;

    ctx.drawImage(
        bossImage,
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );

    // Boss health bar
    ctx.fillStyle = "#333";
    ctx.fillRect(80, 82, 240, 14);

    ctx.fillStyle = "red";
    ctx.fillRect(
        80,
        82,
        240 * (boss.health / boss.maxHealth),
        14
    );

    ctx.strokeStyle = "white";
    ctx.strokeRect(80, 82, 240, 14);
}

// Draw HUD
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";

    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText("Lives: " + player.lives, 310, 25);

    if (bossActive) {
        ctx.fillStyle = "yellow";
        ctx.font = "16px Arial";
        ctx.fillText("FINAL BOSS", 155, 65);
    }
}

// Draw game
function draw() {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    drawHUD();
    drawPlayer();
    drawEnemies();
    drawBullets();
    drawBoss();

    if (gameState === "over" || gameState === "win") {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = gameState === "win" ? "#00ff88" : "red";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            gameState === "win" ? "LEVEL CLEARED!" : "GAME OVER",
            canvas.width / 2,
            270
        );

        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText("Tap to Restart", canvas.width / 2, 320);

        ctx.textAlign = "left";
    }
}

// Game update
function update() {
    if (gameState !== "playing") return;

    updatePlayer();
    updateBullets();

    if (score >= 500 && !bossActive) {
        createBoss();
    }

    if (bossActive) {
        updateBoss();
    } else {
        updateEnemies();
    }

    checkCollisions();
}

// Restart
function restartGame() {
    player.x = 175;
    player.lives = 3;

    bullets = [];
    enemyBullets = [];
    enemies = [];

    score = 0;
    boss = null;
    bossActive = false;

    playerHitCooldown = 0;
    enemySpawnTimer = 0;
    shootTimer = 0;

    gameState = "playing";

    setMusicMode("normal");
    startMusic();
}

// Main loop
function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
}

// Mobile controls
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

leftBtn.addEventListener("pointerdown", () => {
    keys.left = true;
    startMusic();
});

leftBtn.addEventListener("pointerup", () => {
    keys.left = false;
});

leftBtn.addEventListener("pointerleave", () => {
    keys.left = false;
});

rightBtn.addEventListener("pointerdown", () => {
    keys.right = true;
    startMusic();
});

rightBtn.addEventListener("pointerup", () => {
    keys.right = false;
});

rightBtn.addEventListener("pointerleave", () => {
    keys.right = false;
});

// Keyboard controls
document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = true;
        startMusic();
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = true;
        startMusic();
    }
});

document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft" || event.key === "a") {
        keys.left = false;
    }

    if (event.key === "ArrowRight" || event.key === "d") {
        keys.right = false;
    }
});

// Restart by tapping the game after winning or losing
canvas.addEventListener("click", () => {
    if (gameState === "over" || gameState === "win") {
        restartGame();
    } else {
        startMusic();
    }
});

// Start game
gameLoop();
