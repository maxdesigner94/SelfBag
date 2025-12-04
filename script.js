document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Preloader
    const preloader = document.querySelector('.preloader');
    window.onload = () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
            initAnimations(); // Avvia animazioni solo dopo il load
        }, 800);
    };

    // 2. Custom Cursor
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    const links = document.querySelectorAll('a, button, .swatch, .card');

    document.addEventListener('mousemove', (e) => {
        // Movimento leggero e fluido
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
        gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
    });

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            follower.classList.add('cursor-hover');
            gsap.to(cursor, { scale: 0.5 });
        });
        link.addEventListener('mouseleave', () => {
            follower.classList.remove('cursor-hover');
            gsap.to(cursor, { scale: 1 });
        });
    });

    // 3. GSAP Animations & ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    function initAnimations() {
        // Hero Text Reveal
        gsap.from(".reveal-text", {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: "power3.out"
        });

        // Parallax Effect Hero
        gsap.to(".parallax-bg", {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // Reveal Cards on Scroll
        gsap.utils.toArray('.card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: "top 85%",
                },
                y: 100,
                opacity: 0,
                duration: 0.8,
                delay: i * 0.1,
                ease: "power2.out"
            });
        });

        // Lateral Text Move in Configurator
        gsap.from(".config-text", {
            scrollTrigger: {
                trigger: "#configurator",
                start: "top 70%",
            },
            x: -100,
            opacity: 0,
            duration: 1
        });
        
        // Car SVG Pop in
        gsap.from("#car-svg", {
            scrollTrigger: {
                trigger: "#configurator",
                start: "top 70%",
            },
            scale: 0.8,
            opacity: 0,
            duration: 1.2,
            ease: "elastic.out(1, 0.7)"
        });
    }

    // 4. Vanilla Tilt Effect Logic
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max rotazione 10deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // 5. Configurator Logic
    const carBody = document.querySelector('#car-body');
    const swatches = document.querySelectorAll('.swatch');
    const rimButtons = document.querySelectorAll('.rim-options button');
    const wheels = document.querySelectorAll('#wheel-front, #wheel-back');
    const priceTag = document.getElementById('price-tag');
    let currentConfig = { color: 'Rosso', rim: 'Standard' };

    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            // Rimuovi active dagli altri
            swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            
            // Cambia colore SVG
            const color = swatch.getAttribute('data-color');
            gsap.to(carBody, { fill: color, duration: 0.5 });
            
            // Aggiorna config per email
            if(color === '#D72638') currentConfig.color = 'Rosso Sport';
            if(color === '#1A1A1A') currentConfig.color = 'Nero Notte';
            if(color === '#F2F2F2') currentConfig.color = 'Bianco Ghiaccio';
            if(color === '#2E4057') currentConfig.color = 'Blu Diplomatico';
        });
    });

    rimButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            rimButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const rimType = btn.getAttribute('data-rim');
            currentConfig.rim = rimType;

            if(rimType === 'sport') {
                gsap.to(wheels, { stroke: '#D72638', strokeWidth: 4, duration: 0.3 });
                priceTag.innerText = "€ 25.800";
            } else {
                gsap.to(wheels, { stroke: '#555', strokeWidth: 2, duration: 0.3 });
                priceTag.innerText = "€ 24.500";
            }
        });
    });

    // 6. Prefill Contact Form
    window.prefillForm = function() {
        const messageBox = document.getElementById('message');
        messageBox.value = `Salve, vorrei un preventivo per l'auto configurata:\nColore: ${currentConfig.color}\nCerchi: ${currentConfig.rim}`;
        // Scroll to form
        document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' });
    };

    // 7. Navbar Sticky & Hamburger
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if(window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Aggiungi animazione alle linee dell'hamburger se vuoi
    });
});
