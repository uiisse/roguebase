var Game = {
    init: 
    function() 
    {
        // Setting up the game map
        var map = {}
        const width = 64
        const height = 32
        const emptyChar=""
        const carAxe = '🪓'
        const carPickaxe = '⛏️'
        const carBow = '🏹'
        const carFishingpole = '🎣'
        const carBasecamp = '⛺'
        const carPlayer = '🧔'        
        const carSprouts = '🌱'
        const carMushrooms = '🍄'
        const carWater = '💧'
        const carWood = '🪵'       
        const carStones = String.fromCharCode(9968)
        const carShoes = '🥾'
        const carSight = ''

        const numAggroAnimals = Math.floor((Math.random() * 20));
        const woodsEnemy = "🐻,🐺,🐗,🐅,🦍";    

        var playerDied = new Boolean(false)
        var isPlayerInBase = new Boolean(false)
        var isPlayerFighting = new Boolean(false)        

        let day = 1;
        const DAYSMINNEWDAY = 10;
        let counterDaysTemp = 0;     
        
        var soundSteps = new Howl({
            src: ['soundSteps.wav']
        });
                  
        var soundChop = new Howl({
            src: ['chop.mp3']
        });

        // Creating the game
        var options = 
        {
            width: width,
            height: height,
            fontSize: 16,
            fontFamily: "Noto",
            fg: "#000000",
            bg: "#ffffff",                    
        };        

        var display = new ROT.Display(options)     
                
        // Creating the canvasHUD
        var options = 
        {
            width: 7,
            height: height,
            fontSize: 16,
            fontFamily: "Noto",
            fg: "#000000",
            bg: "#ffffff",                    
        };        

        var displayHUD = new ROT.Display(options) 

        // LAST STEP => adding the display
        document.body.appendChild(displayHUD.getContainer())
        document.body.appendChild(display.getContainer())

        // *************************************************
        // Define the settings for lighting
        // field of view radius
        var fovRadius = 5; 
        // Radius of the player's medium field of view, 
        // between what they can see and what they can't see
        var fovMediumRadius = 3;
        // Color of objects in the field of view
        var lightColor = "black"; 
        // Color of objects in the medium field of view
        var mediumColor = "darkgrey"; 

        // *************************************************
        var title = "ROGUELIKE";
        var commands = "SPACE - action / SHIFT - sprint";
        var subtitle = "press a key";
        display.drawText(
                Math.floor(display.getOptions().width / 2) - 
                Math.floor(title.length / 2), 5, title);
        display.drawText(
                Math.floor(display.getOptions().width / 2) - 
                Math.floor(commands.length / 2), 7, commands);
        display.drawText(
                Math.floor(display.getOptions().width / 2) - 
                Math.floor(subtitle.length / 2), 10, subtitle);

        var state = 0 // 0 - menu / 1 - gameplay / 2 - gameover

        // Creation of the player
        var player = 
        {
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            carAlive: '🧔',
            carDead: '☠️',
            life: 100,
            stepsTot: 0,
            speed: 1,
            sprintSpeed: 2,
            isSprinting: false,
            isUsingTool: false,
            sprouts: 0,
            mushrooms: 0,
            water: 0,
            wood: 0,
            stones: 0,
            axe: 30,
            pickaxe: 30,
            bow: 10,
            fishingpole: 10,
            distance: function(x, y) {
                // Calculate the distance between the player 
                // (player.x, player.y) and the cell (x, y)
                var dx = Math.abs(this.x - x);
                var dy = Math.abs(this.y - y);
                return Math.sqrt(dx * dx + dy * dy);
            }            
        }

        // basecamp creation
        var basecamp = 
        {
            x: player.x,
            y: player.y,
            sprouts: 0,
            mushrooms: 0,
            water: 0,
            wood: 0,
            stones: 0                       
        }    

        function resetbasecamp()
        {
            basecamp.x = player.x
            basecamp.y = player.y
            basecamp.sprouts = 0
            basecamp.mushrooms = 0
            basecamp.water = 0
            basecamp.wood = 0
            basecamp.stones = 0              
        }

        // Declaration of the array of animals
        var animals = [];

        // Creating three aggressive animals with random positions
        for (var i = 0; i < numAggroAnimals; i++) 
        {            
            let animalsarray = woodsEnemy.split(',')
            let length = animalsarray.length;
            let dice = Math.floor((Math.random() * length)); 
            let animalType = animalsarray[dice];
            let aggro = Math.floor((Math.random() * 1));

            // Definition of the object for the aggressive animal
            var animal = 
            {
                x: Math.floor(Math.random() * width),
                y: Math.floor(Math.random() * height),
                char: animalType,
                life: 3,
                speed: 1,
                sightRange: 5,                
                aggressiveness: aggro,
                isChasingPlayer: false, // Is it chasing the player?
                isPlayerNearby: function() 
                {
                    // Detects if the player is in proximity of the animal 
                    // and whether the animal is aggressive enough to attack
                    return Math.abs(player.x - this.x) 
                        <= this.sightRange && Math.abs(player.y - this.y) 
                        <= this.sightRange && Math.random() < this.aggressiveness;
                },            
                moveTowardsPlayer: function() 
                {
                    // Move the animal towards the player using the A* algorithm
                    var path = findPath(this.x, this.y, player.x, player.y);
                    if (path && path.length > 1) 
                    {
                        this.x = path[1].x;
                        this.y = path[1].y;
                    }
                },
                attackPlayer: function() 
                {
                    // Attack the player
                    player.life -= 10;
                }
            };  

            animals.push(animal);
        }

        function createMap () 
        {            
            for (var x = 0; x < width; x++) 
            {
                map[x] = {};
                for (var y = 0; y < height; y++) 
                {
                    var rand = Math.random();
                    if (x >= player.x - 1 && x <= player.x + 1
                         && y >= player.y - 1 && y <= player.y + 1) {
                        // Set emptyChar for tiles around the player
                        map[x][y] = emptyChar;  
                    } else if (rand < 0.1) {
                        map[x][y] = '💧';
                    } else if (rand < 0.2) {
                        map[x][y] = (Math.random() < 0.7) ? 
                            carSprouts : carMushrooms;
                    } else if (rand < 0.7) {
                        map[x][y] = (Math.random() < 0.2) ? '🌳' : '🌲';
                    } else if (rand < 0.75) {
                        map[x][y] = String.fromCharCode(9968);
                    } else 
                    {
                        map[x][y] = emptyChar; 
                    }
                }
            }
            
            // Save the basecamp position
            map[basecamp.x][basecamp.y] = carBasecamp
        }
        createMap();    
        
        function drawAnimals() 
        {
            animals.forEach(function(animal) 
            {
                display.draw(animal.x, animal.y, animal.char);
            });
        }

        // Function for the animal's update
        function updateAnimals() 
        {
            animals.forEach(function(animal) {

                const dx = player.x - animal.x;
                const dy = player.y - animal.y;
                const distance = Math.sqrt(dx*dx + dy*dy);

                if (distance <= 1 && isPlayerFighting) {
                    // The player is fighting and the animal 
                    // is close enough to be attacked

                    // For example, reduce the animal's life by 10 points
                    animal.life -= 10; 
                }                                
            
                if (distance <= 5) 
                {
                    // The animal is close enough to the player, it chases
                    const sx = dx > 0 ? 1 : -1;
                    const sy = dy > 0 ? 1 : -1;
            
                    // Check if the movement is possible
                    if (map[animal.x + sx][animal.y] === emptyChar) 
                    {
                        animal.x += sx;
                    } 
                    else if (map[animal.x][animal.y + sy] === emptyChar) 
                    {
                        animal.y += sy;
                    }
            
                    // The animal can attack the player if it's close 
                    // enough and the player is not running
                    if (distance <= 1 && !player.isSprinting) 
                    {
                        player.life -= 10;
                    }
                }
                else
                {
                    // The animal is too far from the player, it moves randomly
                    const possibleMoves = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
                    const validMoves = possibleMoves.filter((move) => 
                    {
                        const x = animal.x + move.x;                
                        const y = animal.y + move.y;
                        return x >= 0 && x < width && y >= 0 && y < height && map[x][y] === emptyChar;
                    });
            
                    if (validMoves.length > 0) 
                    {
                        // Randomly selects one of the available adjacent squares
                        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                        animal.x += move.x;
                        animal.y += move.y;
                    }
                }
            });
        }
        
        function findPath(startX, startY, endX, endY) 
        {
            // Create an instance of SimplexNoise to generate 
            // the random noise map
            var noise = new ROT.Noise.Simplex();
            
            // Define the function to calculate the movement cost between 
            // two adjacent cells
            var getCost = function(x, y) 
            {
                // Calculate the noise value for the current cell
                var cell = noise.get(x/width, y/height) * 100;  
                // Assign a higher cost to cells that are more difficult 
                // to traverse
                return (cell > 50 ? 1 : 10);  
            };
            
            // Define the pathfinding graph using the generated map
            var graph = new ROT.Path.AStar(endX, endY, getCost, {topology:8});
            
            // Find the path from the starting position to the 
            // destination position
            var path = [];
            var pathCallback = function(x, y) {
              path.push({x: x, y: y});
            };
            graph.compute(startX, startY, pathCallback);
            
            // Return the found path
            return path;
        }

        // Player drawing function
        function drawPlayer () 
        {
            var char = ''
            if (playerDied === true) char = player.carDead 
            else char = player.carAlive

            display.draw(player.x, player.y, char)
        }

        // Player's basecamp drawing function
        function drawBasecamp() 
        {
            display.draw(basecamp.x, basecamp.y, carBasecamp)
        }        

        function drawHUD() 
        {                  
            displayHUD.clear();

            // Draw the text for the HUD
            displayHUD.draw(0,0,carPlayer)
            displayHUD.drawText(1, 0, ": " + player.life, "#fff", "#000");
            displayHUD.draw(0,1,carSprouts)            
            displayHUD.drawText(1, 1, ': ' + player.sprouts, "#fff", "#000");           
            displayHUD.draw(0,2,carWater)
            displayHUD.drawText(1, 2, ': ' + player.water, "#fff", "#000");             
            displayHUD.draw(0,3,carMushrooms)
            displayHUD.drawText(1, 3, ': ' + player.mushrooms, "#fff", "#000");              
            displayHUD.draw(0,4,carWood)
            displayHUD.drawText(1, 4, ': ' + player.wood, "#fff", "#000");
            displayHUD.draw(0,5,carStones)
            displayHUD.drawText(1, 5, ': ' + player.stones, "#fff", "#000");

            displayHUD.draw(0,7,carAxe)
            displayHUD.drawText(1, 7, ': ' + player.axe, "#fff", "#000");
            displayHUD.draw(0,8,carPickaxe)
            displayHUD.drawText(1, 8, ': ' + player.pickaxe, "#fff", "#000");     
            displayHUD.draw(0,9,carBow)
            displayHUD.drawText(1, 9, ': ' + player.bow, "#fff", "#000");     
            displayHUD.draw(0,10,carFishingpole)
            displayHUD.drawText(1, 10, ': ' + player.fishingpole, "#fff", "#000");                                                               

            displayHUD.drawText(0, 14, 'DAY: ' + day, "#fff", "#000");  
            displayHUD.draw(0,16,carShoes)
            displayHUD.drawText(1, 16, ': ' + player.stepsTot, "#fff", "#000");  
            displayHUD.draw(0,17,carSprouts)
            displayHUD.drawText(1, 17, ': ' + basecamp.sprouts, "#fff", "#000");  
            displayHUD.draw(0,18,carWater)
            displayHUD.drawText(1, 18, ': ' + basecamp.water, "#fff", "#000");  
            displayHUD.draw(0,19,carMushrooms)
            displayHUD.drawText(1, 19, ': ' + basecamp.mushrooms, "#fff", "#000");  
            displayHUD.draw(0,20,carWood)
            displayHUD.drawText(1, 20, ': ' + basecamp.wood, "#fff", "#000");  
            displayHUD.draw(0,21,carStones)
            displayHUD.drawText(1, 21, ': ' + basecamp.stones, "#fff", "#000");  
        }

        function drawMapWithLighting() 
        {          
            for (var x = 0; x < width; x++) 
            {
              for (var y = 0; y < height; y++) 
              {
                var tile = map[x][y];
                var distance = player.distance(x, y);
          
                if (distance <= fovRadius) 
                {
                  display.draw(x, y, tile, lightColor);
                }
                else if (distance > fovRadius && distance 
                            <= fovRadius + fovMediumRadius)
                {
                  display.draw(x, y, tile, mediumColor);
                } 
                else
                {                  
                  //display.draw(x, y, '█', lightColor);
                  display.draw(x, y, '.', lightColor);
                }
              }
            }
        }

        function drawGameOver() 
        {
            displayHUD.clear(); // Clear the screen
            display.clear(); // Clear the screen

            var gameover = "*** GAME OVER ***";
            var commands = "press SPACE";
            display.drawText(
                    Math.floor(display.getOptions().width / 2) - 
                    Math.floor(gameover.length / 2), 5, gameover);
            display.drawText(
                    Math.floor(display.getOptions().width / 2) - 
                    Math.floor(commands.length / 2), 7, commands);            
        }        
                 
        // Player movement function
        function movePlayer (dx, dy) 
        {
            // Check if the player is sprinting
            var currentSpeed = player.isSprinting ? 
                                player.sprintSpeed : player.speed

            var newX = player.x + dx * currentSpeed
            var newY = player.y + dy * currentSpeed

            // Check if the movement is possible
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) 
            {                                      
                // If I don't have movement points, I EXIT
                if (player.life <= 0) 
                {
                    player.life = 0;
                    
                    // After the steps, use sprouts
                    if (player.sprouts > 0) 
                    {
                        player.life = player.life + 1
                        player.sprouts = player.sprouts - 1
                    }
                    else if (player.sprouts <= 0) 
                    {
                        player.sprouts = 0;

                        if (player.water > 0) 
                        {
                            player.life = player.life + 1
                            player.water = player.water - 1
                        }
                        else
                        {
                            player.water = 0

                            if (player.mushrooms > 0) 
                            {
                                player.life = player.life + 1
                                player.mushrooms = player.mushrooms - 1
                            }
                            else
                            {
                                player.mushrooms = 0

                                playerDied = true
                                state = 2                                

                                player.life = 100
                                player.stepsTot = 0
                                player.isSprinting = false
                                player.isUsingTool = false
                                player.sprouts = 0
                                player.mushrooms = 0
                                player.water = 0
                                player.wood = 0
                                player.stones = 0
                                player.axe = 30
                                player.pickaxe = 30
                                player.bow = 10
                                player.fishingpole = 10   
                                
                                resetbasecamp()                               
                            }                        
                        }
                    }
                }

                var tile = map[newX][newY]                
                if (tile === emptyChar) 
                {
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 1;
                                    
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 
                } 
                else if (tile === carBasecamp) 
                {
                    player.x = newX
                    player.y = newY     
                    
                    isPlayerInBase = true                   

                    basecamp.sprouts = player.sprouts
                    basecamp.mushrooms = player.mushrooms
                    basecamp.water = player.water
                    basecamp.wood = player.wood
                    basecamp.stones = player.stones              

                    player.life = 100;
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 
                    player.sprouts = 0
                    player.mushrooms = 0
                    player.water = 0
                    player.wood = 0
                    player.stones = 0

                    // Every animal stops chasing
                    animals.forEach(function(animal) 
                    {
                        animal.isChasingPlayer = false
                    });                    

                    // ***************************************
                    // *** One day has passed
                    // ***************************************
                    counterDaysTemp = counterDaysTemp + 1;
                    if (counterDaysTemp >= DAYSMINNEWDAY)
                    {
                        day = day + 1;
                        counterDaysTemp = 0;                                                
                    }
                }                 
                else if (tile === carSprouts) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 1;
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 

                    player.sprouts = player.sprouts + 1
                }  
                else if (tile === carMushrooms) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 1;
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 

                    player.mushrooms = player.mushrooms + 1
                }   
                else if (tile === carWater) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 1;
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 

                    player.water = player.water + 1
                }      
                else if (player.isUsingTool && (tile === '🌳' ||  tile === '🌲')) 
                {
                    if (player.axe <= 0)
                    {
                        player.axe = 0
                        return;
                    }

                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 2
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 
                    player.wood = player.wood + 2
                    player.axe = player.axe - 1
                }        
                else if (player.isUsingTool 
                            && tile === String.fromCharCode(9968)) 
                {
                    if (player.pickaxe <= 0)
                    {
                        player.pickaxe = 0
                        return;
                    }

                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.life = player.life - 2
                    // Update the total steps taken by the player
                    player.stepsTot = player.stepsTot + 1 
                    player.stones = player.stones + 2
                    player.pickaxe = player.pickaxe - 1
                }                                                                                     
            }
        }

        /*
        // Set the interval for updating animals and drawing
        setInterval(function() 
        {
            updateAnimals();
        }, 1000/2); // Run every second (you can adjust the interval time as desired)
        */

        function draw()
        {            
            // Update the behavior of the animals
            updateAnimals()

            display.clear();

            // Draw the map with lighting effect
            drawMapWithLighting();            

            drawPlayer();
            drawBasecamp();

            drawAnimals();

            drawHUD();            
        }

        // Keyboard input handling
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Variable to keep track of the state of the SPACE key
        player.isUsingTool = false
        isPlayerInBase = false

        function handleKeyDown(event) 
        {
            if (playerDied === true) 
            {
                // If the player is dead, display "GAME OVER" 
                // and allow to restart
                drawGameOver();
            }

            if (state === 0)
            {
                switch(event.code) 
                {
                    default:
                        draw()
                        state = 1
                        break;                    
                }
            }
            else if (state === 1)
            {
                switch(event.code) 
                {
                    case "ArrowUp":
                        movePlayer(0, -1);
                        draw()
                        soundSteps.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                        

                        break;
                    case "ArrowDown":
                        movePlayer(0, 1);
                        draw()
                        soundSteps.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "ArrowLeft":
                        movePlayer(-1, 0);
                        draw()
                        soundSteps.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "ArrowRight":
                        movePlayer(1, 0);
                        draw()
                        soundSteps.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "Space":
                        // Set player.isUsingTool to true when the SPACE key is pressed
                        player.isUsingTool = true;                         
                        isPlayerFighting = true;                        
                        break;
                    case "ShiftLeft":
                        player.isSprinting = true;
                        break;                    
                    default:
                        // Do nothing for other keys
                        break;
                }
            }
            else if (state === 2)
            {
                switch(event.code) 
                {
                    case "Space":
                        // The player can press space to restart the game
                        // Reset the player's death flag for the next game start
                        playerDied = false; 
                        state = 1
                        
                        player.x = Math.floor(Math.random() * width)
                        player.y = Math.floor(Math.random() * height)                        
                        resetbasecamp()
                        createMap()

                        draw()                        
                        break;

                    default:
                        break;                    
                }
            }

        }

        function handleKeyUp(event) 
        {
            switch(event.code) 
            {
                case "Space":
                    // Set player.isUsingTool to false 
                    // when the SPACE key is released
                    player.isUsingTool = false; 
                    isPlayerFighting = true
                    break;                
                case "ShiftLeft":
                    player.isSprinting = false;
                    break;
                default:
                    break;
            }
        }       
    }
}


