import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction) {
        super(scene, x, y, 'antiblob');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(32, 24);
        this.body.setOffset(0, 12);
        this.body.bounce.set(0.4, 0.4);

        this.xSpeed = direction * CONFIG.enemySpeed;

        // Phaser 3 autoCull logic is different (cull delay), but usually not needed for small games.
        // We'll skip strict autoCull optimization for now unless needed.

        this.initAnimations(scene);
    }

    initAnimations(scene) {
        if (!scene.anims.exists('enemy-left')) {
            scene.anims.create({
                key: 'enemy-left',
                frames: scene.anims.generateFrameNumbers('antiblob', { frames: [1, 2, 3, 4, 5, 6] }),
                frameRate: 18,
                repeat: -1
            });
        }

        if (!scene.anims.exists('enemy-right')) {
            scene.anims.create({
                key: 'enemy-right',
                frames: scene.anims.generateFrameNumbers('antiblob', { frames: [8, 9, 10, 11, 12, 13] }),
                frameRate: 18,
                repeat: -1
            });
        }
    }

    update() {
        this.setVelocityX(this.xSpeed);

        if (this.body.velocity.x < 0) {
            this.anims.play('enemy-left', true);
        } else if (this.body.velocity.x > 0) {
            this.anims.play('enemy-right', true);
        }

        // World wrapping logic from original
        // if (this.x < 22) { ... }
        if (this.x < 22) {
            this.x = CONFIG.worldWidth - 22;
        } else if (this.x > CONFIG.worldWidth - 22) {
            if (this.y > CONFIG.worldHeight - 100) {
                this.y = 0;
            }
            this.x = 22;
        }
    }
}
