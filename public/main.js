var randomBetween = function(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
};

var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'game');

var PhaserGame = function () {

    this.bg = null;
    this.trees = null;

    this.player = null;

    this.platforms = null;
    this.clouds = null;

    this.facing = 'left';
    this.jumpTimer = 0;
    this.cursors = null;
    this.locked = false;
    this.lockedTo = null;
    this.wasLocked = false;
    this.willJump = false;

};

PhaserGame.prototype = {

    init: function () {
        this.tileSize = 32;

        this.chunks = 4;
        this.chunkWidth = 640;
        this.chunkHeight = 480;

        this.verticalSpacing = 4.5 * this.tileSize; // spacing between floor levels
        this.tilesWide = this.chunkWidth / this.tileSize; // tiles needed across width of stage

        // define world dimensions
        this.worldWidth = this.chunkWidth*this.chunks;
        this.worldHeight = this.chunkHeight*this.chunks;

        this.game.renderer.renderSession.roundPixels = true;

        this.world.resize(this.worldWidth, this.worldHeight);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        this.physics.arcade.gravity.y = 1200;
    },

    preload: function () {
        this.load.image('trees', 'assets/trees-h.png');
        this.load.image('background', 'assets/clouds-h.png');

        this.load.image('tile', 'assets/tile.png');
        this.load.spritesheet('blob', 'assets/blob.png', 32, 48);
        this.load.spritesheet('antiblob', 'assets/antiblob.png', 32, 48);
        //  Note: Graphics are Copyright 2015 Photon Storm Ltd.
    },

    create: function () {
        this.initBackgrounds();
        this.initPlatforms();


        /* Player
         * ================================================
         */
        this.player = this.add.sprite(randomBetween(0, this.game.world.width-32), this.game.world.height-96, 'blob');

        this.physics.arcade.enable(this.player);

        this.player.body.collideWorldBounds = true;
        this.player.body.setSize(20, 32, 5, 16);

        this.player.animations.add('left', [0, 1, 2, 3], 10, true);
        this.player.animations.add('turn', [4], 20, true);
        this.player.animations.add('right', [5, 6, 7, 8], 10, true);

        this.camera.follow(this.player);

        this.cursors = this.input.keyboard.createCursorKeys();

        /* Enemies
        ** ================================================
        **/
        this.enemy = this.add.sprite(randomBetween(0, this.game.world.width-32), this.game.world.height-96, 'antiblob');
        this.physics.arcade.enable(this.enemy);

        this.enemy.body.collideWorldBounds = true;
        this.enemy.body.setSize(20, 32, 5, 16);

        this.enemy.animations.add('left', [0, 1, 2, 3], 10, true);
        this.enemy.animations.add('turn', [4], 20, true);
        this.enemy.animations.add('right', [5, 6, 7, 8], 10, true);


    },

    preRender: function () {

        if (this.game.paused)
        {
            //  Because preRender still runs even if your game pauses!
            return;
        }

        if (this.locked || this.wasLocked)
        {
            this.player.x += this.lockedTo.deltaX;
            this.player.y = this.lockedTo.y - 48;

            if (this.player.body.velocity.x !== 0)
            {
                this.player.body.velocity.y = 0;
            }
        }

        if (this.willJump)
        {
            this.willJump = false;

            if (this.lockedTo && this.lockedTo.deltaY < 0 && this.wasLocked)
            {
                //  If the platform is moving up we add its velocity to the players jump
                this.player.body.velocity.y = -300 + (this.lockedTo.deltaY * 10);
            }
            else
            {
                this.player.body.velocity.y = -600;
            }

            this.jumpTimer = this.time.time + 750;
        }

        if (this.wasLocked)
        {
            this.wasLocked = false;
            this.lockedTo.playerLocked = false;
            this.lockedTo = null;
        }

    },

    update: function () {

        // move background with camera
        this.background.tilePosition.x = -(this.camera.x * 0.1);
        this.trees.tilePosition.x = -(this.camera.x * 0.3);

        this.physics.arcade.collide([this.player, this.enemy], this.platforms);

        //  Do this AFTER the collide check, or we won't have blocked/touching set
        this.player.isStanding = this.player.body.blocked.down || this.player.body.touching.down || this.locked;

        this.player.body.velocity.x = 0;
        this.enemy.body.velocity.x = 5;

        if (this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -240;

            if (this.facing !== 'left')
            {
                this.player.play('left');
                this.facing = 'left';
            }
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.velocity.x = 240;

            if (this.facing !== 'right')
            {
                this.player.play('right');
                this.facing = 'right';
            }
        }
        else
        {
            if (this.facing !== 'idle')
            {
                this.player.animations.stop();

                // if (this.facing === 'left')
                // {
                //     this.player.frame = 0;
                // }
                // else
                // {
                //     this.player.frame = 5;
                // }
                this.player.frame = 4;

                this.facing = 'idle';
            }
        }

        if (this.player.isStanding && this.cursors.up.isDown && this.time.time > this.jumpTimer)
        {
            if (this.locked)
            {
                this.cancelLock();
            }

            this.willJump = true;
        }

        if (this.locked)
        {
            this.checkLock();
        }

    },

    createTile: function(group, x, y, sprite=true) {
        // Get a tile that is not currently on screen
        var tile = group.getFirstDead();

        // if we have a tile
        if (tile) {
            // reset it to the specified coordinates
            tile.reset(x, y);

            // if sprite, get random frame
            if (sprite) {
                tile.frame = randomBetween(0, 6);
            }
        } else {
            console.error('No more tiles available in group.');
        }
    },

    createFloors: function() {
        // define lowest and highest y coordinates for platforms
        var lowest = this.game.world.height - this.tileSize,
            highest = 2 * (this.tileSize + this.verticalSpacing);

        // keep creating platforms from the lowest until the highest point allowed
        // use verticalSpacing to define the y coordinate for the next level
        for (var y = lowest; y > highest; y = y - this.verticalSpacing) {

            // if lowest level, fill with blocks
            if ( y == lowest ) {
                for (var i = 0, j = this.game.world.width; i < j; i++) {
                    var x = i*this.tileSize;
                    this.createTile(this.platforms, x, y, false);
                }

            // else build by chunks using matrix
            } else {

                // iterate through chunks
                for (var chunkNumber = 0; chunkNumber < this.chunks; chunkNumber++) {

                    // get chunk's x coordinate
                    chunkX = chunkNumber * this.chunkWidth;

                    // get a random floor from matrix
                    floor = this.matrix[randomBetween(0,9)]

                    // iterate though tiles in stage
                    for (var tileNumber = 0; tileNumber < this.tilesWide; tileNumber++) {

                        // if matrix cell returns positive, create tile
                        if ( floor[tileNumber] ) {
                            // calculate tile x coordinate and create tile
                            var x = chunkX + (tileNumber * this.tileSize);
                            this.createTile(this.platforms, x, y, false);
                        }
                    }
                }
            }
        }
    },

    initPlatforms: function() {
        // group of platforms that don't move
        this.platforms = this.add.physicsGroup();

        // calculate approximate number of tiles needed to fill screen
        var totalTiles = 15 * this.chunks * this.tilesWide * ( this.chunkHeight / this.verticalSpacing )
        this.platforms.createMultiple(12000, 'tile', 0);

        // add platforms properties
        this.platforms.setAll('body.allowGravity', false);
        this.platforms.setAll('body.immovable', true);

        this.createFloors();
    },

    initBackgrounds: function() {
        // set first background layer
        this.background = this.add.tileSprite(0, 0, 640, 480, 'background');
        this.background.fixedToCamera = true;

        // set second background layer
        this.trees = this.add.tileSprite(0, 364, 640, 116, 'trees');
        this.trees.fixedToCamera = true;
    },

    matrix: [
        [0,0,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
        [0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0],
        [1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1],
        [1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1],
        [1,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,1],
        [1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1],
        [1,1,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,1,1],
        [0,0,0,1,1,1,0,0,0,1,1,0,0,0,1,1,1,0,0,0],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
        [1,1,1,1,1,1,0,0,0,1,1,0,0,0,1,1,1,1,1,1],
        [0,0,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,0,0],
        [1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1],
        [0,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,0],
        [1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1],
        [1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1],
        [1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1],
        [1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1],
        [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1],
        [1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

};

game.state.add('Game', PhaserGame, true);