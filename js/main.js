// js/main.js

import * as THREE from 'three';

// Carica gli shader
const loadShaders = async (vertexPath, fragmentPath) => {
    const vertex = await fetch(vertexPath).then(res => res.text());
    const fragment = await fetch(fragmentPath).then(res => res.text());
    return { vertex, fragment };
};

const init = async () => {
    // Colori da flashimpianti.netlify.app per l'effetto
    const FLOW_COLOR = new THREE.Color(0x00FFFF); // Ciano brillante

    const canvas = document.getElementById('flow-canvas');

    // 1. Struttura Base: Scena, Telecamera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, // Importante per la trasparenza dello sfondo
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Sfondo trasparente

    camera.position.z = 5;

    // 2. Creazione dell'Effetto Corrente (Shader)
    const { vertex, fragment } = await loadShaders('./shaders/vertex.glsl', './shaders/fragment.glsl');
    
    const uniforms = {
        uTime: { value: 0.0 },
        uScrollProgress: { value: 0.0 },
        uFlowColor: { value: FLOW_COLOR }
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        blending: THREE.AdditiveBlending, // Effetto glow più intenso
        depthWrite: false,
    });

    // A. Geometria del Flusso: Creiamo una curva complessa (Line Curve)
    const points = [
        new THREE.Vector3(-3, 1.5, 0),
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(2, -1, 0),
        new THREE.Vector3(3, 0.5, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(points);

    // Usiamo TubeGeometry per dare volume e luce al flusso
    const geometry = new THREE.TubeGeometry(curve, 64, 0.05, 8, false); // path, segments, radius, radialSegments, closed

    const flowMesh = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(flowMesh);

    // 3. Sincronizzazione con lo Scroll (GSAP/Logica Custom)
    let scrollPercentage = 0;
    
    const calculateScrollPercentage = () => {
        const docHeight = document.body.scrollHeight - window.innerHeight;
        scrollPercentage = window.scrollY / docHeight;
        if (docHeight === 0) scrollPercentage = 0;
        
        // Passa il valore allo Shader
        uniforms.uScrollProgress.value = scrollPercentage;
    };

    window.addEventListener('scroll', calculateScrollPercentage);
    
    // Inizializza al carico della pagina
    calculateScrollPercentage(); 

    // Loop di Animazione
    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);

        // Aggiorna uTime per l'animazione pulsante/scintillante
        uniforms.uTime.value = clock.getElapsedTime();

        renderer.render(scene, camera);
    };

    // Gestione del ridimensionamento della finestra
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        calculateScrollPercentage(); // Ricalcola dopo il ridimensionamento
    };

    window.addEventListener('resize', onWindowResize);

    animate();
};

init();
