// --- CONFIGURAZIONE INIZIALE ---
const canvas = document.querySelector('#webgl-canvas');
const loaderElement = document.getElementById('loader');
const barFill = document.querySelector('.bar-fill');

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.025);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// --- 1. TUNNEL INFINITO ---
const points = [];
for (let i = 0; i < 60; i++) {
    const x = Math.sin(i * 0.5) * 8;
    const y = Math.cos(i * 0.3) * 5;
    const z = i * -12; 
    points.push(new THREE.Vector3(x, y, z));
}
const path = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(path, 120, 2.5, 12, false); // Più dettagliato (12)
const tubeMat = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.15 
});
const tube = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tube);

// --- 2. PARTICELLE ---
const pCount = 2000;
const pPos = new Float32Array(pCount * 3);
for(let i=0; i<pCount*3; i++) pPos[i] = (Math.random()-0.5)*120;
const pGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
const stars = new THREE.Points(pGeo, pMat);
scene.add(stars);

// --- 3. CARICAMENTO URL REMOTO (CDN) ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// URL di un modello pubblico affidabile (Nissan Skyline modificata)
// Usiamo raw.githubusercontent proxato da jsDelivr per velocità e CORS headers corretti
const MODEL_URL = 'https://raw.githubusercontent.com/baronwatts/models/master/skyline.glb';

const gltfLoader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();

// Configura il decoder WebAssembly direttamente dal CDN
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
    MODEL_URL,
    (gltf) => {
        const model = gltf.scene;
        
        // SETUP MODELLO
        model.scale.set(1.5, 1.5, 1.5); // Scala per renderla imponente
        model.rotation.y = Math.PI; // Ruota per guardare avanti
        model.position.y = -2.5; // Abbassa al livello della strada

        // Ottimizzazione Materiali al volo
        model.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if(o.material.map) o.material.map.anisotropy = 16;
                // Rendi la carrozzeria più lucida
                if(o.name.includes("body") || o.name.includes("paint")) {
                    o.material.roughness = 0.1;
                    o.material.metalness = 0.7;
                    o.material.color.setHex(0xbc13fe); // Colore AURA Purple
                }
            }
        });

        heroGroup.add(model);
    },
    (xhr) => {
        // LOADING BAR REALE
        if (xhr.lengthComputable) {
            const percent = (xhr.loaded / xhr.total) * 100;
            barFill.style.width = percent + '%';
        } else {
            // Fallback se il server non dice la dimensione totale
            // Simula avanzamento
            let currentWidth = parseFloat(barFill.style.width) || 0;
            if(currentWidth < 90) barFill.style.width = (currentWidth + 5) + '%';
        }
    },
    (error) => {
        console.error('Errore download:', error);
        loaderElement.innerHTML = `<div style="color:red; font-family:sans-serif;">CONNECTION FAILED: ${error}</div>`;
    }
);

// Luci
const ambient = new THREE.AmbientLight(0xffffff, 1); // Luce ambientale più forte per vedere i dettagli
scene.add(ambient);

const spotLight = new THREE.SpotLight(0x00f3ff, 5);
spotLight.position.set(0, 10, 5);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
heroGroup.add(spotLight); // La luce viaggia con l'auto

// --- 4. SCROLL ANIMATION ---
gsap.registerPlugin(ScrollTrigger);
const camData = { t: 0 };

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "main", start: "top top", end: "bottom bottom", scrub: 1
    }
});

tl.to(camData, {
    t: 0.9,
    ease: "none",
    onUpdate: () => {
        // Calcolo posizione su curva
        const pos = path.getPointAt(camData.t);
        const look = path.getPointAt(Math.min(camData.t + 0.05, 1));
        
        camera.position.copy(pos);
        camera.lookAt(look);

        // Auto segue la camera ma leggermente avanti
        const carPos = path.getPointAt(Math.min(camData.t + 0.03, 1));
        const carLook = path.getPointAt(Math.min(camData.t + 0.08, 1));
        
        // Interpolazione morbida (Lerp) per il movimento dell'auto
        heroGroup.position.lerp(carPos, 0.1);
        heroGroup.lookAt(carLook);
        
        // Banking (inclinazione in curva)
        const tangent = path.getTangentAt(camData.t).normalize();
        heroGroup.rotation.z = -tangent.x * 0.8;
    }
});

// --- 5. LOOP & UTILS ---
function animateUI() {
    anime({
        targets: '.hero-title',
        translateY: [100, 0], opacity: [0, 1], easing: 'easeOutExpo', duration: 1500
    });
}

// Check caricamento completato (Fake trigger 100% se il server non risponde length)
window.addEventListener('load', () => {
    setTimeout(() => {
        barFill.style.width = '100%';
        gsap.to(loaderElement, { 
            opacity: 0, delay: 0.5, onComplete: () => {
                loaderElement.style.display = 'none';
                animateUI();
            }
        });
    }, 2000); // Max wait 2 sec poi forza l'avvio
});

// Interazione Mouse
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();
function tick() {
    const dt = clock.getElapsedTime();
    
    // Movimento particelle
    stars.rotation.z = dt * 0.05;
    
    // Leggero movimento camera col mouse
    camera.position.x += mouseX * 0.5;
    camera.position.y += -mouseY * 0.5;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();
