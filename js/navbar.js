document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const navItems = document.querySelectorAll('.nav-item');

    // 1. Logica di Scroll per la Navbar (GSAP ScrollTrigger)
    // Riduci il padding dell'header quando si scorre
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        start: 'top -50', // Attiva l'azione dopo 50px di scroll
        end: 99999,
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

    // 2. Logica dei Link Attivi (Simulazione di navigazione tra sezioni)
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Rimuovi la classe 'active' da tutti i link
            navItems.forEach(link => link.classList.remove('active'));

            // Aggiungi la classe 'active' al link cliccato
            item.classList.add('active');

            // QUI IN FUTURO:
            // - Si può usare GSAP per uno scroll fluido (scrollTo plugin)
            // - Oppure si può notificare la scena 3D (tramite un Event Dispatcher)
            //   di cambiare punto di vista o animazione in base alla sezione.
            
            const section = item.getAttribute('data-section');
            console.log(`Navigazione alla sezione: ${section}. La scena 3D attiverà la sua animazione per questa sezione.`);

            // Esempio: Invia un evento alla logica 3D
            const event = new CustomEvent('navigate3D', { detail: { section: section } });
            window.dispatchEvent(event);
        });
    });

    // Imposta 'Home' come attivo all'inizio
    const homeLink = document.querySelector('[data-section="home"]');
    if (homeLink) {
        homeLink.classList.add('active');
    }
});
