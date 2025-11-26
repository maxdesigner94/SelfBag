let scene, camera, renderer, material, geometry, mesh;
let uScrollProgress = 0.0;
let uTime = 0.0;

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
        // Carica i contenuti degli shader dai file
        const vertexShaderSource = await loadShader('./shaders/vertex.glsl');
        const fragmentShaderSource = await loadShader('./shaders/fragment.glsl');

        const canvas = document.getElementById('flowCanvas');

        // 1. Inizializzazione Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // 2. Inizializzazione Scena
        scene = new THREE.Scene();

        // 3. Inizializzazione Telecamera Ortografica
        const aspect = window.innerWidth / window.innerHeight;
        // La telecamera coprirà l'area da -aspect a +aspect (larghezza) e da -1 a +1 (altezza)
        camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 1000);
        camera.position.z = 1;

        // 4. Creazione dell'Oggetto
        createFlowMesh(vertexShaderSource, fragmentShaderSource);

        // 5. Gestione degli eventi
        window.addEventListener('resize', onWindowResize);
        window.addEventListener('scroll', onScroll, { passive: true });

        // Inizio del Loop di Animazione
        animate();

    } catch (error) {
        console.error("Errore durante l'inizializzazione:", error);
    }
}

function createFlowMesh(vsSource, fsSource) {
    // Geometria: un semplice piano che copre l'area visibile
    const aspect = window.innerWidth / window.innerHeight;
    geometry = new THREE.PlaneGeometry(2 * aspect, 2, 64, 64);

    // Materiale: ShaderMaterial
    material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uScrollProgress: { value: 0.0 },
            uColor: { value: new THREE.Color(0x00ffff) } // Blu elettrico
        },
        vertexShader: vsSource,
        fragmentShader: fsSource,
        transparent: true,
        blending: THREE.AdditiveBlending,
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Potrebbe essere necessario aggiornare la geometria del piano se si usa una camera ortografica
    if (mesh) {
        scene.remove(mesh);
        createFlowMesh(material.vertexShader, material.fragmentShader); // Ricrea la mesh con la nuova proporzione
    }
}

function onScroll() {
    // Calcola la percentuale di scorrimento (0.0 a 1.0)
    const scrollMax = document.body.scrollHeight - window.innerHeight;
    uScrollProgress = scrollMax > 0 ? window.scrollY / scrollMax : 0;
    
    // Aggiorna l'uniform
    if (material) {
        material.uniforms.uScrollProgress.value = uScrollProgress;
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    // Aggiornamento dell'Uniform del Tempo
    uTime = time / 1000;
    if (material) {
        material.uniforms.uTime.value = uTime;
    }

    renderer.render(scene, camera);
}

// Avvia l'app al caricamento del DOM
document.addEventListener('DOMContentLoaded', init);
