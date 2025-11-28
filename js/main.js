// --- CONFIGURAZIONE INIZIALE E LIBRERIE ---
const canvas = document.querySelector('#webgl-canvas');
const loaderElement = document.getElementById('loader');
const barFill = document.querySelector('.bar-fill');

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.025); // Nebbia per profondità

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5; // Esposizione leggermente più alta per l'effetto neon

// --- 1. TUNNEL INFINITO (CatmullRomCurve & TubeGeometry) ---
const points = [];
for (let i = 0; i < 60; i++) {
    const x = Math.sin(i * 0.5) * 8;
    const y = Math.cos(i * 0.3) * 5;
    const z = i * -12; 
    points.push(new THREE.Vector3(x, y, z));
}
const path = new THREE.CatmullRomCurve3(points);
const tubeGeo = new THREE.TubeGeometry(path, 120, 2.5, 12, false);
const tubeMat = new THREE.MeshBasicMaterial({ 
    color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.15 
});
const tube = new THREE.Mesh(tubeGeo, tubeMat);
scene.add(tube);

// --- 2. PARTICELLE (Effetto Velocità) ---
const pCount = 2000;
const pPos = new Float32Array(pCount * 3);
for(let i=0; i<pCount*3; i++) pPos[i] = (Math.random()-0.5)*120;
const pGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff });
const stars = new THREE.Points(pGeo, pMat);
scene.add(stars);

// --- 3. CARICAMENTO MODELLO 3D STABILE (Buggy.glb) ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// URL del modello Buggy (stabile per testare)
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Buggy/glTF-Binary/Buggy.glb';

const gltfLoader = new THREE.GLTFLoader();
const dracoLoader = new THREE.DRACOLoader();

// Configura il decoder Draco (essenziale per i modelli compressi)
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
    MODEL_URL,
    (gltf) => {
        const model = gltf.scene;
        
        // SETUP MODELLO SPECIFICO PER BUGGY.GLB
        model.scale.set(0.15, 0.15, 0.15); // Ridimensiona per adattarsi al tunnel
        model.rotation.y = Math.PI; // Ruota di 180 gradi per guardare avanti
        model.position.y = -1.5; // Abbassa al livello della 'strada'

        // Ottimizzazione Materiali (Branding AURA)
        model.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if(o.material.isMeshStandardMaterial) {
                    o.material.envMapIntensity = 1.5; // Aumenta i riflessi
                    // Applicazione colore neon AURA su parti selezionate
                    if(o.name.includes("Body") || o.name.includes("Car")) {
                        o.material.roughness = 0.1;
                        o.material.metalness = 0.7;
                        o.material.color.setHex(0x00f3ff); // Colore AURA Cyan
                    }
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
            // Fallback: avanzamento simulato se la dimensione non è nota
            let currentWidth = parseFloat(barFill.style.width) || 0;
            if(currentWidth < 95) barFill.style.width = (currentWidth + 2) + '%';
        }
    },
    (error) => {
        console.error('Errore download modello:', error);
        loaderElement.innerHTML = `<div style="color:red; font-family:sans-serif; text-align:center;">ERRORE CARICAMENTO MODELLO 3D.<br>Verifica la console per i dettagli.</div>`;
    }
);

// Luci
const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

const spotLight = new THREE.SpotLight(0x00f3ff, 8, 50, Math.PI / 8, 0.8, 2);
spotLight.position.set(0, 10, 5);
heroGroup.add(spotLight); 

// --- 4. SCROLL ANIMATION (GSAP ScrollTrigger) ---
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
        const progress = camData.t;
        
        // Movimento Telecamera (lungo il percorso)
        const camPos = path.getPointAt(progress);
        const camLook = path.getPointAt(Math.min(progress + 0.05, 1));
        
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        // Movimento Auto (leggermente più avanti)
        const carPos = path.getPointAt(Math.min(progress + 0.03, 1));
        const carLook = path.getPointAt(Math.min(progress + 0.08, 1));
        
        heroGroup.position.lerp(carPos, 0.1); // Smooth follow
        heroGroup.lookAt(carLook);
        
        // Banking (inclinazione)
        const tangent = path.getTangentAt(progress).normalize();
        heroGroup.rotation.z = -tangent.x * 0.8;
    }
});

// --- 5. RENDER LOOP, UI e INTERAZIONE ---

// Animazione introduzione UI
function animateUI() {
    anime({
        targets: ['.hero-title', '.hero-subtitle', '.scroll-indicator'],
        translateY: [100, 0], 
        opacity: [0, 1], 
        easing: 'easeOutExpo', 
        duration: 1500,
        delay: anime.stagger(200)
    });
}

// Gestione Mouse Parallasse
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// Chiusura del Loader
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            if (barFill.style.width === '100%') {
                observer.disconnect();
                gsap.to(loaderElement, { 
                    opacity: 0, 
                    duration: 1, 
                    delay: 0.5,
                    onComplete: () => {
                        loaderElement.style.display = 'none';
                        animateUI();
                    }
                });
            }
        }
    });
});
observer.observe(barFill, { attributes: true });


const clock = new THREE.Clock();
function tick() {
    const dt = clock.getElapsedTime();
    
    // Rotazioni estetiche
    stars.rotation.z = dt * 0.05;
    tube.rotation.z = dt * -0.02;
    
    // Leggera Parallasse della Telecamera
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();

tick();
