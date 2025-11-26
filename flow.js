// Variabili globali per Three.js
let scene, camera, renderer, material, mesh;
let uScrollProgress = 0.0;
let uTime = 0.0;
// Rimosso: const horizontalScroller = document.getElementById('horizontal-wrapper');

// Registra i plugin di GSAP
if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
} else {
    console.error("GSAP o ScrollTrigger non caricati correttamente.");
}

// Funzione per caricare il contenuto di un file shader esterno (non modificata)
async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Impossibile caricare lo shader da ${url}: ${response.statusText}`);
    }
    return response.text();
}

// Funzione di inizializzazione principale (Ripristinato)
async function init() {
    try {
        const vertexShaderSource = await loadShader('./shaders/vertex.glsl');
        const fragmentShaderSource = await loadShader('./shaders/fragment.glsl');

        const canvas = document.getElementById('flowCanvas');

        // Setup Base di Three.js
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        scene = new THREE.Scene();

        // Camera Ortografica per un effetto di overlay 2D
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
        camera.position.z = 1;

        // Creazione dell'Oggetto 3D
        createFlowMesh(vertexShaderSource, fragmentShaderSource);

        // Setup Sincronizzazione e Logica Interattiva
        setupScrollSync();

        // Gestione degli eventi
        window.addEventListener('resize', onWindowResize);

        // Inizio del Loop di Animazione
        animate();

    } catch (error) {
        console.error("Errore durante l'inizializzazione del progetto:", error);
    }
}

function createFlowMesh(vsSource, fsSource) {
    // Geometria Semplice (Piano) che copre l'area visibile
    const aspect = window.innerWidth / window.innerHeight;
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);

    material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScrollProgress: { value: 0.0 }, // 0.0 a 1.0
            uColor: { value: new THREE.Color(0x00ffff) } 
        },
        vertexShader: vsSource,
        fragmentShader: fsSource,
        transparent: true,
        blending: THREE.AdditiveBlending, // Effetto glow/luce
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function setupScrollSync() {
    // 1. Sincronizzazione 3D: Collega lo scroll VERTICALE all'uniform dello shader
    gsap.to(material.uniforms.uScrollProgress, {
        value: 1.0, 
        scrollTrigger: {
            trigger: "body", // Ritorna al body come trigger
            // Rimosso: scroller: horizontalScroller,
            start: "top top",
            end: "bottom bottom",
            // Rimosso: horizontal: true,
            scrub: true, 
            onUpdate: (self) => {
                uScrollProgress = self.progress; 
                const progressElement = document.getElementById('flow-progress');
                if (progressElement) {
                    progressElement.textContent = `${Math.round(uScrollProgress * 100)}%`;
                }
            }
        }
    });

    // 2. Sincronizzazione HTML: Animazione della Sezione di Attivazione
    gsap.to("#activation-section .animated-text", {
        opacity: 1,
        y: 0, // Animazione verticale
        stagger: 0.1, 
        scrollTrigger: {
            trigger: "#activation-section",
            // Rimosso: scroller: horizontalScroller,
            start: "top 70%", 
            end: "center 30%",
            // Rimosso: horizontal: true,
            scrub: 1, 
        }
    });
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (mesh) {
        scene.remove(mesh);
        createFlowMesh(material.vertexShader, material.fragmentShader);
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    uTime = time / 1000;
    if (material) {
        material.uniforms.uTime.value = uTime;
    }

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
