import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registra il plugin ScrollTrigger (necessario per l'animazione scroll-based)
gsap.registerPlugin(ScrollTrigger);

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
// Inizialmente posizionata per una vista "Hero" (Leggermente dall'alto e laterale)
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
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================================
// 2. CREAZIONE MODELLO (CARICAMENTO MODELLO GLTF/GLB)
// ==========================================================

const loader = new GLTFLoader();

// Gruppo per l'auto, che sarà l'oggetto che ruoterà con drag e scroll
const carGroup = new THREE.Group();
scene.add(carGroup);

// URL PUBBLICO del modello 3D (Attualmente un modello di test GLTF)
// *** CAMBIA QUESTO LINK con il tuo file .glb di un'auto ***
const modelPath = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb'; 

loader.load(
    modelPath,
    (gltf) => {
        const carModel = gltf.scene;
        
        // !!! CONFIGURAZIONE FONDAMENTALE !!!
        // Ogni modello ha dimensioni diverse. Devi aggiustare la scala e la posizione Y.
        // Esempio per il BoomBox (sostituire con i valori corretti per l'auto):
        carModel.scale.set(30, 30, 30); 
        carModel.position.y = 0.5; // Solleva il modello sopra il pavimento

        // Attiva le ombre per tutti gli oggetti nel modello
        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        carGroup.add(carModel); 
        console.log('Modello 3D caricato con successo!');
    },
    (xhr) => {
        // Funzione per mostrare il progresso (utile per modelli grandi)
        // console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% caricato');
    },
    (error) => {
        console.error('Errore nel caricamento del modello 3D:', error);
    }
);


// ==========================================================
// 3. LUCI (AMBIENTE STUDIO MINIMALISTA)
// ==========================================================

// Luce Ambientale
const ambientLight = new THREE.AmbientLight(0x404040, 2.5);
scene.add(ambientLight);

// Spotlight 1 (Key Light - Luce principale)
const spotLight1 = new THREE.SpotLight(0xFFFFFF, 3, 15, Math.PI * 0.2, 0.5, 2);
spotLight1.position.set(5, 5, 5);
spotLight1.target.position.copy(new THREE.Vector3(0, 0.5, 0));
spotLight1.castShadow = true;
spotLight1.shadow.mapSize.width = 1024;
spotLight1.shadow.mapSize.height = 1024;
spotLight1.shadow.bias = -0.0001;
scene.add(spotLight1);
scene.add(spotLight1.target);

// Spotlight 2 (Fill Light - Luce di riempimento)
const spotLight2 = new THREE.SpotLight(0xADD8E6, 1.5, 15, Math.PI * 0.2, 0.5, 2); 
spotLight2.position.set(-5, 3, -5);
spotLight2.target.position.copy(new THREE.Vector3(0, 0.5, 0));
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
const rotationSpeed = 0.005;

// Funzioni handler per drag/touch
const startDragging = (clientX, clientY) => {
    isDragging = true;
    previousMousePosition.x = clientX;
    previousMousePosition.y = clientY;
};

const handleMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - previousMousePosition.x;
    carGroup.rotation.y += deltaX * rotationSpeed;
    previousMousePosition.x = clientX;
};

const stopDragging = () => {
    isDragging = false;
};

// Event Listeners
canvas.addEventListener('mousedown', (e) => startDragging(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => startDragging(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener('mouseup', stopDragging);
window.addEventListener('touchend', stopDragging);
window.addEventListener('mouseleave', stopDragging);

canvas.addEventListener('mousemove', (e) => handleMove(e.clientX));
canvas.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX));


// ==========================================================
// 5. ANIMAZIONE CINEMATICA SCROLL-BASED (GSAP)
// ==========================================================

// Timeline per le animazioni al variare dello scroll
const cinematicTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: "#content-overlay", // L'intera area scorrevole
        start: "top top",
        end: "bottom bottom",
        scrub: true, // Sincronizza l'animazione con lo scroll
    }
});

// Animazione 1: Dalla sezione Hero alla Sezione 1
cinematicTimeline.to(camera.position, { 
    x: -3, // Muovi la telecamera a sinistra
    y: 1, 
    z: 2, 
    duration: 1 
}, 0);

cinematicTimeline.to(carGroup.rotation, { 
    y: Math.PI * 0.5, // Ruota di 90 gradi per mostrare il lato
    duration: 1 
}, 0); 

// Animazione 2: Dalla Sezione 1 alla Sezione 2
cinematicTimeline.to(camera.position, { 
    x: 0, 
    y: 1.5, 
    z: 1.5, // Zoom più vicino per i dettagli
    duration: 1 
}, 1); 

cinematicTimeline.to(carGroup.rotation, { 
    y: Math.PI * 1.5, // Rotazione completa di 180 gradi rispetto all'inizio
    duration: 1 
}, 1); 

// La funzione lookAt assicura che la telecamera punterà sempre l'oggetto
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


