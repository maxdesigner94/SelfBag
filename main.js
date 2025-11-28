// --- Dati Fittizi per le Auto e le Immagini Stock ---
// NOTA: In un progetto reale, queste URL andrebbero sostituite con asset locali
// e caricate tramite il Loader di Pixi.js per performance ottimali.
const CAR_MODELS = [
    { 
        id: 'model-a', 
        name: 'Alpha GT Elettrica', 
        description: 'La sportiva del futuro: 0-100 in 3.1s, autonomia estesa.',
        imgUrl: 'https://images.unsplash.com/photo-1620712711739-1f4a43b7431c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800',
        position: { x: -400, y: 0 } // Posizione 3D simulata
    },
    { 
        id: 'model-b', 
        name: 'Beta SUV Urbano', 
        description: 'Comfort e tecnologia per la città, spazioso e sicuro.',
        imgUrl: 'https://images.unsplash.com/photo-1594236371720-d3d62325c7e0?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800',
        position: { x: 0, y: 0 } 
    },
    { 
        id: 'model-c', 
        name: 'Gamma X Lusso', 
        description: 'Eleganza ineguagliabile e interni artigianali di pregio.',
        imgUrl: 'https://images.unsplash.com/photo-1549399583-04e43f545465?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800',
        position: { x: 400, y: 0 } 
    }
];

// --- Configurazione Pixi.js ---
const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x121212, // Corrisponde a var(--bg-color)
    antialias: true,
});

document.getElementById('pixi-container').appendChild(app.view);

// Contenitore per tutti gli elementi 3D/Interattivi (il nostro "Mondo")
const worldContainer = new PIXI.Container();
app.stage.addChild(worldContainer);

// Variabili per l'interazione
let isDragging = false;
let startX = 0;
let startY = 0;
let rotation = 0;
let currentActiveCar = null;

// --- Funzioni di Inizializzazione ---

/**
 * Carica le auto nella scena 3D simulata.
 */
function loadCars() {
    // Aggiungi un "pavimento" astratto per l'effetto 3D
    const floor = new PIXI.Graphics();
    floor.beginFill(0x1a1a1a);
    // Simula una prospettiva 3D distorcendo il rettangolo
    floor.drawPolygon([
        0, 100, // Alto a sinistra
        app.screen.width, 100, // Alto a destra
        app.screen.width, app.screen.height, // Basso a destra
        0, app.screen.height // Basso a sinistra
    ]);
    floor.endFill();
    floor.pivot.set(app.screen.width / 2, app.screen.height / 2);
    floor.position.set(app.screen.width / 2, app.screen.height * 0.7);
    worldContainer.addChild(floor);


    CAR_MODELS.forEach(carData => {
        // Creazione dell'immagine dell'auto (Sprite)
        const car = PIXI.Sprite.from(carData.imgUrl);

        // Impostazioni base
        car.anchor.set(0.5); // Punto di rotazione e posizionamento al centro
        car.scale.set(0.3); // Scala iniziale
        car.x = carData.position.x;
        car.y = carData.position.y;
        
        // Dati di riferimento
        car.carData = carData;

        // Abilita interazione e cursor
        car.eventMode = 'static';
        car.cursor = 'pointer';

        // Animazione in loop con Anime.js (effetto "respiro" o "galleggiamento")
        anime({
            targets: car.scale,
            x: [car.scale.x * 0.98, car.scale.x],
            y: [car.scale.y * 0.98, car.scale.y],
            duration: 4000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutQuad'
        });

        // Gestione del Click (Interazione)
        car.on('pointerdown', (event) => {
            event.stopPropagation(); // Impedisce che l'evento di trascinamento del mondo venga attivato
            handleCarSelection(car);
        });

        worldContainer.addChild(car);
    });

    // Posiziona il "mondo" simulato al centro della vista
    worldContainer.x = app.screen.width / 2;
    worldContainer.y = app.screen.height / 2;
}

/**
 * Gestisce l'interazione al click su un'auto.
 * @param {PIXI.Sprite} car - L'oggetto auto cliccato.
 */
function handleCarSelection(car) {
    if (currentActiveCar === car) return; // Se è già selezionata, ignora

    // 1. Zoom e Centratura sul Modello (Animazione GSAP)
    gsap.to(worldContainer, {
        x: app.screen.width / 2 - car.x * worldContainer.scale.x,
        y: app.screen.height / 2 - car.y * worldContainer.scale.y,
        duration: 1.5,
        ease: 'power3.inOut'
    });
    
    // Zoom sull'auto selezionata
    gsap.to(worldContainer.scale, {
        x: 1.2,
        y: 1.2,
        duration: 1.5,
        ease: 'power3.inOut'
    });

    // 2. Aggiornamento Pannello Informazioni UI
    const infoPanel = document.getElementById('info-panel');
    document.getElementById('car-title').textContent = car.carData.name;
    document.getElementById('car-description').textContent = car.carData.description;

    // Mostra il pannello
    infoPanel.classList.add('active');

    // 3. Effetto Visivo Sull'Auto (Es. filtro glow/colore)
    // Per semplicità, cambiamo l'opacità
    worldContainer.children.forEach(child => {
        if (child instanceof PIXI.Sprite) {
             gsap.to(child, { alpha: child === car ? 1 : 0.4, duration: 0.5 });
        }
    });

    currentActiveCar = car;
}

/**
 * Reimposta la vista e nasconde il pannello informazioni.
 */
function resetView() {
    gsap.to(worldContainer, {
        x: app.screen.width / 2,
        y: app.screen.height / 2,
        duration: 1.5,
        ease: 'power3.inOut'
    });

    gsap.to(worldContainer.scale, {
        x: 1,
        y: 1,
        duration: 1.5,
        ease: 'power3.inOut'
    });

    document.getElementById('info-panel').classList.remove('active');
    
    // Ripristina l'opacità di tutte le auto
    worldContainer.children.forEach(child => {
        if (child instanceof PIXI.Sprite) {
             gsap.to(child, { alpha: 1, duration: 0.5 });
        }
    });

    currentActiveCar = null;
}


// --- Gestione Interazione 3D (Trascinamento per Ruotare il Mondo) ---

function onDragStart(event) {
    isDragging = true;
    // Salva la posizione iniziale del mouse e la rotazione corrente del mondo
    startX = event.global.x;
    startY = event.global.y;
    rotation = worldContainer.rotation;
    app.view.style.cursor = 'grabbing';
    
    // Se c'era un'auto selezionata, deselezionala
    if (currentActiveCar) {
        resetView();
    }
}

function onDragEnd() {
    isDragging = false;
    app.view.style.cursor = 'grab';
}

function onDragMove(event) {
    if (!isDragging) return;

    // Calcola lo spostamento orizzontale
    const deltaX = event.global.x - startX;
    
    // Regola la rotazione in base allo spostamento
    // Il fattore 0.005 determina la sensibilità della rotazione
    worldContainer.rotation = rotation + (deltaX * 0.005);
}

// Configura gli eventi di interazione sul canvas
worldContainer.eventMode = 'static';
worldContainer.cursor = 'grab';
worldContainer.on('pointerdown', onDragStart);
worldContainer.on('pointerup', onDragEnd);
worldContainer.on('pointerupoutside', onDragEnd);
worldContainer.on('pointermove', onDragMove);

// --- Inizio Esecuzione ---
loadCars();
resetView(); // Imposta la vista iniziale e la scala a 1
