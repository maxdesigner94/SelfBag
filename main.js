/**
 * MAIN.JS: Inizializzazione della scena Three.js, modelli, shader e logica di interazione.
 */

// Globali Three.js
let scene, camera, renderer;
let carModel, gridPlane;
let mouse = { x: 0, y: 0 };
let clock = new THREE.Clock();

// Inizializza la Scena
function init() {
    // 1. Setup Renderer
    const container = document.getElementById('webgl-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // 2. Setup Scena e Telecamera
    scene = new THREE.Scene();
    
    // Telecamera (Prospettiva dinamica per un look cinematografico)
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 6); // Posizione iniziale
    camera.lookAt(0, 0.5, 0);

    // 3. Aggiungi Modelli e Shader
    createCarModel();
    createGridBackground();
    
    // 4. Luci
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Luce ambiente soft
    scene.add(ambientLight);

    // 5. Interattività e Animazioni
    setupEventListeners();
    setupAnimations();

    // Avvia il loop di rendering
    animate();
}

// ---------------------------------------------
// Creazione degli Oggetti 3D
// ---------------------------------------------

function createCarModel() {
    // Sostituiamo il caricamento di un GLTF con un modello base geometrico 
    // per non dipendere da file esterni, usando un THREE.BoxGeometry modificato
    // per simulare una forma di auto sportiva.

    const carGeometry = new THREE.BoxGeometry(3.5, 0.8, 1.5);
    
    // Shader Material Custom
    const carUniforms = {
        uColor: { value: new THREE.Color(0.2, 0.2, 0.8) }, // Blu metallizzato scuro
        uTime: { value: 0.0 },
        uLightDirection: { value: new THREE.Vector3(1.0, 1.0, 1.0).normalize() } // Luce direzionale
    };

    const carMaterial = new THREE.ShaderMaterial({
        uniforms: carUniforms,
        vertexShader: carVertexShader,
        fragmentShader: carFragmentShader,
        lights: false // Disabilita l'illuminazione standard
    });

    carModel = new THREE.Mesh(carGeometry, carMaterial);
    carModel.position.set(0, 0.4, 0);
    scene.add(carModel);
    
    // Aggiungiamo un placeholder per la cabina (solo per look)
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.2);
    const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.8 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0.5, 1.0, 0);
    carModel.add(cabin);
}

function createGridBackground() {
    // Usiamo un piano esteso e posizionato per simulare il "pavimento"
    const gridGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    gridGeometry.rotateX(-Math.PI / 2); // Ruota per farlo giacere sul piano XZ

    const gridUniforms = {
        uTime: { value: 0.0 },
        uGridColor: { value: new THREE.Color(0x00eaff) },
        uScale: { value: 1.0 }
    };

    const gridMaterial = new THREE.ShaderMaterial({
        uniforms: gridUniforms,
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        transparent: true,
        side: THREE.DoubleSide
    });

    gridPlane = new THREE.Mesh(gridGeometry, gridMaterial);
    gridPlane.position.set(0, 0, 0);
    scene.add(gridPlane);
}

// ---------------------------------------------
// Interattività (Mouse/Gaze)
// ---------------------------------------------

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Normalizza le coordinate del mouse da -1 a 1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// ---------------------------------------------
// Animazioni (GSAP e Loop)
// ---------------------------------------------

function setupAnimations() {
    // 1. Animazione di Ingresso (Hero Load)
    gsap.from(carModel.position, { duration: 1.5, z: -10, ease: "power3.out" });
    gsap.from(carModel.rotation, { duration: 1.5, y: -Math.PI / 4, ease: "power3.out" });
    gsap.from("#hero-section", { duration: 1, opacity: 0, y: 50, delay: 0.5 });
    gsap.from("#navbar", { duration: 1, opacity: 0, y: -50, delay: 0.8 });

    // 2. Scroll Interaction (Simulazione di scroll per interazione con GSAP ScrollTrigger)
    // Creiamo un div invisibile di altezza elevata per simulare lo spazio di scorrimento
    const scrollSim = document.createElement('div');
    scrollSim.style.height = '300vh'; // 3 volte l'altezza della viewport
    scrollSim.style.position = 'absolute';
    scrollSim.style.width = '1px';
    scrollSim.style.top = '0';
    document.body.appendChild(scrollSim);
    document.body.style.overflowY = 'scroll'; // Riabilita lo scroll nativo

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        trigger: scrollSim,
        start: "top top",
        end: "bottom bottom",
        scrub: true, // L'animazione segue lo scroll
        onUpdate: (self) => {
            // Rotazione leggera dell'auto durante lo scroll
            carModel.rotation.y = self.progress * (Math.PI / 8); // Ruota fino a 22.5 gradi
            
            // Spostamento della camera (simula un leggero allontanamento)
            camera.position.z = 6 - self.progress * 2;
        }
    });
}


// Loop Principale
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Aggiorna gli uniforms per gli shader (riflessi animati sulla macchina e griglia)
    carModel.material.uniforms.uTime.value = elapsedTime;
    gridPlane.material.uniforms.uTime.value = elapsedTime;

    // Movimento Gaze/Mouse Interaction: Interpolazione per un movimento fluido
    const targetRotationX = mouse.y * 0.1;
    const targetRotationY = mouse.x * 0.1;
    
    // Aggiorna la rotazione della macchina (simulando che l'utente stia guardando)
    carModel.rotation.x += (targetRotationX - carModel.rotation.x) * 0.05;
    carModel.rotation.y += (targetRotationY - carModel.rotation.y) * 0.05;

    renderer.render(scene, camera);
}


window.onload = init;
