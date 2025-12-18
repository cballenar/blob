import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.WEBGL,
    width: 640,
    height: 480,
    parent: 'game',
    pixelArt: true, // Equivalent to renderSession.roundPixels = true
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);
