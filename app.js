document.addEventListener('DOMContentLoaded', () => {

    // 1. GESTIONE SCROLL FLUIDO
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight; // Compensa l'header sticky
                const offsetTop = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
            
            // Chiudi il menu mobile dopo il click (se aperto)
            const nav = document.querySelector('.nav');
            if (nav.classList.contains('open')) {
                nav.classList.remove('open');
            }
        });
    });

    // 2. TOGGLE MENU MOBILE
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }

    // 3. INIZIALIZZAZIONE ANIMAZIONI LOTTIE
    // NOTE: Devi sostituire 'path/to/lottie-file.json' con il percorso dei tuoi file Lottie
    // che rappresentano i concetti di sicurezza, deposito, chiavi, ecc.

    const lottieConfigs = [
        { container: document.getElementById('lottie-hero'), path: 'lotties/secure-storage.json' },
        { container: document.getElementById('lottie-sicurezza'), path: 'lotties/shield-check.json' },
        { container: document.getElementById('lottie-assistenza'), path: 'lotties/live-support.json' },
        { container: document.getElementById('lottie-flessibilita'), path: 'lotties/time-flexibility.json' },
        { container: document.getElementById('lottie-chiavi'), path: 'lotties/key-delivery.json' },
        { container: document.getElementById('lottie-prenota'), path: 'lotties/online-booking.json' },
        { container: document.getElementById('lottie-deposita'), path: 'lotties/lock-deposit.json' },
        { container: document.getElementById('lottie-ritira'), path: 'lotties/bag-pickup.json' },
    ];
    
    lottieConfigs.forEach(config => {
        if (config.container) {
            lottie.loadAnimation({
                container: config.container,
                renderer: 'svg', // Usa SVG per la massima nitidezza e scalabilità
                loop: true,
                autoplay: true,
                path: config.path
            });
        }
    });

});
