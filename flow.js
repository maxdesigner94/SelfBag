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
        createFlowMesh(aspect); // Crea il piano invisibile per il flusso
        
        // 3. Caricamento e Creazione della Geometria SVG 3D
        createSvg3DMesh(); 

        // 4. Setup Sincronizzazione per il Piano (Subito disponibile)
        setupScrollSyncFlowPlane(); // Chiamiamo subito la sync del piano e dell'HTML

        // 5. Gestione degli eventi
        window.addEventListener('resize', onWindowResize);

        // Inizio del Loop di Animazione
        animate();

    } catch (error) {
        console.error("Errore durante l'inizializzazione del progetto:", error);
    }
}

// ... (createSharedShaderMaterial e createFlowMesh NON MODIFICATI) ...

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

function createFlowMesh(aspect) {
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);
    flowMesh = new THREE.Mesh(geometry, material); 
    scene.add(flowMesh);
}


// Crea l'oggetto SVG 3D (ExtrudeGeometry) - MODIFICATO
function createSvg3DMesh() {
    const loader = new THREE.SVGLoader();
    
    // CARICA IL TUO NUOVO SVG
    loader.load('./models/svg/lightning.svg', function (data) {
        
        const paths = data.paths;
        svgMeshGroup = new THREE.Group();
        
        svgMeshGroup.scale.set(0.005, -0.005, 0.005); 

        const extrudeSettings = {
            depth: 0.1, 
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
        
        // **********************************************
        // CHIAMATA CRUCIALE: AVVIA LE ANIMAZIONI SVG QUI
        // **********************************************
        setupScrollSyncSvg(); 

    },
    // Gestore del progresso (opzionale)
    undefined, 
    // Gestore degli errori (cruciale)
    function (error) {
        console.error('Errore nel caricamento del SVG.', error);
        console.warn("Assicurati che 'models/svg/lightning.svg' esista e sia accessibile.");
    });
}


// NUOVA FUNZIONE: Sincronizza solo gli elementi immediatamente disponibili (Piano e HTML)
function setupScrollSyncFlowPlane() {
    const progressElement = document.getElementById('flow-progress');

    // 1. Sincronizzazione 3D del Piano
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

    // 2. Sincronizzazione HTML
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

// NUOVA FUNZIONE: Sincronizza solo l'SVG dopo il suo caricamento
function setupScrollSyncSvg() {
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


// ... (onWindowResize e animate NON MODIFICATI) ...

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

function animate(time) {
    requestAnimationFrame(animate);

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
