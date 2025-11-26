// Variabili globali per Three.js
let scene, camera, renderer, material, flowMesh;
let uScrollProgress = 0.0;
let uTime = 0.0;
let svgMeshGroup; // Gruppo che conterrà la geometria SVG 3D

// Registra i plugin di GSAP
if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
} else {
    console.error("GSAP o ScrollTrigger non caricati correttamente.");
}

// Funzione per caricare il contenuto di un file shader esterno
async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Impossibile caricare lo shader da ${url}: ${response.statusText}`);
    }
    return response.text();
}

// Funzione di inizializzazione principale
async function init() {
    try {
        // Carica i contenuti degli shader
        const vertexShaderSource = await loadShader('./shaders/vertex.glsl');
        const fragmentShaderSource = await loadShader('./shaders/fragment.glsl');

        const canvas = document.getElementById('flowCanvas');

        // 1. Setup Base di Three.js
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        scene = new THREE.Scene();

        // Camera Ortografica per un effetto di overlay 2D
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
        camera.position.z = 1;

        // 2. Creazione dell'Oggetto 3D
        createSharedShaderMaterial(vertexShaderSource, fragmentShaderSource);
        createFlowMesh(aspect); // Crea il piano invisibile per il flusso
        
        // 3. Caricamento e Creazione della Geometria SVG 3D
        createSvg3DMesh(); 

        // 4. Setup Sincronizzazione e Logica Interattiva
        setupScrollSync();

        // 5. Gestione degli eventi
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
            uScrollProgress: { value: 0.0 }, // 0.0 a 1.0
            uColor: { value: new THREE.Color(0x00ffff) } 
        },
        vertexShader: vsSource,
        fragmentShader: fsSource,
        transparent: true,
        blending: THREE.AdditiveBlending, // Effetto glow/luce
        depthWrite: false 
    });
}

// Crea il Piano che copre tutto lo schermo per visualizzare l'effetto del flusso (NON MODIFICATO)
function createFlowMesh(aspect) {
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
    flowMesh = new THREE.Mesh(geometry, material); // Applica il material condiviso
    scene.add(flowMesh);
}


// Crea l'oggetto SVG 3D (ExtrudeGeometry) - AGGIORNATO
function createSvg3DMesh() {
    const loader = new THREE.SVGLoader();
    
    // CARICA IL TUO NUOVO SVG (assicurati che il percorso sia corretto!)
    loader.load('./models/svg/lightning.svg', function (data) {
        
        const paths = data.paths;
        svgMeshGroup = new THREE.Group();
        
        svgMeshGroup.scale.set(0.005, -0.005, 0.005); // Scala e Inverti Y

        const extrudeSettings = {
            depth: 0.1, // Profondità 3D
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.02,
            bevelSegments: 2
        };

        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            
            const shapes = THREE.SVGLoader.createShapes(path);

            for (let j = 0; j < shapes.length; j++) {
                const shape = shapes[j];
                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                
                // === CAMBIAMENTO QUI ===
                // Applichiamo il material condiviso (il tuo shader di flusso) all'SVG 3D
                const meshPart = new THREE.Mesh(geometry, material); 
                svgMeshGroup.add(meshPart);
            }
        }
        
        // Posizionamento e Rotazione Iniziale
        svgMeshGroup.position.set(0.6, 0.0, 0); 
        svgMeshGroup.rotation.x = Math.PI * 0.1; 
        svgMeshGroup.rotation.y = Math.PI * 0.2; 
        
        scene.add(svgMeshGroup);
    },
    // Gestore del progresso (opzionale)
    undefined, 
    // Gestore degli errori (cruciale)
    function (error) {
        console.error('Errore nel caricamento del SVG.', error);
        console.warn("Assicurati che 'models/svg/lightning.svg' esista e sia accessibile. Errore di CORS potrebbe verificarsi se non è servito dalla stessa origine.");
    });
}


function setupScrollSync() {
    const progressElement = document.getElementById('flow-progress');

    // 1. Sincronizzazione 3D: Collega lo scroll VERTICALE all'uniform dello shader (NON MODIFICATO)
    gsap.to(material.uniforms.uScrollProgress, {
        value: 1.0, 
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: true, 
            onUpdate: (self) => {
                uScrollProgress = self.progress; 
                // Aggiorna l'indicatore HTML
                if (progressElement) {
                    progressElement.textContent = `${Math.round(uScrollProgress * 100)}%`;
                }
            }
        }
    });

    // 2. Sincronizzazione HTML: Animazione della Sezione di Attivazione (NON MODIFICATO)
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
    
    // 3. Animazione SVG in Scroll (NON MODIFICATO)
    // Controlla che svgMeshGroup sia stato caricato
    if (svgMeshGroup) { 
        gsap.to(svgMeshGroup.rotation, {
            y: "+=" + Math.PI * 1, 
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: true,
            }
        });
        
        gsap.to(svgMeshGroup.position, {
            y: -0.1, 
            scrollTrigger: {
                trigger: "#hero-flow",
                start: "top top",
                end: "bottom top",
                scrub: true,
            }
        });
    } else {
        // Fallback se SVG non è ancora caricato, o non lo è affatto
        console.warn("svgMeshGroup non è ancora disponibile per le animazioni GSAP. Assicurati che l'SVG sia caricato correttamente.");
        // Puoi aggiungere un listener per quando l'SVG è pronto, o avvolgere GSAP in una Promise.
    }
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

    // Aggiornamento dell'Uniform del Tempo
    uTime = time / 1000;
    if (material) {
        material.uniforms.uTime.value = uTime;
    }
    
    // Rotazione continua dell'SVG (per mostrarne la natura 3D)
    if (svgMeshGroup) { // Controlla che svgMeshGroup esista
        svgMeshGroup.rotation.y += 0.001; 
    }

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
