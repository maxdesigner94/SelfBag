// --- CONFIGURAZIONE INIZIALE ---
const canvas = document.querySelector('#webgl-canvas');
const loaderElement = document.getElementById('loader');
const barFill = document.querySelector('.bar-fill');

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.03); // Nebbia per profondità

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// --- 1. CREAZIONE DEL TUNNEL (Curve & Tube) ---
// Creiamo un percorso curvo complesso
const points = [];
for (let i = 0; i < 50; i++) {
    const x = Math.sin(i * 0.5) * 10;
    const y = Math.cos(i * 0.3) * 10;
    const z = i * -20; // Si estende verso l'interno
    points.push(new THREE.Vector3(x, y, z));
}

const path = new THREE.CatmullRomCurve3(points);

// Creazione geometria Tubo
const tubeGeometry = new THREE.TubeGeometry(path, 100, 2, 8, false);

// Materiale Wireframe Tecnologico
const tubeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, 
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
scene.add(tube);

// --- 2. PARTICELLE (EFFETTO VELOCITÀ) ---
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100; // Spargiamo nello spazio
}

const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
scene.add(particlesMesh);

// --- 3. CREAZIONE "CYBER CAR" PROCEDURALE (Placeholder per modello GLTF) ---
// Funzione per creare una macchina stilizzata low-poly
function createCyberCar(color, x, y, z) {
    const carGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    
    // Cabin (Neon glass)
    const cabinGeo = new THREE.ConeGeometry(1, 1.5, 4);
    const cabinMat = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true }); // Stile Tron
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.rotation.y = Math.PI / 4;
    cabin.position.y = 0.5;

    // Wheels (Glowing)
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0xbc13fe });
    
    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(1.1, -0.2, 1.2); w1.rotation.z = Math.PI / 2;
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(-1.1, -0.2, 1.2); w2.rotation.z = Math.PI / 2;
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(1.1, -0.2, -1.2); w3.rotation.z = Math.PI / 2;
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(-1.1, -0.2, -1.2); w4.rotation.z = Math.PI / 2;

    carGroup.add(body, cabin, w1, w2, w3, w4);
    carGroup.position.set(x, y, z);
    return carGroup;
}

// Aggiungiamo una macchina protagonista
const heroCar = createCyberCar(0x333333, 0, -2, -10);
scene.add(heroCar);

// Luci
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f3ff, 2, 50);
pointLight.position.set(0, 5, -5);
scene.add(pointLight);

// --- 4. ANIMAZIONI & SCROLL (GSAP) ---
gsap.registerPlugin(ScrollTrigger);

// Oggetto proxy per controllare la posizione della camera lungo la curva
const cameraProgress = { value: 0 };

// Animation Timeline
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "main",
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // Smooth scrubbing
    }
});

// Al progredire dello scroll, avanziamo nel tubo (da 0 a 1 lungo il percorso)
tl.to(cameraProgress, {
    value: 0.9, // Arriviamo quasi alla fine
    ease: "none",
    onUpdate: () => {
        // Calcola la posizione sulla curva
        const pointOnCurve = path.getPointAt(cameraProgress.value);
        const lookAtPoint = path.getPointAt(Math.min(cameraProgress.value + 0.05, 1));
        
        // Muovi la camera
        camera.position.copy(pointOnCurve);
        camera.lookAt(lookAtPoint);
        
        // Muovi la macchina davanti alla camera (effetto inseguimento)
        const carPos = path.getPointAt(Math.min(cameraProgress.value + 0.02, 1));
        // Offset macchina per non stare esattamente al centro
        heroCar.position.copy(carPos);
        heroCar.position.y -= 1.5; 
        heroCar.lookAt(path.getPointAt(Math.min(cameraProgress.value + 0.1, 1)));
        
        // Rotazione ruote o effetti particellari
        heroCar.children.forEach((child, index) => {
            if(index > 1) child.rotation.x += 0.2; // Ruote
        });
    }
});

// Animazioni UI con Anime.js (Entrata Titoli)
function animateHeroText() {
    anime({
        targets: '.hero-title',
        translateY: [50, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 2000,
        delay: 500
    });
    anime({
        targets: '.hero-subtitle',
        opacity: [0, 1],
        duration: 2000,
        delay: 1000
    });
}

// --- 5. INTERATTIVITÀ MOUSE ---
const cursor = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5;
    cursor.y = event.clientY / window.innerHeight - 0.5;
});

// --- 6. RENDER LOOP ---
const clock = new THREE.Clock();

function tick() {
    const elapsedTime = clock.getElapsedTime();

    // Effetto "Respiro" del tunnel
    tube.material.opacity = 0.3 + Math.sin(elapsedTime * 2) * 0.1;
    
    // Parallasse del mouse sulla camera (aggiunge dinamismo)
    camera.position.x += (cursor.x * 2 - camera.position.x) * 0.05;
    camera.position.y += (-cursor.y * 2 - camera.position.y) * 0.05;

    // Rotazione particelle
    particlesMesh.rotation.z = elapsedTime * 0.1;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}

// --- 7. HANDLING RESIZE & LOADING ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Simulazione caricamento
window.addEventListener('load', () => {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        barFill.style.width = `${progress}%`;
        if (progress >= 100) {
            clearInterval(interval);
            gsap.to(loaderElement, { 
                opacity: 0, 
                duration: 1, 
                onComplete: () => {
                    loaderElement.style.display = 'none';
                    animateHeroText(); // Start UI anims
                }
            });
        }
    }, 50);
});

tick();
