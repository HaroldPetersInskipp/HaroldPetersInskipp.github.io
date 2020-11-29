// size of font
var FONT = 32;

// map dimensions
var ROWS = 18; // number of rows
var COLS = 48; // number of columns

// characters per level, including player
var ACTORS = 9;

// a list of all actors; 0 is player
var player;
var actorList;
var livingEnimies;

// points to each actor in it's position, for quick searching
var actorMap;

// the structure of the map
var map;

// the ascii display, as a 2d array of characters
var asciidisplay;

// init phaser, call create () once done
var game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
		create: create
});

function create() {
		// init keyboard commands
		game.input.keyboard.addCallbacks(null, null, onKeyUp);
		
		// init map
		initMap();
		
		// init screen asciidisplay
		asciidisplay =[];
		for (var y = 0; y < ROWS; y++) {
			var newRow = [];
			asciidisplay.push(newRow);
			for (var x = 0; x < COLS; x++)
				newRow.push( initCell('', x, y) );
		}
		
		//draw level
		drawMap();	
		
		// init actors
		initActors();
		
		drawActors();
}

function initCell(chr, x, y) {
	// add a single cell in a given position to the ascii display
	var style = { font: FONT + "px monospace", fill: "#fff"};
	return game.add.text(FONT*0.6*x, FONT*y, chr, style);
}

function onKeyUp(event) {
	// draw map to overwrite old positions
	drawMap();
	
	// act on player input
	var acted = false;
	switch (event.keyCode) {
		case Phaser.Keyboard.LEFT:
			acted = moveTo(player, {x:-1, y:0});
			break;
		case Phaser.Keyboard.RIGHT:
			acted = moveTo(player,{x:1, y:0});
			break;
		case Phaser.Keyboard.UP:
			acted = moveTo(player, {x:0, y:-1});
			break;
		case Phaser.Keyboard.DOWN:
			acted = moveTo(player, {x:0, y:1});
			break;
	}
	
	// enemies act every time the player does
	if (acted)
		for (var enemy in actorList) {
			// skip the player
			if (enemy==0)
				continue;
			
			var B = actorList[enemy];
			if (B != null)
				aiAct(B);
		}
	
	//draw actors in new postions
	drawActors();
}

function initMap() {
	// create a new random map
	map = [];
	for (var y = 0; y < ROWS; y++) {
		var newRow = [];
		for (var x = 0; x < COLS; x++) {
			if (Math.random() > 0.7)
				newRow.push('#');
			else
				newRow.push('.');
		}
		map.push(newRow);
	}
}

function drawMap() {
	for (var y = 0; y < ROWS; y++)
		for (var x = 0; x < COLS; x++)
			asciidisplay[y][x].content = map[y][x];
}

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function initActors() {
	// spawn actors at random locations
	actorList = [];
	actorMap = {};
	for (var e=0; e<ACTORS; e++) {
		// spawn new actor
		var actor = { x:0, y:0, hp:e == 0?7:1 };
		do {
			// pick a random position that is both floor and not occupied
			actor.y=randomInt(ROWS);
			actor.x=randomInt(COLS);
		} while ( map[actor.y][actor.x] == '#' || actorMap[actor.y + "_" + actor.x] != null );
		
		// add references to the actor to the actors list & map
		actorMap[actor.y + "_" + actor.x]= actor;
		actorList.push(actor);
	}
	
	// the player is the first actor in the list & map
	player = actorList[0];
	livingEnemies = ACTORS-1;
}

function drawActors() {
	for (var a in actorList) {
		if (actorList[a] != null && actorList[a].hp > 0)
			asciidisplay[actorList[a].y][actorList[a].x].content = a == 0 ? '' + player.hp: 'B';
	}
}

function canGo(actor,dir) {
	return actor.x+dir.x >= 0 &&
	actor.x+dir.x <= COLS -1 &&
	actor.y+dir.y >= 0 &&
	actor.y+dir.y <= ROWS -1 &&
	map[actor.y+dir.y][actor.x +dir.x] == '.';
}

function moveTo(actor, dir) {
	// checks if actor can move in the given location
	if (!canGo(actor,dir))
		return false;
	
	// moves actor to the new location
	var newKey = (actor.y + dir.y) +'_' + (actor.x + dir.x);
	// if the destination tile has an actor in it
	if (actorMap[newKey] != null) {
		// decrease HP of the actor at the destination tile
		var victim = actorMap[newKey];
		victim.hp--;
		
		// if actor dies remove it's reference
		if (victim.hp == 0) {
			actorMap[newKey]= null;
			actorList[actorList.indexOf(victim)]=null;
			if (victim!=player) {
				livingEnemies--;
				if (livingEnemies == 0) {
					//victory message
					var victory = game.add.text(game.world.centerX, game.world.centerY, 'BABE! I love you Heather, claim your kiss!', { fill : '#2e2', align: "center" } );
					victory.anchor.setTo(0.5,0.5);
				}
			}
		}
	} else {
		// remove reference to the actor's old location
		actorMap[actor.y + '_' + actor.x]= null;
		
		// update position
		actor.y+=dir.y;
		actor.x+=dir.x;
		
		//add reference to the actor's new location
		actorMap[actor.y + '_' + actor.x]=actor;
	}
	return true;
}

function aiAct(actor) {
	var directions = [ { x: -1, y:0 }, { x:1, y:0 }, { x:0, y: -1 }, { x:0, y:1 } ];
	var dx = player.x - actor.x;
	var dy = player.y - actor.y;
	
	// if player is unobserved, walk randomly
	if (Math.abs(dx) + Math.abs(dy) >7)
		// try to walk in random directions until one succeeds
		while (!moveTo(actor, directions[randomInt(directions.length)])) { };
	
	// otherwise move towards the player
	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx < 0) {
			// left
			moveTo(actor, directions[0]);
		} else {
			// right
			moveTo(actor, directions[1]);
		}
	} else {
		if (dy < 0) {
			// up
			moveTo(actor, directions[2]);
		} else {
			// down
			moveTo(actor, directions[3]);
		}
	}
	if (player.hp < 1) {
		// game over message
		var gameOver = game.add.text(game.world.centerX, game.world.centerY, 'Oh no! Try again BABE! Ctrl + R to restart', { fill:'#e2', align: "center" } );
		gameOver.anchor.setTo(0.5,0.5);
	}
}