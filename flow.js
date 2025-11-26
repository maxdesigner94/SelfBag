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

// Funzione di inizializzazione principale - MODIFICATA
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

        // *** AGGIUNGIAMO LUCI PER GLI OGGETTI SOLIDI ***
        const ambientLight = new THREE.AmbientLight(0x404040, 5); // Luce ambientale chiara
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 50); // Luce puntiforme
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);


        // 2. Creazione dell'Oggetto 3D
        createSharedShaderMaterial(vertexShaderSource, fragmentShaderSource);
        
        createFlowMesh(aspect); 
        createHero3DObject(); // Usa MeshPhongMaterial e sarà visibile grazie alle luci

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

// Crea il Piano che copre tutto lo schermo (Flusso di Scorrimento) (NON MODIFICATO)
function createFlowMesh(aspect) {
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
    flowMesh = new THREE.Mesh(geometry, material); 
    scene.add(flowMesh);
}


// NUOVA FUNZIONE: Crea un oggetto 3D separato per la Hero Section - MODIFICATA
function createHero3DObject() {
    // Usiamo una BoxGeometry e la rotiamo per simulare una forma energetica complessa
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1); 
    
    // *** CAMBIAMENTO CRUCIALE: Usiamo MeshPhongMaterial per un oggetto solido e ben illuminato ***
    const heroMaterial = new THREE.MeshPhongMaterial({
        color: 0x00eeee, // Colore solido elettrico (visibile)
        emissive: 0x003333, // Leggero bagliore proprio
        specular: 0x00ffff, // Punti luce bianchi
        shininess: 100 // Molto lucido
    });
    
    threeDObject = new THREE.Mesh(geometry, heroMaterial); 
    
    // Posizionamento
    threeDObject.position.set(0.6, 0.0, 0.1); 
    
    // Rotazione iniziale (per mostrare che è 3D fin da subito)
    threeDObject.rotation.x = Math.PI * 0.25; 
    threeDObject.rotation.y = Math.PI * 0.25;
    
    scene.add(threeDObject);
}


// Funzione di Sincronizzazione (NON MODIFICATA)
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

    // 2. Animazione continua dell'Oggetto Hero 3D con GSAP
    gsap.to(threeDObject.rotation, {
        z: Math.PI * 2, 
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
    
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (flowMesh) {
        scene.remove(flowMesh);
        createFlowMesh(aspect);
    }
}

// Funzione Animate - MODIFICATA
function animate(time) {
    requestAnimationFrame(animate);

    uTime = time / 1000;
    if (material) {
        material.uniforms.uTime.value = uTime;
    }
    
    // Rotazione costante per un effetto dinamico (oltre alla rotazione Z di GSAP)
    if (threeDObject) {
        threeDObject.rotation.x += 0.005; // Rotazione lenta sull'asse X
    }

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
