class SceneMain extends Phaser.Scene {
  constructor() {
    super({ key: "SceneMain" });
  }
  
  preload() {
    this.load.spritesheet("sprExplosion", "content/sprExplosion.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("sprEnemy0", "content/sprEnemy0.png", {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.image("sprEnemy1", "content/sprEnemy1.png");
    this.load.spritesheet("sprEnemy2", "content/sprEnemy2.png", {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.image("sprLaserEnemy0", "content/sprLaserEnemy0.png");
    this.load.image("sprLaserPlayer", "content/sprLaserPlayer.png");
    this.load.spritesheet("sprPlayer", "content/sprPlayer.png", {
      frameWidth: 16,
      frameHeight: 16
    });

    this.load.audio("sndExplode0", "content/sndExplode0.wav");
    this.load.audio("sndExplode1", "content/sndExplode1.wav");
    this.load.audio("sndLaser", "content/sndLaser.wav");
  }

  create() {
    //Init Score
    var score = 0;
    var scoreText;
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#d1ced6'});

    //create animations
    this.anims.create({
      key: "sprEnemy0",
      frames: this.anims.generateFrameNumbers("sprEnemy0"),
      frameRate: 20,
      repeat: -1
    });
    this.anims.create({
      key: "sprEnemy2",
      frames: this.anims.generateFrameNumbers("sprEnemy2"),
      frameRate: 20,
      repeat: -1
    });
    this.anims.create({
      key: "sprExplosion",
      frames: this.anims.generateFrameNumbers("sprExplosion"),
      frameRate: 20,
      repeat: 0
    });
    this.anims.create({
      key: "sprPlayer",
      frames: this.anims.generateFrameNumbers("sprPlayer"),
      frameRate: 20,
      repeat: -1
    });

    //create sounds
    this.sfx = {
      explosions: [
        this.sound.add("sndExplode0"),
        this.sound.add("sndExplode1")
      ],
      laser: this.sound.add("sndLaser")
    };

    //create background
    this.backgrounds = [];
    for (var i = 0; i < 5; i++) {
      var bg = new ScrollingBackground(this, "sprBg0", i * 10);
      this.backgrounds.push(bg);
    }

    //init player
    this.player = new Player(
        this,
        this.game.config.width * 0.5,
        this.game.config.height * 0.5,
        "sprPlayer",
        3
    );
    console.log(this.player);

    //init keys
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    //grouping
    this.enemies = this.add.group();
    this.enemyLasers = this.add.group();
    this.playerLasers = this.add.group();

    //Enemy spawn
    this.time.addEvent({
      delay: 3000,
      callback: function() {
        var enemy = null;
        //Difficulty scaling
        var diff_scale = score/100;

        //Generate Enemies
        for (var i=0; i<=diff_scale;i++) {
          //GUNSHIP
          if (Phaser.Math.Between(0, 10) >= 3) {
            enemy = new GunShip(
                this,
                Phaser.Math.Between(0, this.game.config.width),
                0,
                1
            );
          } else if (Phaser.Math.Between(0, 10) >= 5) {
            //CHASERSHIP
            if (this.getEnemiesByType("ChaserShip").length < 5) {
              enemy = new ChaserShip(
                  this,
                  Phaser.Math.Between(0, this.game.config.width),
                  0,
                  1
              );
            }
          } else {
            //CARRIERSHIP
            enemy = new CarrierShip(
                this,
                Phaser.Math.Between(0, this.game.config.width),
                0,
                1
            );
          }

          //spawn
          if (enemy !== null) {
            enemy.setScale(Phaser.Math.Between(10, 20) * 0.1);
            this.enemies.add(enemy);
          }
        }
      },
      callbackScope: this,
      loop: true
    });

    //Player hits Enemy with laser
    this.physics.add.collider(this.playerLasers, this.enemies, function(playerLaser, enemy) {
      //Set Life -1
      enemy.setData("Lifes", enemy.getData("Lifes")-1);

      if (enemy && enemy.getData("Lifes")<=0) {
        if (enemy.onDestroy !== undefined) {
          enemy.onDestroy();
        }
        enemy.explode(true);
        playerLaser.destroy();

        //Update Score
        score+=10;
        scoreText.setText('Score: ' + score);
      }
    });

    //Player and enemy collide
    this.physics.add.overlap(this.player, this.enemies, function(player, enemy) {
      if (!player.getData("isDead") && !enemy.getData("isDead")) {
        //Set Life -1
        player.setData("Lifes", player.getData("Lifes")-1);

        if(player.getData("Lifes")<=0) {
          player.explode(false);
          player.onDestroy();
        }
        //Kill anyway even if the enemy has still lifes left
        enemy.explode(true);
      }
    });

    //Player gets hit by enemy laser
    this.physics.add.overlap(this.player, this.enemyLasers, function(player, laser) {
      if (!player.getData("isDead") && !laser.getData("isDead")) {
        //Set Life -1
        player.setData("Lifes", player.getData("Lifes")-1);

        if(player.getData("Lifes")<=0) {
          player.explode(false);
          player.onDestroy();
        }
        laser.destroy();
      }
    });
  }

  getEnemiesByType(type) {
    var arr = [];
    for (var i = 0; i < this.enemies.getChildren().length; i++) {
      var enemy = this.enemies.getChildren()[i];
      if (enemy.getData("type") == type) {
        arr.push(enemy);
      }
    }
    return arr;
  }

  update() {

    if (!this.player.getData("isDead")) {
      this.player.update();
      if (this.keyW.isDown) {
        this.player.moveUp();
      }
      else if (this.keyS.isDown) {
        this.player.moveDown();
      }
      if (this.keyA.isDown) {
        this.player.moveLeft();
      }
      else if (this.keyD.isDown) {
        this.player.moveRight();
      }

      if (this.keySpace.isDown) {
        this.player.setData("isShooting", true);
      }
      else {
        this.player.setData("timerShootTick", this.player.getData("timerShootDelay") - 1);
        this.player.setData("isShooting", false);
      }
    }

    for (var i = 0; i < this.enemies.getChildren().length; i++) {
      var enemy = this.enemies.getChildren()[i];

      enemy.update();

      if (enemy.x < -enemy.displayWidth ||
        enemy.x > this.game.config.width + enemy.displayWidth ||
        enemy.y < -enemy.displayHeight * 4 ||
        enemy.y > this.game.config.height + enemy.displayHeight) {
        if (enemy) {
          if (enemy.onDestroy !== undefined) {
            enemy.onDestroy();
          }
          enemy.destroy();
        }
      }
    }

    for (var i = 0; i < this.enemyLasers.getChildren().length; i++) {
      var laser = this.enemyLasers.getChildren()[i];
      laser.update();
      if (laser.x < -laser.displayWidth ||
        laser.x > this.game.config.width + laser.displayWidth ||
        laser.y < -laser.displayHeight * 4 ||
        laser.y > this.game.config.height + laser.displayHeight) {
        if (laser) {
          laser.destroy();
        }
      }
    }

    for (var i = 0; i < this.playerLasers.getChildren().length; i++) {
      var laser = this.playerLasers.getChildren()[i];
      laser.update();
      if (laser.x < -laser.displayWidth ||
        laser.x > this.game.config.width + laser.displayWidth ||
        laser.y < -laser.displayHeight * 4 ||
        laser.y > this.game.config.height + laser.displayHeight) {
        if (laser) {
          laser.destroy();
        }
      }
    }

    for (var i = 0; i < this.backgrounds.length; i++) {
      this.backgrounds[i].update();
    }
  }
}