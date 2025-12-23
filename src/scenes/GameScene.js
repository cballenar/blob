import Phaser from 'phaser';
import { CONFIG, LEVEL_MATRIX } from '../config.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('tile', 'assets/tile.png');
        this.load.image('trees', 'assets/trees-h.png');
        this.load.image('background', 'assets/clouds-h.png');
        this.load.spritesheet('blob', 'assets/blob.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('antiblob', 'assets/antiblob.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        this.physics.world.setBounds(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
        this.cameras.main.setBounds(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);

        // Backgrounds
        this.bg = this.add.tileSprite(0, 0, 640, 480, 'background')
            .setOrigin(0, 0)
            .setScrollFactor(0); // Fixed to camera

        this.trees = this.add.tileSprite(0, 364, 640, 116, 'trees')
            .setOrigin(0, 0)
            .setScrollFactor(0); // Fixed to camera

        this.initPlatforms();

        // add player
        // randomBetween(0, game.world.width-32), game.world.height-96
        const startX = Phaser.Math.Between(0, CONFIG.worldWidth - 32);
        const startY = CONFIG.worldHeight - 96;
        this.player = new Player(this, startX, startY);

        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.initEnemies();
    }

    update() {
        // Parallax effect
        this.bg.tilePositionX = this.cameras.main.scrollX * 0.1;
        this.trees.tilePositionX = this.cameras.main.scrollX * 0.3;

        this.player.update(this.cursors);
        this.enemies.getChildren().forEach(enemy => enemy.update());
    }

    initEnemies() {
        this.enemies = this.physics.add.group({
            runChildUpdate: true // Actually we are calling update manually or using this?
            // In Phaser 3 group runChildUpdate is handy.
        });

        // Loop from 1 to chunks*2
        for (let i = 1; i < CONFIG.chunks * 2; i++) {
            const x = Phaser.Math.Between(0, CONFIG.worldWidth - 32);
            const y = Phaser.Math.Between(0, CONFIG.worldHeight - 32);
            const direction = Math.random() < 0.5 ? -1 : 1;

            const enemy = new Enemy(this, x, y, direction);
            this.enemies.add(enemy);
        }

        this.physics.add.collider(this.enemies, this.platforms, this.handleEnemyPlatformCollision, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.restart, null, this);
    }

    handleEnemyPlatformCollision(enemy, platform) {
        // If the enemy is blocked on the left or right (hits a wall), reverse direction
        if (enemy.body.blocked.left || enemy.body.blocked.right) {
            enemy.xSpeed *= -1;
        }
        // Note: The original code used world wrapping in Enemy.update() and world-bounce in moveEnemy().
        // We will respect the original wrapping behavior in Enemy.update() and remove the bouncing at world edges here.
        // However, we added logic to bounce if they hit a wall (a platform tile to the side).
    }

    restart() {
        this.scene.restart();
    }

    initPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        // define lowest and highest y coordinates for platforms
        // NOTE: In Phaser 3, origin is 0.5 by default for sprites, but for static groups created via create, it depends.
        // We'll calculate positions carefully.

        const lowest = CONFIG.worldHeight - CONFIG.tileSize;
        const highest = CONFIG.tileSize + CONFIG.verticalSpacing;

        // keep creating platforms from the lowest until the highest point allowed
        for (let y = lowest; y > highest; y -= CONFIG.verticalSpacing) {

            // if lowest level, fill with blocks
            if (y === lowest) {
                for (let i = 0; i < CONFIG.worldWidth; i += CONFIG.tileSize) {
                    this.createTile(i, y);
                }
            } else {
                // iterate through chunks
                for (let chunkNumber = 0; chunkNumber < CONFIG.chunks + 1; chunkNumber++) {

                    const chunkX = chunkNumber * CONFIG.chunkWidth;

                    // get a random floor from matrix
                    // Note: original used randomBetween(0,9). Matrix has 21 rows?
                    // Original code: floor = matrix[randomBetween(0,9)]
                    // Wait, matrix has 21 rows. Why 0-9? Maybe only the first 10 rows are candidate patterns?
                    // Let's stick to the original logic: indices 0-9.
                    const floorIndex = Phaser.Math.Between(0, 9);
                    const floor = LEVEL_MATRIX[floorIndex];

                    // iterate though tiles in stage
                    for (let tileNumber = 0; tileNumber < CONFIG.tilesWide; tileNumber++) {

                        if (floor[tileNumber]) {
                            const x = chunkX + (tileNumber * CONFIG.tileSize);
                            this.createTile(x, y);
                        }
                    }
                }
            }
        }
    }

    createTile(x, y) {
        // x, y are top-left coordinates in the loop logic (i*tileSize), but Phaser 3 sprites are center-origin by default.
        // However, `staticGroup.create` creates a sprite.
        // If we want to position them like the original (which likely used top-left or centered?), we should check.
        // Original: tile.reset(x, y). Phaser 2 default anchor is (0,0) (top-left).
        // Phaser 3 default origin is (0.5, 0.5).
        // So we need to offset by half width/height or set origin to 0.

        const tile = this.platforms.create(x, y, 'tile');
        tile.setOrigin(0, 0);
        tile.refreshBody(); // Important for static bodies after changing size/origin
    }
}
