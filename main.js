import * as THREE from 'three';
import { gsap } from 'gsap';

// --- DATI IMMAGINI ---
const CAR_IMAGES = [
    { url: 'http://googleusercontent.com/image_collection/image_retrieval/18027205109264815970_0', name: 'X-900 GT (Sport)', details: 'Velocità pura e design aggressivo. Un must per gli amanti della performance.' },
    { url: 'http://googleusercontent.com/image_collection/image_retrieval/18027205109264815970_1', name: 'Z-Urban SUV', details: 'Spazio, sicurezza e comfort per la famiglia, senza rinunciare allo stile.' },
    { url: 'http://googleusercontent.com/image_collection/image_retrieval/18027205109264815970_2', name: 'E-Flow (Elettrica)', details: 'Zero emissioni, autonomia record e tecnologia all\'avanguardia.' },
    { url: 'http://googleusercontent.com/image_collection/image_retrieval/18027205109264815970_3', name: 'L-Prestige Sedan', details: 'Lusso artigianale, finiture impeccabili e guida silenziosa.' }
];

// --- SHADER GLSL (Embeddati per semplicità) ---
const VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const FRAGMENT_SHADER = `
    precision highp float;
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uProgress;
    varying vec2 vUv;
    
    void main() {
        // Effetto onda/noise futuristico per lo sfondo
        float noise = fract(sin(dot(vUv * 5.0, vec2(12.9898, 78.233))) * 43758.5453 + uTime * 0.2);
        
        // Sfumatura di colore
        vec3 color = mix(uColorA, uColorB, vUv.y + sin(uTime * 0.5) * 0.1);

        // Aggiunge l'effetto "glitch"/disturbo
        color += noise * 0.1; 

        // Il progresso (dopo il click CTA) rende lo sfondo più intenso
        color = mix(color, uColorA * 1.5, uProgress); 

        gl_FragColor = vec4(color, 1.0);
    }
`;


// --- CONFIGURAZIONE SCENA ---
const container = document.getElementById('webgl-container');
let scene, camera, renderer, raycaster;
let mouse = new THREE.Vector2();
const clock = new THREE.Clock();
let carPlanes = []; // Array per i piani delle auto

// --- FUNZIONE DI INIZIALIZZAZIONE ---
function init() {
    // 1. Scena & Sfondo Animato con Shader
    scene = new THREE.Scene();
    createShaderBackground(); // Creazione dello sfondo 3D animato

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 1, 10);
    camera.lookAt(0, 1, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // 4. Raycaster per interazione
    raycaster = new THREE.Raycaster();

    // 5. Creazione della Galleria Olografica
    createImageShowroom();

    // 6. Listener per Interazione
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    document.getElementById('cta-button').addEventListener('click', onCtaClick);
    document.getElementById('back-button').addEventListener('click', onBackClick);
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', onNavClick));

    // Animazione iniziale
    gsap.from(camera.position, { duration: 2.5, z: 25, ease: "power3.out" });
    gsap.from('#ui-overlay', { duration: 1.5, opacity: 0, delay: 1.5 });
    
    animate();
}

// --- CREAZIONE DEGLI ELEMENTI 3D ---

// 1. Sfondo Animato (Shader)
let backgroundMesh;
function createShaderBackground() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColorA: { value: new THREE.Color(0x0a0a0c) },
            uColorB: { value: new THREE.Color(0x003366) },
            uProgress: { value: 0.0 }
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.DoubleSide
    });
    
    backgroundMesh = new THREE.Mesh(geometry, material);
    backgroundMesh.position.z = -20; // Posizionato molto indietro
    scene.add(backgroundMesh);
}


// 2. Galleria Olografica (Immagini su Piani 3D)
const loader = new THREE.TextureLoader();
function createImageShowroom() {
    const planeGeometry = new THREE.PlaneGeometry(4, 2.5); // Rapporto 16:10 circa
    const radius = 6;
    const numPlanes = CAR_IMAGES.length;

    CAR_IMAGES.forEach((data, index) => {
        // Calcola la posizione circolare
        const angle = (index / numPlanes) * Math.PI * 2;
        
        // Caricamento della Texture
        const texture = loader.load(data.url);
        texture.colorSpace = THREE.SRGBColorSpace;
        
        // Materiale con la Texture (Emissive per effetto olografico)
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85, // Leggera trasparenza per l'effetto olografico
            color: 0x99ffff // Tonalità ciano/blu per l'ologramma
        });

        const plane = new THREE.Mesh(planeGeometry, material);
        
        // Posizionamento e Rotazione
        plane.position.x = Math.sin(angle) * radius;
        plane.position.z = Math.cos(angle) * radius;
        plane.position.y = 1.5;
        
        plane.rotation.y = angle + Math.PI; // Fai in modo che il piano guardi verso il centro
        
        plane.userData = { isCarPlane: true, index: index, ...data };
        
        scene.add(plane);
        carPlanes.push(plane);
        
        // Animazione iniziale
        gsap.from(plane.scale, { duration: 1, x: 0.1, y: 0.1, z: 0.1, ease: "back.out(1.7)", delay: 2 + index * 0.2 });
    });
}


// --- FUNZIONI DI INTERAZIONE E ANIMAZIONE (GSAP) ---

let currentIntersected = null;

// 1. Mouse Move (Parallasse e Hover 3D)
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Animazione GSAP per il tilt della telecamera
    gsap.to(camera.position, {
        duration: 1.5,
        x: mouse.x * 0.5,
        y: 1 + mouse.y * 0.2,
        ease: "power2.out"
    });
    
    // Interazione Hover (Raycasting)
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(carPlanes);

    if (intersects.length > 0) {
        if (currentIntersected != intersects[0].object) {
            // Ripristina il precedente
            if (currentIntersected) {
                gsap.to(currentIntersected.scale, { duration: 0.3, x: 1, y: 1, z: 1 });
            }
            // Ingrandisci il nuovo
            currentIntersected = intersects[0].object;
            gsap.to(currentIntersected.scale, { duration: 0.3, x: 1.1, y: 1.1, z: 1.1 });
        }
        document.body.style.cursor = 'pointer';
    } else {
        if (currentIntersected) {
            gsap.to(currentIntersected.scale, { duration: 0.5, x: 1, y: 1, z: 1 });
        }
        currentIntersected = null;
        document.body.style.cursor = 'default';
    }
}

// 2. Click (Selezione Auto)
function onClick(event) {
    if (currentIntersected && currentIntersected.userData.isCarPlane) {
        const carData = currentIntersected.userData;
        
        // Animazione 3D: Sposta la camera sul piano selezionato
        gsap.to(camera.position, {
            duration: 1.5,
            x: currentIntersected.position.x * 0.9,
            y: currentIntersected.position.y,
            z: currentIntersected.position.z * 0.9,
            ease: "power3.inOut"
        });
        
        // Animazione UI: Mostra i dettagli del modello
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('modelli-section').classList.remove('hidden');
        
        document.getElementById('model-details').innerHTML = `
            <h4>${carData.name}</h4>
            <p>${carData.details}</p>
        `;
    }
}

// 3. CTA Click (Passaggio di Stato Iniziale)
function onCtaClick() {
    // Animazione 3D: Sposta la camera più in basso per l'effetto "esplorazione"
    gsap.to(camera.position, { duration: 2, y: 1, z: 8, ease: "power2.inOut" });

    // Animazione Shader: Aumenta il progresso per un effetto visivo
    gsap.to(backgroundMesh.material.uniforms.uProgress, { duration: 1.5, value: 1.0, ease: "expo.inOut" });
    
    // Animazione UI: Nasconde la CTA (ma la sezione rimane attiva finché non si clicca su un'auto)
    document.getElementById('home-section').querySelector('.cta-button').style.display = 'none';
}

// 4. Back Click (Torna alla vista iniziale)
function onBackClick() {
    gsap.to(camera.position, { duration: 1.5, x: 0, y: 1, z: 10, ease: "power2.inOut" });

    document.getElementById('home-section').classList.remove('hidden');
    document.getElementById('modelli-section').classList.add('hidden');
}


// 5. Navigazione
function onNavClick(event) {
    event.preventDefault();
    const targetSection = event.target.dataset.section;
    
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`${targetSection}-section`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    
    // Reset o Animazione Camera
    gsap.to(camera.position, { 
        duration: 1.5, 
        x: targetSection === 'contatti' ? -5 : 0, 
        y: targetSection === 'contatti' ? 2 : 1, 
        z: targetSection === 'contatti' ? 10 : 10, 
        ease: "power2.inOut" 
    });
}


// --- LOOP DI RENDERING ---
function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Aggiorna l'uniform uTime per l'animazione dello shader
    backgroundMesh.material.uniforms.uTime.value = elapsedTime;

    // Rotazione automatica lenta della galleria (fa ruotare l'intero ambiente tranne la camera)
    scene.rotation.y = elapsedTime * 0.05; 
    
    // Fissa la telecamera in avanti
    camera.lookAt(0, 1, 0); 
    
    renderer.render(scene, camera);
}


// --- GESTIONE DEL RESIZE ---
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Avvia tutto!
init();
