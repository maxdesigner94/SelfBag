// js/main.js
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
// Importiamo GSAP se necessario qui, anche se già caricato globalmente in index.html
// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger'; // Se useremo scroll specifici nella scena 3D

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM caricato, inizializzo la scena 3D...");
    
    // Riferimenti agli elementi HTML
    const webglContainer = document.getElementById('webgl-container');
    const loadingOverlay = document.getElementById('loading-overlay');

    // SCENA
    const scene = new THREE.Scene();

    // CAMERA
    // Una telecamera prospettica è ideale per scene 3D
    const camera = new THREE.PerspectiveCamera(
        75, // field of view (FOV)
        window.innerWidth / window.innerHeight, // aspect ratio
        0.1, // near clipping plane
        1000 // far clipping plane
    );
    camera.position.z = 5; // Posiziona la camera leggermente indietro per vedere gli oggetti

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, // Migliora la qualità dei bordi
        alpha: true // Permette uno sfondo trasparente per mostrare il CSS sottostante
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Rende la scena nitida su schermi HiDPI
    webglContainer.appendChild(renderer.domElement);

    // Gestione del ridimensionamento della finestra
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // LUCI (minimo indispensabile per ora)
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Luce ambientale morbida
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Luce direzionale
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // ANIMATION LOOP
    const animate = () => {
        requestAnimationFrame(animate);

        // Qui andremo a inserire le logiche di animazione degli oggetti 3D
        // ad esempio: object.rotation.x += 0.01;

        renderer.render(scene, camera);
    };

    // FUNZIONE PER NASCONDERE L'OVERLAY DI CARICAMENTO
    const hideLoadingOverlay = () => {
        gsap.to(loadingOverlay, {
            opacity: 0,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                loadingOverlay.classList.add('hidden');
                // Qui potremmo anche animare l'entrata degli elementi HTML della hero
                gsap.fromTo("#hero-section .hero-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-description", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 0.7, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-image-container", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, delay: 0.9, ease: "power3.out" });
                gsap.fromTo("#hero-section .hero-actions", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: 1.1, ease: "power3.out" });
            }
        });
    };

    // Avvia l'animazione
    animate();

    // Simula un tempo di caricamento per il 3D e poi nascondi l'overlay
    // In un progetto reale, questo sarebbe legato al caricamento effettivo di modelli/texture
    setTimeout(() => {
        hideLoadingOverlay();
    }, 2000); // 2 secondi di delay per simulare il caricamento
});
