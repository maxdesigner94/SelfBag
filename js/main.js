// js/main.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
// GSAP e ScrollTrigger sono caricati globalmente in index.html

document.addEventListener('DOMContentLoaded', () => {
    
    // Riferimenti HTML
    const webglContainer = document.getElementById('webgl-container');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Variabili Globali 3D
    let scene, camera, renderer;
    let tubeMesh;
    let customShaderMaterial; // Rendi il materiale accessibile globalmente
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
                
                // Animazione di entrata della Hero Section (GSAP)
                gsap.fromTo("#hero-section .hero-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-description", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-actions", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power3.out" });
                
                // Animazione di entrata dell'oggetto 3D
                if (tubeMesh) {
                     gsap.fromTo(tubeMesh.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.5)", delay: 0.8 });
                }

                // SETUP DELLO SCROLLTRIGGER DOPO IL CARICAMENTO
                setupScrollAnimations();
            }
        });
    };

    // ----------------------------------------------------
    // CURVA DINAMICA E GEOMETRIA (THREE.Curve & THREE.ShaderMaterial)
    // ----------------------------------------------------

    // Curva di Bézier 3D personalizzata
    class CustomCurve extends THREE.Curve {
        constructor(scale = 15) {
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
    const createShaderMaterial = () => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                colorA: { value: new THREE.Color(0x00ffff) }, // Ciano iniziale
                colorB: { value: new THREE.Color(0x000044) }, // Viola scuro
                mouseOffset: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying float vProgress;

                void main() {
                    vUv = uv;
                    vProgress = position.z; 
                    
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
                    glow *= 1.0 - smoothstep(0.4, 0.5, length(mouseOffset)); 
                    
                    color *= glow * 1.5;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide
        });
    };
    
    // Funzione per creare e aggiungere la curva
    const createTube = () => {
        const path = new CustomCurve(15);
        const segments = 250;
        const radius = 0.2;
        const radiusSegments = 8;
        const closed = false;

        const geometry = new THREE.TubeGeometry(path, segments, radius, radiusSegments, closed);
        
        customShaderMaterial = createShaderMaterial();
        tubeMesh = new THREE.Mesh(geometry, customShaderMaterial);
        
        // Impostazioni iniziali
        tubeMesh.rotation.x = -Math.PI / 2; // Allinea sull'asse Z
        tubeMesh.position.y = 0; 
        tubeMesh.scale.set(0, 0, 0); // Inizializza a zero per l'animazione di entrata

        scene.add(tubeMesh);
        
        // Simula il completamento del caricamento (senza veri GLTFLoader)
        loadingManager.onLoad();
    };

    // ----------------------------------------------------
    // GESTIONE TRANSIZIONI 3D (Sincronizzazione)
    // ----------------------------------------------------
    const handle3DNavigation = (section) => {
        console.log(`Scena 3D: Attivo l'animazione per la sezione: ${section}`);
        
        if (!tubeMesh) return;

        if (section === 'services') {
            // Transizione a Servizi: Allontana camera, ruota curva, cambia colore
            gsap.to(camera.position, { z: 8, duration: 2, ease: "power2.inOut" });
            gsap.to(tubeMesh.rotation, { x: 0, y: Math.PI / 4, z: 0, duration: 2, ease: "power2.inOut" });
            
            // Cambio colore a Magenta
            gsap.to(customShaderMaterial.uniforms.colorA.value, { 
                r: 1, g: 0, b: 1, 
                duration: 2
            });
            
        } else if (section === 'home') {
            // Transizione a Home: Ritorna alla posizione iniziale
            gsap.to(camera.position, { z: 5, duration: 2, ease: "power2.inOut" });
            gsap.to(tubeMesh.rotation, { x: -Math.PI / 2, y: 0, z: 0, duration: 2, ease: "power2.inOut" });
            
            // Ritorno al Ciano
             gsap.to(customShaderMaterial.uniforms.colorA.value, { 
                r: 0, g: 1, b: 1, 
                duration: 2
            });
        }
    };
    
    // ----------------------------------------------------
    // SCROLLTRIGGER E ANIMAZIONI SEZIONI HTML
    // ----------------------------------------------------
    const setupScrollAnimations = () => {
        
        // Animazione titoli e sottotitoli della Sezione Servizi
        gsap.fromTo("#services-section .section-title, #services-section .section-subtitle", 
            { opacity: 0, y: 50 }, 
            { 
                opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power2.out",
                scrollTrigger: {
                    trigger: "#services-section",
                    start: "top center+=100", 
                    toggleActions: "play none none reverse"
                }
            }
        );

        // Animazione delle card (Effetto Ologramma)
        gsap.fromTo(".service-card", 
            { opacity: 0, y: 50, rotationX: 15 }, 
            { 
                opacity: 1, y: 0, rotationX: 0, duration: 1, stagger: 0.15, ease: "power3.out",
                scrollTrigger: {
                    trigger: ".services-grid",
                    start: "top center+=50",
                    toggleActions: "play none none reverse"
                }
            }
        );
        
        // Animazione 3D della scena sincronizzata allo Scroll
        ScrollTrigger.create({
            trigger: "#services-section",
            start: "top bottom", 
            end: "bottom top", 
            onEnter: () => handle3DNavigation('services'),
            onLeaveBack: () => handle3DNavigation('home'),
        });
    };


    // ----------------------------------------------------
    // INIZIALIZZAZIONE E LOOP PRINCIPALE
    // ----------------------------------------------------

    function init() {
        // Setup Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); 
        webglContainer.appendChild(renderer.domElement);

        // Setup Scena e Camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = 5; 
        
        // Luci
        const ambientLight = new THREE.AmbientLight(0x404040, 2); 
        scene.add(ambientLight);

        // Creazione Oggetto 3D
        createTube();

        // Avvia l'animation loop
        animate();
    }

    // Loop di animazione
    const animate = () => {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Aggiorna l'uniform 'time' nello shader per l'animazione dinamica
        if (customShaderMaterial) {
            customShaderMaterial.uniforms.time.value = elapsedTime;
        }

        // Movimento continuo e leggero della camera per "dare vita" alla scena
        camera.position.x = Math.sin(elapsedTime * 0.05) * 0.2;
        camera.position.y = Math.cos(elapsedTime * 0.05) * 0.2;
        
        // Logica di movimento della curva (Rotazione continua + Interattività)
        if (tubeMesh) {
            // Rotazione continua
            tubeMesh.rotation.z += 0.005 * delta * 60; 
            
            // Interattività: Sposta il tubo con il mouse (GSAP per easing)
            gsap.to(tubeMesh.position, {
                x: mouse.x * 0.5,
                y: mouse.y * 0.5,
                duration: 1.5,
                ease: 'power3.out'
            });
            
            // Passa l'offset del mouse allo shader per l'effetto di bagliore interattivo
            if (customShaderMaterial) {
                customShaderMaterial.uniforms.mouseOffset.value.set(mouse.x, mouse.y);
            }
        }

        renderer.render(scene, camera);
    };

    // ----------------------------------------------------
    // EVENTI DI INTERATTIVITÀ GLOBALE
    // ----------------------------------------------------

    // Reattività al ridimensionamento
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Reattività al movimento del mouse
    window.addEventListener('mousemove', (event) => {
        // Normalizza le coordinate del mouse da -1 a +1
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Reattività all'evento di navigazione dalla navbar (click)
    window.addEventListener('navigate3D', (event) => {
        const section = event.detail.section;
        handle3DNavigation(section);
        
        // Scroll fluido alla sezione cliccata
        // La sintassi è stata corretta per chiudere correttamente la chiamata a gsap.to
        gsap.to(window, { 
            scrollTo: `#${section}-section`, 
            duration: 1.5, 
            ease: "power2.inOut" 
        });
    });

    // Avvia l'inizializzazione del WebGL
    init();
});
