// ==========================================================
// 1. SETUP INIZIALE - SCENA, RENDERER, TELECAMERA
// ==========================================================

const canvas = document.getElementById('webgl-canvas');
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1C2833); // Sfondo scuro/minimalista

// Telecamera (Camera)
// Inizialmente posizionata per una vista "Hero"
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 1.5, 6);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true // Anti-aliasing per una grafica più pulita
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; // Abilita le ombre
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo di ombre più morbido

// Gestione ridimensionamento finestra
window.addEventListener('resize', () => {
    // Aggiorna dimensioni
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Aggiorna telecamera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Aggiorna renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================================
// 2. CREAZIONE MODELLO (CAR PLACEHOLDER)
// ==========================================================

// Creiamo un gruppo per l'auto, così possiamo ruotare tutto in blocco
const carGroup = new THREE.Group();
carGroup.position.y = 0.5; // Solleviamo leggermente l'auto
scene.add(carGroup);

// Materiali (Studio look: metallico lucido)
const carBodyMat = new THREE.MeshPhongMaterial({
    color: 0xCF2A27, // Rosso fiammante
    shininess: 100,
    specular: 0xFFFFFF
});

const wheelMat = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 50,
    specular: 0x888888
});

// Geometrie Semplificate (Rappresentazione stilizzata di un'auto)
const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 1.5), carBodyMat);
body.castShadow = true;
body.receiveShadow = true;
carGroup.add(body);

const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 1.2), new THREE.MeshPhongMaterial({ color: 0x555555 }));
cabin.position.set(0.5, 1.1, 0);
cabin.castShadow = true;
cabin.receiveShadow = true;
carGroup.add(cabin);

// Ruote (Semplicistiche)
const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
const createWheel = (x, z) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, -0.7, z);
    wheel.castShadow = true;
    wheel.receiveShadow = true;
    carGroup.add(wheel);
};

createWheel(1.5, 1); // Anteriore Destra
createWheel(-1.5, 1); // Anteriore Sinistra
createWheel(1.5, -1); // Posteriore Destra
createWheel(-1.5, -1); // Posteriore Sinistra


// ==========================================================
// 3. LUCI (AMBIENTE STUDIO MINIMALISTA)
// ==========================================================

// 1. Luce Ambientale (Molto leggera)
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Colore tenue, intensità media
scene.add(ambientLight);

// 2. Spotlight 1 (Key Light - Luce principale)
const spotLight1 = new THREE.SpotLight(0xFFFFFF, 3, 15, Math.PI * 0.2, 0.5, 2);
spotLight1.position.set(5, 5, 5);
spotLight1.target.position.copy(carGroup.position);
spotLight1.castShadow = true;
spotLight1.shadow.mapSize.width = 1024;
spotLight1.shadow.mapSize.height = 1024;
scene.add(spotLight1);
scene.add(spotLight1.target);

// 3. Spotlight 2 (Fill Light - Luce di riempimento)
const spotLight2 = new THREE.SpotLight(0xADD8E6, 1.5, 15, Math.PI * 0.2, 0.5, 2); // Tonalità leggermente bluastra
spotLight2.position.set(-5, 3, -5);
spotLight2.target.position.copy(carGroup.position);
scene.add(spotLight2);
scene.add(spotLight2.target);

// Piano di appoggio (Minimalista)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshPhongMaterial({ color: 0x34495E, side: THREE.DoubleSide })
);
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);


// ==========================================================
// 4. INTERAZIONE DRAG (ROTAZIONE SX/DX)
// ==========================================================

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationSpeed = 0.005;

// Gestione mouse down/touch start
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
});
canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousMousePosition.x = e.touches[0].clientX;
    previousMousePosition.y = e.touches[0].clientY;
});

// Gestione mouse up/touch end
const stopDragging = () => {
    isDragging = false;
};
window.addEventListener('mouseup', stopDragging);
window.addEventListener('touchend', stopDragging);
window.addEventListener('mouseleave', stopDragging); // Utile se il mouse esce dalla finestra

// Gestione movimento
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    
    // Ruota il gruppo dell'auto sull'asse Y
    carGroup.rotation.y += deltaX * rotationSpeed;

    previousMousePosition.x = e.clientX;
});
canvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    
    // Ruota il gruppo dell'auto sull'asse Y
    carGroup.rotation.y += deltaX * rotationSpeed;

    previousMousePosition.x = e.touches[0].clientX;
});


// ==========================================================
// 5. ANIMAZIONE CINEMATICA SCROLL-BASED (GSAP)
// ==========================================================

// Registra il plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Timeline per le animazioni al variare dello scroll
const cinematicTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: "#content-overlay", // L'intera area scorrevole
        start: "top top",
        end: "bottom bottom",
        scrub: true, // Sincronizza l'animazione con lo scroll
    }
});

// Sezione 1: Iniziale (Hero)
// Nessuna animazione se non la rotazione libera data dal drag

// Sezione 2: Animazione Cinematico (Ingrandimento/Prospettiva)
// Quando si scorre verso la sezione 1
cinematicTimeline.to(camera.position, { 
    x: -3, 
    y: 1, 
    z: 2, 
    duration: 1 
}, 0);

cinematicTimeline.to(carGroup.rotation, { 
    y: Math.PI * 0.5, // Ruota di 90 gradi per mostrare il lato
    duration: 1 
}, 0); 
// N.B.: La rotazione del drag si SOMMERÀ a questa rotazione GSAP, creando un effetto dinamico.

// Sezione 3: Dettagli Tecnici (Zoom in)
// Quando si scorre verso la sezione 2
cinematicTimeline.to(camera.position, { 
    x: 0, 
    y: 1, 
    z: 1.5, // Zoom più vicino
    duration: 1 
}, 1); 

cinematicTimeline.to(carGroup.rotation, { 
    y: Math.PI * 1.5, // Ruota di altri 180 gradi
    duration: 1 
}, 1); 

// Assicurati che la telecamera "guardi" sempre l'auto
// (Utilizziamo un updateTarget, dato che non usiamo OrbitControls completo)
const updateTarget = () => {
    camera.lookAt(carGroup.position);
};


// ==========================================================
// 6. LOOP DI RENDERIZZAZIONE (GAME LOOP)
// ==========================================================

const tick = () => {
    // Aggiorna la telecamera per puntare l'auto (anche dopo le modifiche di GSAP)
    updateTarget();
    
    // Renderizza la scena
    renderer.render(scene, camera);

    // Chiama tick al prossimo frame
    window.requestAnimationFrame(tick);
};

// Avvia il loop
tick();


