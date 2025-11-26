// js/main.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
// GSAP è globale

document.addEventListener('DOMContentLoaded', () => {
    
    // Riferimenti HTML
    const webglContainer = document.getElementById('webgl-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const heroImageContainer = document.getElementById('hero-3d-object-placeholder');

    // Variabili Globali 3D
    let scene, camera, renderer;
    let tubeMesh;
    let mouse = { x: 0, y: 0 };
    const clock = new THREE.Clock();

    // ----------------------------------------------------
    // GESTIONE DEL CARICAMENTO E UX
    // ----------------------------------------------------
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onLoad = () => {
        console.log('Risorse 3D caricate. Avvio scena.');
        hideLoadingOverlay();
    };

    loadingManager.onError = (url) => {
        console.error('Errore nel caricamento 3D:', url);
        hideLoadingOverlay(); // Mostra comunque la pagina
    };

    const hideLoadingOverlay = () => {
        gsap.to(loadingOverlay, {
            opacity: 0,
            duration: 1.2,
            ease: 'power2.out',
            onComplete: () => {
                loadingOverlay.classList.add('hidden');
                // Animazione di entrata della Hero
                gsap.fromTo("#hero-section .hero-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-description", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-actions", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power3.out" });
                gsap.fromTo(tubeMesh.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.5)", delay: 0.8 });
            }
        });
    };

    // ----------------------------------------------------
    // CURVA DINAMICA E GEOMETRIA
    // ----------------------------------------------------

    // Curva di Bézier 3D personalizzata
    class CustomCurve extends THREE.Curve {
        constructor(scale = 10) {
            super();
            this.scale = scale;
        }
        getPoint(t, optionalTarget = new THREE.Vector3()) {
            const tx = Math.sin(t * 3 * Math.PI) * this.scale * 0.5;
            const ty = Math.cos(t * 3 * Math.PI) * this.scale * 0.5;
            const tz = t * this.scale - this.scale / 2;
            return optionalTarget.set(tx, ty, tz);
        }
    }

    // Materiale con Shader personalizzato (GLSL)
    const customShaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            // Tempo per l'animazione
            time: { value: 0.0 },
            // Colore principale (il nostro neon ciano)
            colorA: { value: new THREE.Color(0x00ffff) },
            // Colore secondario (viola scuro)
            colorB: { value: new THREE.Color(0x000044) },
            // Posizione del mouse per interattività (passiamo l'offset)
            mouseOffset: { value: new THREE.Vector2(0, 0) }
        },
        vertexShader: `
            uniform float time;
            varying vec2 vUv;
            varying float vProgress;

            void main() {
                vUv = uv;
                vProgress = position.z; // Usiamo la Z come progresso lungo il tubo
                
                // Effetto ondulato sulla geometria nel tempo
                vec3 newPosition = position;
                float offset = sin(newPosition.x * 2.0 + time * 3.0) * 0.1;
                newPosition.y += offset;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 colorA;
            uniform vec3 colorB;
            uniform vec2 mouseOffset;
            varying vec2 vUv;
            varying float vProgress;

            void main() {
                // Interpolazione del colore lungo l'asse Z
                vec3 color = mix(colorB, colorA, vProgress * 0.8 + 0.2);

                // Aggiungiamo un bagliore neon dinamico
                float glow = sin(vUv.y * 10.0 + time * 5.0) * 0.2 + 0.8;
                glow *= 1.0 - smoothstep(0.4, 0.5, length(mouseOffset)); // Riduce il bagliore se il mouse è fermo
                
                color *= glow * 1.5;

                // Finiamo con un po' di opacità per l'effetto olografico
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        side: THREE.DoubleSide
    });
    
    // Funzione per creare e aggiungere la curva
    const createTube = () => {
        const path = new CustomCurve(15);
        const segments = 250;
        const radius = 0.2;
        const radiusSegments = 8;
        const closed = false;

        const geometry = new THREE.TubeGeometry(path, segments, radius, radiusSegments, closed);
        
        // Creiamo il mesh con lo ShaderMaterial
        tubeMesh = new THREE.Mesh(geometry, customShaderMaterial);
        tubeMesh.rotation.x = -Math.PI / 2; // Ruota per allinearlo all'orizzonte
        tubeMesh.position.y = 0; // Posizione iniziale
        
        scene.add(tubeMesh);
        console.log('Curva 3D aggiunta alla scena.');
        
        // Simula che il caricamento sia completo dopo la creazione della mesh
        // NOTA: In un caso reale, il LoadingManager gestisce GLTFLoader/TextureLoader,
        // ma per il codice generato in runtime, simula qui il completamento.
        // **Rimuovi la chiamata qui se usi loader effettivi!**
        loadingManager.onLoad();
    };

    // ----------------------------------------------------
    // INIZIALIZZAZIONE E LOOP
    // ----------------------------------------------------

    function init() {
        // Setup base (camera, renderer, luci...)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); 
        webglContainer.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 5; 
        
        const ambientLight = new THREE.AmbientLight(0x404040, 2); 
        scene.add(ambientLight);

        createTube();

        // Avvia l'animation loop
        animate();
    }

    // Loop di animazione
    const animate = () => {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Aggiorna l'uniform 'time' nello shader per l'animazione
        customShaderMaterial.uniforms.time.value = elapsedTime;

        // Logica di movimento della camera (Leggero movimento continuo)
        camera.position.x = Math.sin(elapsedTime * 0.05) * 0.2;
        camera.position.y = Math.cos(elapsedTime * 0.05) * 0.2;
        
        // Logica di movimento del tubo (Rotazione leggera)
        if (tubeMesh) {
            tubeMesh.rotation.z += 0.005 * delta * 60; 
            
            // Interattività: Sposta il tubo leggermente con il mouse
            gsap.to(tubeMesh.position, {
                x: mouse.x * 0.5,
                y: mouse.y * 0.5,
                duration: 1.5,
                ease: 'power3.out'
            });
            
            // Passa l'offset del mouse allo shader per l'effetto di bagliore interattivo
            customShaderMaterial.uniforms.mouseOffset.value.set(mouse.x, mouse.y);
        }

        renderer.render(scene, camera);
    };

    // ----------------------------------------------------
    // EVENTI DI INTERATTIVITÀ
    // ----------------------------------------------------

    // Reattività al ridimensionamento
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Reattività al movimento del mouse (Interazione UX)
    window.addEventListener('mousemove', (event) => {
        // Normalizza le coordinate del mouse da -1 a +1
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Reattività all'evento di navigazione dalla navbar
    window.addEventListener('navigate3D', (event) => {
        const section = event.detail.section;
        console.log(`Scena 3D: Attivo l'animazione per la sezione: ${section}`);
        
        // Esempio: Animazione della camera per la navigazione
        if (section === 'services') {
            gsap.to(camera.position, { z: 10, duration: 2, ease: "power2.inOut" });
            gsap.to(tubeMesh.rotation, { x: 0, y: Math.PI / 2, z: 0, duration: 2, ease: "power2.inOut" });
        } else if (section === 'home') {
            gsap.to(camera.position, { z: 5, duration: 2, ease: "power2.inOut" });
            gsap.to(tubeMesh.rotation, { x: -Math.PI / 2, y: 0, z: 0, duration: 2, ease: "power2.inOut" });
        }
        // Aggiungeremo più animazioni complesse man mano che sviluppiamo le sezioni.
    });

    // Avvia l'inizializzazione del WebGL
    init();
});
