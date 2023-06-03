var Game = {
    init: 
    function() 
    {
        // Impostazione della mappa di gioco
        var map = {}
        const width = 64
        const height = 32
        const emptyChar=""
        const carAscia = '🪓'
        const carPiccone = '⛏️'
        const carArco = '🏹'
        const carCanna = '🎣'
        const carCampoBase = '⛺'
        const carPlayer = '🧔'        
        const carGermogli = '🌱'
        const carFunghi = '🍄'
        const carAcqua = '💧'
        const carLegno = '🪵'       
        const carPietre = String.fromCharCode(9968)
        const carScarpa = '🥾'
        const carSight = ''
        const numAnimaliAggressivi = Math.floor((Math.random() * 20));

        const boscoEnemy = "🐻,🐺,🐗,🐅,🦍";    

        var playerDied = new Boolean(false)
        var isPlayerInBase = new Boolean(false)
        var isPlayerFighting = new Boolean(false)        

        let day = 1;
        const GIORNIMINNEWDAY = 10;
        let counterGiorniTemp = 0;     
        
        var soundPassi = new Howl({
            src: ['suonoPassi.wav']
        });
                  
        var soundChop = new Howl({
            src: ['chop.mp3']
        });

        // Creazione del gioco
        var options = 
        {
            //canvas: canvas,
            width: width,
            height: height,
            fontSize: 16,
            fontFamily: "Noto",
            fg: "#000000",
            bg: "#ffffff",            
            // altre opzioni
        };        

        var display = new ROT.Display(options)     
                
        // Creazione del canvasHUD
        var options = 
        {
            //canvas: canvas,
            width: 7,
            height: height,
            fontSize: 16,
            fontFamily: "Noto",
            fg: "#000000",
            bg: "#ffffff",            
            // altre opzioni
        };        

        var displayHUD = new ROT.Display(options) 

        // ULTIMO PASSO => aggiungo il display
        document.body.appendChild(displayHUD.getContainer())
        document.body.appendChild(display.getContainer())

        // ********************************************************************
        // Definisci le impostazioni per l'illuminazione
        var fovRadius = 5; // Raggio del campo visivo del giocatore
        var fovMediumRadius = 3;// Raggio del campo visivo medio del giocatore, tra quello che vede e quello che non vede
        var lightColor = "black"; // Colore degli oggetti nel campo visivo
        var mediumColor = "darkgrey"; // Colore degli oggetti nel campo visivo medio   

        // ********************************************************************
        var title = "WOODVIVAL";
        var comandi = "SPACE - action / SHIFT - sprint";
        var subtitle = "premi un tasto";
        display.drawText(Math.floor(display.getOptions().width / 2) - Math.floor(title.length / 2), 5, title);
        display.drawText(Math.floor(display.getOptions().width / 2) - Math.floor(comandi.length / 2), 7, comandi);
        display.drawText(Math.floor(display.getOptions().width / 2) - Math.floor(subtitle.length / 2), 10, subtitle);

        var state = 0 // 0 - menu / 1 - gameplay / 2 - gameover

        // Creazione del protagonista
        var player = 
        {
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            carVivo: '🧔',
            carMorto: '☠️',
            vita: 100,
            passiTot: 0,
            speed: 1,
            sprintSpeed: 2,
            isSprinting: false,
            isUsingTool: false,
            germogli: 0,
            funghi: 0,
            acqua: 0,
            legno: 0,
            pietre: 0,
            ascia: 30,
            piccone: 30,
            arco: 10,
            canna: 10,
            distance: function(x, y) {
                // Calcola la distanza tra il giocatore (player.x, player.y) e la cella (x, y)
                var dx = Math.abs(this.x - x);
                var dy = Math.abs(this.y - y);
                return Math.sqrt(dx * dx + dy * dy);
            }            
        }

        // creazione campo base
        var campobase = 
        {
            x: player.x,
            y: player.y,
            germogli: 0,
            funghi: 0,
            acqua: 0,
            legno: 0,
            pietre: 0                       
        }    

        function resetcampobase()
        {
            campobase.x = player.x
            campobase.y = player.y
            campobase.germogli = 0
            campobase.funghi = 0
            campobase.acqua = 0
            campobase.legno = 0
            campobase.pietre = 0              
        }

        // Dichiarazione dell'array degli animali
        var animals = [];

        // Creazione di tre animali aggressivi con posizioni casuali
        for (var i = 0; i < numAnimaliAggressivi; i++) 
        {            
            let arrayanimali = boscoEnemy.split(',')
            let length = arrayanimali.length;
            let dado = Math.floor((Math.random() * length)); 
            let tipoAnimale = arrayanimali[dado];
            let aggro = Math.floor((Math.random() * 1));

            //console.log(length+" - dado: "+dado+ " => "+tipoAnimale)

            // Definizione dell'oggetto per l'animale aggressivo
            var animal = 
            {
                x: Math.floor(Math.random() * width),
                y: Math.floor(Math.random() * height),
                char: tipoAnimale,
                vita: 3,
                speed: 1,
                sightRange: 5,                
                aggressiveness: aggro,
                isChasingPlayer: false, // sta inseguendo il giocatore?
                isPlayerNearby: function() 
                {
                    // Rileva se il giocatore è nelle vicinanze dell'animale e se l'animale è abbastanza aggressivo da attaccare
                    return Math.abs(player.x - this.x) <= this.sightRange && Math.abs(player.y - this.y) <= this.sightRange && Math.random() < this.aggressiveness;
                },            
                moveTowardsPlayer: function() 
                {
                    // Muovi l'animale verso il giocatore utilizzando l'algoritmo A*
                    var path = findPath(this.x, this.y, player.x, player.y);
                    if (path && path.length > 1) 
                    {
                        this.x = path[1].x;
                        this.y = path[1].y;
                    }
                },
                attackPlayer: function() 
                {
                    // Attacca il giocatore
                    player.vita -= 10;
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
                    if (x >= player.x - 1 && x <= player.x + 1 && y >= player.y - 1 && y <= player.y + 1) {
                        map[x][y] = emptyChar;  // Set emptyChar for tiles around the player
                    } else if (rand < 0.1) {
                        map[x][y] = '💧';
                    } else if (rand < 0.2) {
                        map[x][y] = (Math.random() < 0.7) ? carGermogli : carFunghi;
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
            
            //salvo il campobase
            map[campobase.x][campobase.y] = carCampoBase
        }
        createMap();    
        
        function drawAnimals() 
        {
            animals.forEach(function(animal) 
            {
                display.draw(animal.x, animal.y, animal.char);
            });
        }

        // Funzione per l'aggiornamento dell'animale
        function updateAnimals() 
        {
            animals.forEach(function(animal) {

                const dx = player.x - animal.x;
                const dy = player.y - animal.y;
                const distance = Math.sqrt(dx*dx + dy*dy);

                if (distance <= 1 && isPlayerFighting) {
                    // Il giocatore sta combattendo e l'animale è abbastanza vicino per essere attaccato
                    animal.vita -= 10; // Ad esempio, riduci la vita dell'animale di 10 punti
                }                                
            
                if (distance <= 5) 
                {
                    // L'animale è abbastanza vicino al giocatore, lo insegue
                    const sx = dx > 0 ? 1 : -1;
                    const sy = dy > 0 ? 1 : -1;
            
                    // Controlla se il movimento è possibile
                    if (map[animal.x + sx][animal.y] === emptyChar) 
                    {
                        animal.x += sx;
                    } 
                    else if (map[animal.x][animal.y + sy] === emptyChar) 
                    {
                        animal.y += sy;
                    }
            
                    // L'animale può attaccare il giocatore se è abbastanza vicino e il giocatore non sta correndo
                    if (distance <= 1 && !player.isSprinting) 
                    {
                        player.vita -= 10;
                    }
                }
                else
                {
                    // L'animale è troppo lontano dal giocatore, si sposta casualmente
                    const possibleMoves = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
                    const validMoves = possibleMoves.filter((move) => 
                    {
                        const x = animal.x + move.x;                
                        const y = animal.y + move.y;
                        return x >= 0 && x < width && y >= 0 && y < height && map[x][y] === emptyChar;
                    });
            
                    if (validMoves.length > 0) 
                    {
                        // Sceglie casualmente una delle caselle adiacenti disponibili
                        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                        animal.x += move.x;
                        animal.y += move.y;
                    }
                }

            });
        }
        
        function findPath(startX, startY, endX, endY) 
        {
            // Crea un'istanza di SimplexNoise per generare la mappa di rumore casuale
            var noise = new ROT.Noise.Simplex();
            
            // Definisci la funzione per calcolare il costo di spostamento tra due celle adiacenti
            var getCost = function(x, y) 
            {
              var cell = noise.get(x/width, y/height) * 100;  // Calcola il valore di rumore per la cella corrente
              return (cell > 50 ? 1 : 10);  // Assegna un costo maggiore alle celle più difficili da attraversare
            };
            
            // Definisci il grafo di ricerca del percorso utilizzando la mappa generata
            var graph = new ROT.Path.AStar(endX, endY, getCost, {topology:8});
            
            // Trova il percorso dalla posizione di partenza alla posizione di destinazione
            var path = [];
            var pathCallback = function(x, y) {
              path.push({x: x, y: y});
            };
            graph.compute(startX, startY, pathCallback);
            
            // Restituisci il percorso trovato
            return path;
        }

        // Funzione di disegno del protagonista
        function drawPlayer () 
        {
            var char = ''
            if (playerDied === true) char = player.carMorto 
            else char = player.carVivo

            display.draw(player.x, player.y, char)
        }

        // Funzione di disegno del campo base protagonista
        function drawCampobase () 
        {
            display.draw(campobase.x, campobase.y, carCampoBase)
        }        

        function drawHUD() 
        {                  
            displayHUD.clear();

            // Disegna il testo dell'HUD
            displayHUD.draw(0,0,carPlayer)
            displayHUD.drawText(1, 0, ": " + player.vita, "#fff", "#000");
            displayHUD.draw(0,1,carGermogli)            
            displayHUD.drawText(1, 1, ': ' + player.germogli, "#fff", "#000");           
            displayHUD.draw(0,2,carAcqua)
            displayHUD.drawText(1, 2, ': ' + player.acqua, "#fff", "#000");             
            displayHUD.draw(0,3,carFunghi)
            displayHUD.drawText(1, 3, ': ' + player.funghi, "#fff", "#000");              
            displayHUD.draw(0,4,carLegno)
            displayHUD.drawText(1, 4, ': ' + player.legno, "#fff", "#000");
            displayHUD.draw(0,5,carPietre)
            displayHUD.drawText(1, 5, ': ' + player.pietre, "#fff", "#000");

            displayHUD.draw(0,7,carAscia)
            displayHUD.drawText(1, 7, ': ' + player.ascia, "#fff", "#000");
            displayHUD.draw(0,8,carPiccone)
            displayHUD.drawText(1, 8, ': ' + player.piccone, "#fff", "#000");     
            displayHUD.draw(0,9,carArco)
            displayHUD.drawText(1, 9, ': ' + player.arco, "#fff", "#000");     
            displayHUD.draw(0,10,carCanna)
            displayHUD.drawText(1, 10, ': ' + player.canna, "#fff", "#000");                                                               

            displayHUD.drawText(0, 14, 'DAY: ' + day, "#fff", "#000");  
            displayHUD.draw(0,16,carScarpa)
            displayHUD.drawText(1, 16, ': ' + player.passiTot, "#fff", "#000");  
            displayHUD.draw(0,17,carGermogli)
            displayHUD.drawText(1, 17, ': ' + campobase.germogli, "#fff", "#000");  
            displayHUD.draw(0,18,carAcqua)
            displayHUD.drawText(1, 18, ': ' + campobase.acqua, "#fff", "#000");  
            displayHUD.draw(0,19,carFunghi)
            displayHUD.drawText(1, 19, ': ' + campobase.funghi, "#fff", "#000");  
            displayHUD.draw(0,20,carLegno)
            displayHUD.drawText(1, 20, ': ' + campobase.legno, "#fff", "#000");  
            displayHUD.draw(0,21,carPietre)
            displayHUD.drawText(1, 21, ': ' + campobase.pietre, "#fff", "#000");  

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
                else if (distance > fovRadius && distance <= fovRadius + fovMediumRadius)
                {
                  display.draw(x, y, tile, mediumColor);
                } 
                else
                {
                  //display.draw(x, y, tile, darkColor);
                  //display.draw(x, y, '█', lightColor);
                  display.draw(x, y, '.', lightColor);

                }
              }
            }
        }

        function drawGameOver() 
        {
            displayHUD.clear(); // Pulisci lo schermo
            display.clear(); // Pulisci lo schermo

            var gameover = "*** GAME OVER ***";
            var comandi = "premi SPACE";
            display.drawText(Math.floor(display.getOptions().width / 2) - Math.floor(gameover.length / 2), 5, gameover);
            display.drawText(Math.floor(display.getOptions().width / 2) - Math.floor(comandi.length / 2), 7, comandi);            
        }        
                 
        // Funzione di movimento del protagonista
        function movePlayer (dx, dy) 
        {
            // Controlla se il giocatore sta sprintando
            var currentSpeed = player.isSprinting ? player.sprintSpeed : player.speed

            var newX = player.x + dx * currentSpeed
            var newY = player.y + dy * currentSpeed

            // Controllo se il movimento è possibile
            if (newX >= 0 && newX < width && newY >= 0 && newY < height) 
            {                                      
                // se non ho punti movimento ESCO
                if (player.vita <= 0) 
                {
                    player.vita = 0;
                    
                    // dopo i passi uso cibo
                    if (player.germogli > 0) 
                    {
                        player.vita = player.vita + 1
                        player.germogli = player.germogli - 1
                    }
                    else if (player.germogli <= 0) 
                    {
                        player.germogli = 0;

                        if (player.acqua > 0) 
                        {
                            player.vita = player.vita + 1
                            player.acqua = player.acqua - 1
                        }
                        else
                        {
                            player.acqua = 0

                            if (player.funghi > 0) 
                            {
                                player.vita = player.vita + 1
                                player.funghi = player.funghi - 1
                            }
                            else
                            {
                                player.funghi = 0

                                playerDied = true
                                state = 2
                                console.log("MORTO")

                                player.vita = 100
                                player.passiTot = 0
                                player.isSprinting = false
                                player.isUsingTool = false
                                player.germogli = 0
                                player.funghi = 0
                                player.acqua = 0
                                player.legno = 0
                                player.pietre = 0
                                player.ascia = 30
                                player.piccone = 30
                                player.arco = 10
                                player.canna = 10   
                                
                                resetcampobase()                               

                            }
                            
                        }
                    }
                }

                var tile = map[newX][newY]                

                if (tile === emptyChar) 
                {
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 1;
                                    
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player
                } 
                else if (tile === carCampoBase) 
                {
                    player.x = newX
                    player.y = newY     
                    
                    isPlayerInBase = true                   

                    campobase.germogli = player.germogli
                    campobase.funghi = player.funghi
                    campobase.acqua = player.acqua
                    campobase.legno = player.legno
                    campobase.pietre = player.pietre              

                    player.vita = 100;
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player
                    player.germogli = 0
                    player.funghi = 0
                    player.acqua = 0
                    player.legno = 0
                    player.pietre = 0

                    // ogni animale smette di inseguire
                    animals.forEach(function(animal) 
                    {
                        animal.isChasingPlayer = false
                    });                    

                    // ***************************************
                    // *** PASSA UN GIORNO
                    // ***************************************
                    counterGiorniTemp = counterGiorniTemp + 1;
                    if (counterGiorniTemp >= GIORNIMINNEWDAY)
                    {
                        day = day + 1;
                        counterGiorniTemp = 0;                                                
                    }

                }                 
                else if (tile === carGermogli) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 1;
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player

                    player.germogli = player.germogli + 1
                }  
                else if (tile === carFunghi) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 1;
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player

                    player.funghi = player.funghi + 1
                }   
                else if (tile === carAcqua) 
                {
                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 1;
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player

                    player.acqua = player.acqua + 1
                }      
                else if (player.isUsingTool && (tile === '🌳' ||  tile === '🌲')) 
                {

                    if (player.ascia <= 0)
                    {
                        player.ascia = 0
                        return;
                    }

                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 2
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player
                    player.legno = player.legno + 2
                    player.ascia = player.ascia - 1
                }        
                else if (player.isUsingTool && tile === String.fromCharCode(9968)) 
                {

                    if (player.piccone <= 0)
                    {
                        player.piccone = 0
                        return;
                    }

                    map[newX][newY] = emptyChar
                    player.x = newX
                    player.y = newY

                    player.vita = player.vita - 2
                    player.passiTot = player.passiTot + 1 //aggiorno i passi totali percorsi dal player
                    player.pietre = player.pietre + 2
                    player.piccone = player.piccone - 1
                }                                                                     
                
            }
        }

        /*
        // Imposta l'intervallo di aggiornamento degli animali e il disegno
        setInterval(function() 
        {
            updateAnimals();
        }, 1000/2); // Esegui ogni secondo (puoi modificare il tempo di intervallo come desideri)
        */

        function draw()
        {            
            // Aggiorno il comportamento degli animali
            updateAnimals()

            display.clear();

            // Disegnare la mappa con effetto di illuminazione                                    
            drawMapWithLighting();            

            drawPlayer();
            drawCampobase();

            drawAnimals();

            drawHUD();            
        }

        // Gestione degli input da tastiera
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Variabile per tenere traccia dello stato del tasto SPACE
        player.isUsingTool = false
        isPlayerInBase = false

        function handleKeyDown(event) 
        {
            if (playerDied === true) 
            {
                // Se il giocatore è morto, mostra "GAME OVER" e permetti di ricominciare
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
                        soundPassi.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                        

                        break;
                    case "ArrowDown":
                        movePlayer(0, 1);
                        draw()
                        soundPassi.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "ArrowLeft":
                        movePlayer(-1, 0);
                        draw()
                        soundPassi.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "ArrowRight":
                        movePlayer(1, 0);
                        draw()
                        soundPassi.play();

                        if (player.isUsingTool == true)                    
                            soundChop.play();                         
                        break;
                    case "Space":
                        player.isUsingTool = true; // Imposta player.isUsingTool a true quando il tasto SPACE viene premuto  
                        
                        isPlayerFighting = true
                        //isPlayerFighting = !isPlayerFighting

                        break;
                    case "ShiftLeft":
                        player.isSprinting = true;
                        break;                    
                    default:
                        // non fare nulla per gli altri tasti
                        break;
                }
            }
            else if (state === 2)
            {
                switch(event.code) 
                {
                    case "Space":
                        // Il giocatore può premere un tasto per ricominciare la partita
                        playerDied = false; // Resetta il flag di morte del giocatore al prossimo inizio di partita
                        state = 1
                        
                        player.x = Math.floor(Math.random() * width)
                        player.y = Math.floor(Math.random() * height)                        
                        resetcampobase()
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
                    player.isUsingTool = false; // Imposta player.isUsingTool a false quando il tasto SPACE viene rilasciato
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


