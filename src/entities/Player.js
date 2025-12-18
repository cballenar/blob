import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'blob');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body.setSize(20, 32);
        this.body.setOffset(6, 16); // Center the hitbox (32-20)/2 = 6, 48-32 = 16

        this.initAnimations(scene);
        this.scene.cameras.main.startFollow(this);
    }

    initAnimations(scene) {
        if (!scene.anims.exists('left')) {
            scene.anims.create({
                key: 'left',
                frames: scene.anims.generateFrameNumbers('blob', { frames: [1, 2, 3, 4, 5, 6] }),
                frameRate: 18,
                repeat: -1
            });
        }

        if (!scene.anims.exists('right')) {
            scene.anims.create({
                key: 'right',
                frames: scene.anims.generateFrameNumbers('blob', { frames: [8, 9, 10, 11, 12, 13] }),
                frameRate: 18,
                repeat: -1
            });
        }
    }

    update(cursors) {
        // Collide check is handled in Scene update via physics collider

        const isStanding = this.body.blocked.down || this.body.touching.down;

        this.setVelocityX(0);

        if (cursors.left.isDown) {
            this.setVelocityX(-CONFIG.playerSpeed);
            this.anims.play('left', true);
        } else if (cursors.right.isDown) {
            this.setVelocityX(CONFIG.playerSpeed);
            this.anims.play('right', true);
        } else {
            this.anims.stop();
            this.setFrame(7); // Idle frame
        }

        // Jump
        if (isStanding && cursors.up.isDown) {
            // In original: jumpTimer check.
            // But simple press check is usually fine. Original had a 500ms delay?
            // "game.time.time > jumpTimer"
            // Let's implement basic jump first.
             this.setVelocityY(CONFIG.jumpForce);
        }
    }
}
