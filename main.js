window.onload = function() {
    var game = new Phaser.Game(640, 480, Phaser.WEBGL, "game", {init: onInit, preload:onPreload, create:onCreate, preRender:onPreRender, update:onUpdate});

    var bg,
        trees,
        enemies,
        player,
        platforms,

        gravity = 1200,
        enemySpeed = 192,
        playerSpeed = 240,

        tileSize = 32,
        chunks = 4,
        chunkWidth = 640,
        chunkHeight = 480,
        verticalSpacing = 4.5 * tileSize, // spacing between floor levels
        tilesWide = chunkWidth / tileSize, // tiles needed across width of stage

        // define world dimensions
        worldWidth = chunkWidth*chunks,
        worldHeight = chunkHeight*chunks,

        jumpTimer = 0;



    /* World functions
    ** ================================================
    **/
    function onInit() {
        game.renderer.renderSession.roundPixels = true;
        game.world.resize(worldWidth, worldHeight);
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = gravity;
    };

    function onPreload() {
        game.load.image('tile', 'assets/tile.png');
        game.load.image('trees', 'assets/trees-h.png');
        game.load.image('background', 'assets/clouds-h.png');
        game.load.spritesheet('blob', 'assets/blob.png', 32, 48);
        game.load.spritesheet('antiblob', 'assets/antiblob.png', 32, 48);
    };

    function onCreate() {
        initBackgrounds();
        initPlatforms();

        // add player
        player = new Player(game, randomBetween(0, game.world.width-32), game.world.height-96);
        game.add.existing(player);

        // add enemies
        enemies = game.add.physicsGroup();
        for (var i = 1; i < chunks*2; i++) {
            var enemy = new Enemy(game, randomBetween(0, worldWidth-32), randomBetween(0, worldHeight-32),  Math.random() < 0.5 ? -1 : 1, enemySpeed);
            enemies.add(enemy);
        }
    };

    function onPreRender() {
        if (game.paused) {
            //  Because preRender still runs even if your game pauses!
            return;
        }
    };

    function onUpdate() {
        // move background with camera
        bg.tilePosition.x = -(game.camera.x * 0.1);
        trees.tilePosition.x = -(game.camera.x * 0.3);

        // call the 'restart' function when the player touches the enemy
        game.physics.arcade.overlap(player, enemies, restart, null, game);
    }

    // Function to restart the game
    function restart() {
        game.state.start('default');
    }



    /* Backgrounds
    ** ================================================
    **/
    function initBackgrounds() {
        // set first background layer
        bg = game.add.tileSprite(0, 0, 640, 480, 'background');
        bg.fixedToCamera = true;

        // set second background layer
        trees = game.add.tileSprite(0, 364, 640, 116, 'trees');
        trees.fixedToCamera = true;
    };



    /* Floors
    ** ================================================
    **/
    function createTile(group, x, y, sprite=true) {
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
    };

    function createFloors() {
        // define lowest and highest y coordinates for platforms
        var lowest = game.world.height - tileSize,
            highest = tileSize + verticalSpacing;

        // keep creating platforms from the lowest until the highest point allowed
        // use verticalSpacing to define the y coordinate for the next level
        for (var y = lowest; y > highest; y = y - verticalSpacing) {

            // if lowest level, fill with blocks
            if ( y == lowest ) {
                for (var i = 0, j = game.world.width; i < j; i++) {
                    var x = i*tileSize;
                    createTile(platforms, x, y, false);
                }

            // else build by chunks using matrix
            } else {

                // iterate through chunks
                for (var chunkNumber = 0; chunkNumber < chunks+1; chunkNumber++) {

                    // get chunk's x coordinate
                    chunkX = chunkNumber * chunkWidth;

                    // get a random floor from matrix
                    floor = matrix[randomBetween(0,9)]

                    // iterate though tiles in stage
                    for (var tileNumber = 0; tileNumber < tilesWide; tileNumber++) {

                        // if matrix cell returns positive, create tile
                        if ( floor[tileNumber] ) {
                            // calculate tile x coordinate and create tile
                            var x = chunkX + (tileNumber * tileSize);
                            createTile(platforms, x, y, false);
                        }
                    }
                }
            }
        }
    };

    function initPlatforms() {
        // group of platforms that don't move
        platforms = game.add.physicsGroup();

        // calculate approximate number of tiles needed to fill screen
        var totalTiles = 15 * chunks * tilesWide * ( chunkHeight / verticalSpacing )
        platforms.createMultiple(12000, 'tile', 0);

        // add platforms properties
        platforms.setAll('body.allowGravity', false);
        platforms.setAll('body.immovable', true);

        createFloors();
    };

    var matrix = [
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
    ];



    /* Player
    ** ================================================
    **/
    Player = function (game, x, y, direction, speed) {
        Phaser.Sprite.call(this, game, x, y, "blob");
        game.physics.enable(this, Phaser.Physics.ARCADE);
        game.cursors = game.input.keyboard.createCursorKeys();

        this.body.collideWorldBounds = true;
        this.body.setSize(20, 32, 5, 16);

        this.animations.add('left', [1, 2, 3, 4, 5, 6], 18, true);
        this.animations.add('right', [8, 9, 10, 11, 12, 13], 18, true);

        game.camera.follow(this);
    };

    Player.prototype = Object.create(Phaser.Sprite.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.update = function() {
        game.physics.arcade.collide(player, platforms);

        //  Do this AFTER the collide check, or we won't have blocked/touching set
        this.isStanding = this.body.blocked.down || this.body.touching.down;

        this.body.velocity.x = 0;

        // move left
        if (game.cursors.left.isDown) {
            this.body.velocity.x = -playerSpeed;
            this.play('left');
        }
        // move right
        else if (game.cursors.right.isDown) {
            this.body.velocity.x = playerSpeed;
            this.play('right');
        }
        // stay put
        else {
            this.animations.stop();
            this.frame = 7;
        }

        // perform jump
        if (this.isStanding && game.cursors.up.isDown && game.time.time > jumpTimer) {
            this.body.velocity.y = -600;
            jumpTimer = game.time.time + 500;
        }
    };



    /* Enemy
    ** ================================================
    **/
    Enemy = function (game, x, y, direction, speed) {
        Phaser.Sprite.call(this, game, x, y, "antiblob");
        this.anchor.setTo(0.5, 0.5);
        game.physics.enable(this, Phaser.Physics.ARCADE);
        this.xSpeed = direction*speed;

        // don't render object if outside camera. could be slow with large numbers
        this.autoCull = true;

        this.body.setSize(32, 24, 0, 12);
        this.body.bounce.setTo(0.4, 0.4);
        this.animations.add('left', [1, 2, 3, 4, 5, 6], 18, true);
        this.animations.add('right', [8, 9, 10, 11, 12, 13], 18, true);
    };

    Enemy.prototype = Object.create(Phaser.Sprite.prototype);
    Enemy.prototype.constructor = Enemy;

    Enemy.prototype.update = function() {
        game.physics.arcade.collide(this, platforms, moveEnemy);
        this.body.collideWorldBounds = true;
        this.body.velocity.x = this.xSpeed;

        if (this.body.velocity.x < 0) {
            this.play('left');
        }
        else if (this.body.velocity.x > 0) {
            this.play('right');
        }

        if (this.x < 22) {
            this.x = worldWidth-22;
        } else if (this.x > worldWidth-22) {
            if (this.y > worldHeight - 100) {
                this.y = 0;
            }
            this.x = 22;
        }
    };

    function moveEnemy(enemy, platform) {
        if (
            (enemy.xSpeed < 0 && enemy.x <= enemy.width/2) ||
            (enemy.xSpeed > 0 && enemy.x >= worldWidth - enemy.width/2)
        ) {
            enemy.xSpeed*=-1;
        }
    }



    /* Helper functions
    ** ================================================
    **/
    function randomBetween(min,max) {
        return Math.floor(Math.random()*(max-min+1)+min);
    };
}
