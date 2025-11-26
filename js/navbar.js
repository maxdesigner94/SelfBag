// js/navbar.js

// Nota: GSAP e ScrollTrigger sono caricati globalmente in index.html

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const navItems = document.querySelectorAll('.nav-item');

    // 1. Logica di Scroll per la Navbar (GSAP ScrollTrigger)
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        trigger: 'body',
        start: 'top -50', 
        end: 'bottom',
        onToggle: self => {
            if (self.isActive) {
                // Navbar "miniaturizzata"
                gsap.to(header, {
                    padding: '10px 50px',
                    duration: 0.3,
                    ease: 'power2.inOut'
                });
            } else {
                // Navbar in stato iniziale
                gsap.to(header, {
                    padding: '20px 50px',
                    duration: 0.3,
                    ease: 'power2.inOut'
                });
            }
        }
    });

    // 2. Logica dei Link Attivi e Notifica alla Scena 3D
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Aggiorna classe 'active'
            navItems.forEach(link => link.classList.remove('active'));
            item.classList.add('active');

            // Invia un evento personalizzato alla logica 3D (main.js)
            const section = item.getAttribute('data-section');
            const event = new CustomEvent('navigate3D', { detail: { section: section } });
            window.dispatchEvent(event);

            // QUI IN FUTURO: GSAP.to(window, {scrollTo: `#${section}`}) per lo scroll
        });
    });
});
