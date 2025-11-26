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

// Crea il Materiale Shader Condiviso
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
        depthWrite: false // Ottimizzazione: non scrive nel depth buffer
    });
}

// Crea il Piano che copre tutto lo schermo per visualizzare l'effetto del flusso
function createFlowMesh(aspect) {
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
    flowMesh = new THREE.Mesh(geometry, material);
    scene.add(flowMesh);
}


// Crea l'oggetto SVG 3D (ExtrudeGeometry)
function createSvg3DMesh() {
    const loader = new THREE.SVGLoader();
    
    // Esempio SVG (Sostituire con il proprio percorso o stringa SVG)
    // Usiamo il logo Three.js (semplificato) per un esempio di extrusione
    loader.load('./models/svg/example.svg' , function (data) {
    // Nota: Il path sopra è un placeholder. Per test locali, potresti dover usare un file
    // SVG locale o il percorso completo di una risorsa esterna.
    // In questo esempio, useremo un SVG noto da mrdoob per garantire il funzionamento del loader
    // Se non hai un file .svg nel progetto, DEVI usare un esempio noto:
    // loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/svg/threejs.svg', function (data) {
        
        const paths = data.paths;
        svgMeshGroup = new THREE.Group();
        
        // La scala e l'inversione Y sono tipiche del caricamento SVG in Three.js
        svgMeshGroup.scale.set(0.005, -0.005, 0.005); 

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
                
                // Usiamo un materiale semplice per la mesh SVG, non lo shader di flusso
                // Lo shader di flusso viene applicato al piano (flowMesh)
                const basicMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xcccccc, 
                    side: THREE.DoubleSide,
                    opacity: 0.5,
                    transparent: true
                });
                
                const meshPart = new THREE.Mesh(geometry, basicMaterial); 
                svgMeshGroup.add(meshPart);
            }
        }
        
        // Posizionamento e Rotazione Iniziale
        svgMeshGroup.position.set(0.6, 0.0, 0); // Posizione nella colonna destra
        svgMeshGroup.rotation.x = Math.PI * 0.1; 
        svgMeshGroup.rotation.y = Math.PI * 0.2; 
        
        scene.add(svgMeshGroup);
    },
    // Gestore del progresso (opzionale)
    undefined, 
    // Gestore degli errori (cruciale)
    function (error) {
        console.error('Errore nel caricamento del SVG.', error);
        console.warn("Se l'errore è CORS, carica il SVG da una risorsa locale o disabilita il caricamento SVG temporaneamente.");
    });
}


function setupScrollSync() {
    const progressElement = document.getElementById('flow-progress');

    // 1. Sincronizzazione 3D: Collega lo scroll VERTICALE all'uniform dello shader
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

    // 2. Sincronizzazione HTML: Animazione della Sezione di Attivazione
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
    
    // 3. Animazione SVG in Scroll
    if (svgMeshGroup) {
        gsap.to(svgMeshGroup.rotation, {
            y: "+=" + Math.PI * 1, // Ruota di 180 gradi durante lo scroll
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: true,
            }
        });
        
        // Esempio: Sposta leggermente il SVG in alto nella hero section
         gsap.to(svgMeshGroup.position, {
            y: -0.1, 
            scrollTrigger: {
                trigger: "#hero-flow",
                start: "top top",
                end: "bottom top",
                scrub: true,
            }
        });
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
    if (svgMeshGroup) {
        svgMeshGroup.rotation.y += 0.001; 
    }

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
