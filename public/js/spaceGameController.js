cardGameControllers.controller('SpaceGameCtrl', ['$scope', '$location', 'socket', '$routeParams',
	function($scope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;
		
		// Init
		socket.emit('spaceGameInit', gameId);
		
		socket.on('goToLandingPage', function() {
			$scope.goToLobby();
		});
		
		socket.on('spaceGameUpdate', function(state) {
            var gameState = state.game;
            var playerState = state.player;

			$scope.game = gameState;
            $scope.player = playerState;
		});
		
		socket.on('spaceGameOver', function(winners) {
			$scope.winners = winners;
			//console.log(winners);
		});
		
		$scope.goToLobby = function() {
			$location.path('/lobby');
		};
		
		
		var game = new Phaser.Game(800, 600, Phaser.AUTO, 'spaceGameContent', { preload: preload, create: create, update: update, render: render });
		
		var SpaceShip = function (game) {
		    this.game = game;
		    this.health = 3;
		    this.fireRate = 200;
		    this.nextFire = 0;
		    this.alive = true;
		    
		    this.currentSpeed = 0;
		    this.angle = 0;

		    // Sprite
		    this.sprite = game.add.sprite(0, 0, 'spaceship');
		    
		    game.physics.p2.enable(this.sprite);
		    this.sprite.body.collideWorldBounds = true;
		    
		    this.sprite.body.mass = 1;
		    //this.sprite.body.kinematic = true;
		    
		    // Bullets
		    this.bulletCollisionGroup = game.physics.p2.createCollisionGroup();
		    
		    this.bullets = game.add.group();
		    this.bullets.enableBody = true;
		    this.bullets.physicsBodyType = Phaser.Physics.P2JS;

		    for (var i = 0; i < 50; i++) {
		        var bullet = this.bullets.create(0, 0, 'laser', 0, false);
		        
		        bullet.outOfBoundsKill = true;
		        bullet.checkWorldBounds = true;
		        bullet.body.collideWorldBounds = false;
		        
		        bullet.body.mass = 0.0001;

		        bullet.body.setCollisionGroup(this.bulletCollisionGroup);
		        bullet.body.collides([asteroidCollisionGroup, enemyCollisionGroup]);
		    }
		};
		
		var Asteroid = function (game) {
			var x = game.world.randomX;
		    var y = game.world.randomY;
			
			this.game = game;
			
			// Sprite
			this.sprite = game.add.sprite(x, y, 'asteroid');
			
			game.physics.p2.enable(this.sprite);
			
			this.sprite.body.setCircle(16);
			this.sprite.body.kinematic = true;
		    this.sprite.body.collideWorldBounds = true;
		}
		
		var cursors;
		var keyW, keyA, keyS, keyD;
		var keySpace;
		var player;
		var asteroidCollisionGroup, asteroids = [];
		var enemyCollisionGroup, enemies = [];

	    function preload() {
	    	game.time.advancedTiming = true;
	    	
	    	game.load.image('spaceship', '../images/spaceship2.png');
	    	game.load.image('laser', '../images/laser.png');
	    	game.load.image('asteroid', '../images/asteroid.png');
	    }

	    function create() {
	    	// World init
	    	game.world.setBounds(-1000, -1000, 2000, 2000);
	    	game.physics.startSystem(Phaser.Physics.P2JS);
	    	game.physics.p2.setImpactEvents(true);
	    	
	    	// Controls init
	        cursors = game.input.keyboard.createCursorKeys();
	        
	        keyW = game.input.keyboard.addKey(Phaser.Keyboard.W);
	        keyA = game.input.keyboard.addKey(Phaser.Keyboard.A);
	        keyS = game.input.keyboard.addKey(Phaser.Keyboard.S);
	        keyD = game.input.keyboard.addKey(Phaser.Keyboard.D);
	        
	        keySpace = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
	        
	        // Collisiongroups
	        var playerCollisionGroup = game.physics.p2.createCollisionGroup();
	        asteroidCollisionGroup = game.physics.p2.createCollisionGroup();
	        enemyCollisionGroup = game.physics.p2.createCollisionGroup();
	        
	        game.physics.p2.updateBoundsCollisionGroup();
	        
	        // Player init
	        player = new SpaceShip(game);
	        game.camera.follow(player.sprite);
	        
	        player.sprite.body.setCollisionGroup(playerCollisionGroup);
	        
	        // Asteroids init
	        //for (var i = 0; i < 50; i++) {
	        //	asteroids.push(new Asteroid(game));
	        //}
		    
	        asteroids = game.add.group();
	        asteroids.enableBody = true;
	        asteroids.physicsBodyType = Phaser.Physics.P2JS;

		    for (var i = 0; i < 50; i++) {
		        var asteroid = asteroids.create(game.world.randomX, game.world.randomY, 'asteroid', 0, true);
		       
		        asteroid.body.setCircle(16);
		        asteroid.body.kinematic = true;

		        asteroid.body.setCollisionGroup(asteroidCollisionGroup);
		        asteroid.body.collides([asteroidCollisionGroup, playerCollisionGroup, enemyCollisionGroup]);
		        asteroid.body.collides(player.bulletCollisionGroup, bulletHitAsteroid, this);
		    }
		    
		    // Enemy Players
		    for (var i = 0; i < 3; i++) {
		    	var enemy = new SpaceShip(game);
		    	enemy.sprite.body.setCollisionGroup(enemyCollisionGroup);
		    	
		    	enemy.sprite.body.reset(game.world.randomX, game.world.randomY);
		    	
		    	enemy.sprite.body.collides([asteroidCollisionGroup, playerCollisionGroup, enemyCollisionGroup]);
		    	enemy.sprite.body.collides(player.bulletCollisionGroup, bulletHitEnemy, this);
		    	
		    	enemies.push(enemy);
		    }
	        
		    
		    player.sprite.body.collides([enemyCollisionGroup]);
		    player.sprite.body.collides(asteroidCollisionGroup, spaceshipHitAsteroid, this);
		    
		    game.world.bringToTop(player.sprite);
		    
	    }

	    function update() {
	    	
	    	if (cursors.left.isDown) {
	            player.sprite.body.rotateLeft(80);
	        } else if (cursors.right.isDown) {
	        	player.sprite.body.rotateRight(80);
	        } else {
	            //player.sprite.body.angularVelocity = 0;
	        	player.sprite.body.setZeroRotation();
	        }
	    	
	    	if (cursors.up.isDown) {
	    		player.sprite.body.thrust(400);
	        } else {
	        	
	        }
	    	
	    	if (keySpace.isDown) {
	    		if (game.time.now > player.nextFire) {
	    			var bullet = player.bullets.getFirstExists(false);
	    			bullet.reset(player.sprite.x, player.sprite.y);
	    			
	    			bullet.body.angle = player.sprite.angle;
	    			bullet.body.moveForward(800);
	    			
	    			player.nextFire = game.time.now + player.fireRate;
	    		}
	    	}
	    	
	    	//game.physics.arcade.velocityFromAngle(player.angle, player.currentSpeed, player.sprite.body.velocity);
	    	
	    }

	    function render() {
	        //game.debug.geom(line, '#000');
	    	game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
	    	game.debug.spriteCoords(player.sprite, 32, 32);
	    }
	    
	    function bulletHitAsteroid (asteroid, bullet) {
	    	console.log("Hit (Bullet, Asteroid)");
	    	
	    	//console.log(bullet);
	    	bullet.sprite.kill();
	    }
	    
	    function spaceshipHitAsteroid (asteroid, spaceship) {
	    	console.log("Hit (Ship, Asteroid)");
	    	
	    	
	    }
	    
	    function bulletHitEnemy (enemy, bullet) {
	    	console.log("Hit (Enemy, Bullet)");
	    	
	    	bullet.sprite.kill();
	    }
	    
	    globalGame = game;
	    $scope.phaserGame = game;
		
		// Destructor
		$scope.$on('$destroy', function (e) {
			socket.removeAllListeners();
		});
		
        
}]);