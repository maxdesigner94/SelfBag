// Variabili globali per Three.js
let scene, camera, renderer, material, flowMesh;
let uScrollProgress = 0.0;
let uTime = 0.0;
let threeDObject; // La mesh che rappresenta l'oggetto 3D nella hero section

// Registra i plugin di GSAP
if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
} else {
    console.error("GSAP o ScrollTrigger non caricati correttamente.");
}

// Funzione per caricare il contenuto di un file shader esterno (NON MODIFICATO)
async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Impossibile caricare lo shader da ${url}: ${response.statusText}`);
    }
    return response.text();
}

// Funzione di inizializzazione principale (NON MODIFICATO)
async function init() {
    try {
        const vertexShaderSource = await loadShader('./shaders/vertex.glsl');
        const fragmentShaderSource = await loadShader('./shaders/fragment.glsl');
        const canvas = document.getElementById('flowCanvas');

        // 1. Setup Base di Three.js
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        scene = new THREE.Scene();

        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
        camera.position.z = 1;

        // 2. Creazione dell'Oggetto 3D
        createSharedShaderMaterial(vertexShaderSource, fragmentShaderSource);
        
        // Creiamo la geometria separatamente: una per il flusso verticale, una per l'oggetto Hero
        createFlowMesh(aspect); // Flusso verticale che copre tutto
        createHero3DObject(); // Oggetto 3D nella colonna destra

        // 3. Setup Sincronizzazione
        setupScrollSync(); 

        // 4. Gestione degli eventi
        window.addEventListener('resize', onWindowResize);

        // Inizio del Loop di Animazione
        animate();

    } catch (error) {
        console.error("Errore durante l'inizializzazione del progetto:", error);
    }
}

// Crea il Materiale Shader Condiviso (NON MODIFICATO)
function createSharedShaderMaterial(vsSource, fsSource) {
    material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScrollProgress: { value: 0.0 },
            uColor: { value: new THREE.Color(0x00ffff) } 
        },
        vertexShader: vsSource,
        fragmentShader: fsSource,
        transparent: true,
        blending: THREE.AdditiveBlending, 
        depthWrite: false 
    });
}

// Crea il Piano che copre tutto lo schermo (Flusso di Scorrimento)
function createFlowMesh(aspect) {
    // Piano per l'effetto di scorrimento verticale che usava prima l'SVG
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
    flowMesh = new THREE.Mesh(geometry, material); 
    scene.add(flowMesh);
}


// NUOVA FUNZIONE: Crea un oggetto 3D separato per la Hero Section (un cubo/simbolo)
function createHero3DObject() {
    // Usiamo una forma semplice (es. una BoxGeometry) per simulare l'oggetto 3D inerente alla corrente
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1); 
    
    // Creiamo un materiale separato per l'oggetto Hero per non influenzare il flusso globale,
    // ma usiamo un ShaderMaterial simile per mantenere il look.
    const heroMaterial = material.clone(); 
    
    threeDObject = new THREE.Mesh(geometry, heroMaterial); 
    
    // Posizionamento: 
    // 0.5 a destra, 0 al centro Y, leggermente in avanti
    threeDObject.position.set(0.6, 0.0, 0.1); 
    
    // Rotazione iniziale 
    threeDObject.rotation.x = Math.PI * 0.1;
    
    scene.add(threeDObject);
}


// Funzione di Sincronizzazione
function setupScrollSync() {
    const progressElement = document.getElementById('flow-progress');

    // 1. Sincronizzazione 3D del Piano (Flusso)
    gsap.to(material.uniforms.uScrollProgress, {
        value: 1.0, 
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: true, 
            onUpdate: (self) => {
                uScrollProgress = self.progress; 
                if (progressElement) {
                    progressElement.textContent = `${Math.round(uScrollProgress * 100)}%`;
                }
            }
        }
    });

    // 2. Animazione continua dell'Oggetto Hero 3D con GSAP (Rotazione/Movimento)
    gsap.to(threeDObject.rotation, {
        z: Math.PI * 2, // Ruota continuamente sull'asse Z
        duration: 20,
        repeat: -1,
        ease: "none"
    });
    
    // 3. Sincronizzazione HTML
    gsap.to("#activation-section .animated-text", {
        opacity: 1,
        y: 0, 
        stagger: 0.1, 
        scrollTrigger: {
            trigger: "#activation-section",
            start: "top 70%", 
            end: "center 30%",
            scrub: 1, 
        }
    });
}


function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    
    // Aggiorna la telecamera
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Ricrea il piano del flusso per coprire la nuova dimensione
    if (flowMesh) {
        scene.remove(flowMesh);
        createFlowMesh(aspect);
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    uTime = time / 1000;
    if (material) {
        material.uniforms.uTime.value = uTime;
    }
    
    // Rotazione manuale leggera, se preferita a GSAP. In questo caso useremo GSAP.
    // threeDObject.rotation.y += 0.001; 

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
