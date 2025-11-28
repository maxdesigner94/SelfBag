gsap.registerPlugin(ScrollTrigger);

// 1. ANIMAZIONE INIZIALE (Anime.js non è necessario, usiamo GSAP per coerenza)
const animateHeroText = () => {
    gsap.fromTo(".hero-title, .hero-subtitle, .scroll-indicator", 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.5, ease: "power3.out", stagger: 0.2 }
    );
};

// 2. FUNZIONE PRINCIPALE DI PARALLASSE
const initParallax = () => {
    // Prende tutti gli elementi con l'attributo data-speed
    const layers = document.querySelectorAll('.parallax-bg, .parallax-element');

    layers.forEach(layer => {
        const speed = parseFloat(layer.getAttribute('data-speed'));
        
        // Crea un'animazione ScrollTrigger per ogni layer
        gsap.to(layer, {
            // Muovi la posizione Y dell'elemento rispetto al contenitore principale
            y: (index, target) => {
                // Calcola la distanza di scorrimento completa
                const scrollDistance = window.innerHeight * 2; // Basato su 2 sezioni
                return -scrollDistance * speed; // La velocità è amplificata o ridotta da 'speed'
            },
            ease: "none",
            scrollTrigger: {
                trigger: "#scroll-container",
                start: "top top",
                end: "bottom top",
                scrub: 0.5, // Parallasse fluido
            }
        });
    });
};


// 3. INTERATTIVITÀ MOUSE (Parallasse 3D fittizio sul mouse)
const carImages = document.querySelectorAll('.car-image');

window.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5); // Range -0.5 a 0.5
    const mouseY = (e.clientY / window.innerHeight - 0.5);

    // Muovi le immagini e gli elementi UI in modo opposto per l'effetto parallasse
    carImages.forEach(img => {
        gsap.to(img, {
            x: -mouseX * 30, // Movimento lento (simula l'oggetto lontano)
            y: -mouseY * 30,
            duration: 1.5,
            ease: "power2.out"
        });
    });

    // Elementi UI (testo)
    const uiElements = document.querySelectorAll('.parallax-element h1, .parallax-element p');
    uiElements.forEach(el => {
        gsap.to(el, {
            x: mouseX * 15, // Movimento veloce (simula l'oggetto vicino)
            y: mouseY * 15,
            duration: 1.5,
            ease: "power2.out"
        });
    });
});


// 4. ESECUZIONE
window.addEventListener('load', () => {
    // Poiché non abbiamo un loader 3D pesante, l'avvio è immediato
    
    // Simulate loader finish (for first-load UI)
    const loader = document.getElementById('loader');
    if (loader) { // Controlla se il loader esiste ancora nel DOM se lo vuoi rimuovere
         gsap.to(loader, { opacity: 0, duration: 0.5, onComplete: () => {
            if(loader.parentNode) loader.parentNode.removeChild(loader);
            initParallax();
            animateHeroText();
        }});
    } else {
        initParallax();
        animateHeroText();
    }
});
