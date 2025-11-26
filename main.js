// main.js

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('webgl-container').appendChild(renderer.domElement);

camera.position.z = 5;

// --- UTILITIES ---

// Ritorna la posizione 3D (x, y, z) corrispondente al centro di un elemento DOM
function mapDOMTo3D(element) {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth * 2 - 1;
    const y = -(rect.top + rect.height / 2) / window.innerHeight * 2 + 1;

    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);

    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(distance));
}

// Gestione del ridimensionamento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- LUCI BASE ---

const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// =================================================================
// 🌟 1. BACKGROUND ANIMATO 3D (Campo di Particelle)
// =================================================================

const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i += 3) {
    // Generiamo le particelle in un volume esteso
    posArray[i] = (Math.random() - 0.5) * 50;  // X: -25 a 25
    posArray[i+1] = (Math.random() - 0.5) * 30; // Y: -15 a 15
    posArray[i+2] = (Math.random() - 0.5) * 80 - 40; // Z: Lontano dalla telecamera
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// ShaderMaterial Semplificato (o PointsMaterial per l'efficienza)
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    color: 0x00ffff, // Tonalità ciano/elettrica
    transparent: true,
    opacity: 0.6,
});

const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleMesh);


// =================================================================
// 🌟 2. ANIMAZIONE CINEMATICA DEL LOGO (THREE.Curve + Anime.js)
// =================================================================

const logoDOM = document.querySelector('.logo');
const finalLogoPosition = mapDOMTo3D(logoDOM);
logoDOM.style.opacity = 0; // Nascondiamo il testo DOM inizialmente

// 2.1 Mesh 3D del Logo (Placeholder)
const logoGeometry = new THREE.IcosahedronGeometry(0.2, 0); // Una forma moderna
const logoMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ffc4, 
    emissive: 0x00ffc4, 
    emissiveIntensity: 3, 
    wireframe: true // Effetto futuristico
});
const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
scene.add(logoMesh);


// 2.2 Definizione del Percorso (THREE.Curve)
const path = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-15, 8, -20), // Start: Lontano, alto a sinistra
    new THREE.Vector3(5, 10, -10),  // Control 1: Curva verso destra/alto
    new THREE.Vector3(-5, -5, 5),   // Control 2: Curva verso basso/centro
    finalLogoPosition               // End: Posizione finale (mappata dal DOM)
);

// Variabile 't' che traccia la posizione (0 a 1) lungo la curva
let t = { value: 0 };
logoMesh.position.copy(path.getPoint(t.value));

// 2.3 Animazione con Anime.js
anime({
    targets: t,
    value: 1, // Anima t da 0 (inizio curva) a 1 (fine curva)
    duration: 3500,
    easing: 'easeInOutQuad',
    delay: 800,
    // La funzione 'update' verrà chiamata ad ogni frame di Anime.js
    update: () => {
        // Aggiorna la posizione 3D della mesh
        logoMesh.position.copy(path.getPoint(t.value));
        
        // Rotazione durante il movimento (cinematico)
        logoMesh.rotation.x += 0.05;
        logoMesh.rotation.y += 0.05;
    },
    complete: () => {
        // Quando l'animazione 3D è completa, dissolviamo il testo DOM
        gsap.to(logoDOM.style, { opacity: 1, duration: 0.5 });
        
        // E rimuoviamo o nascondiamo la mesh 3D di animazione
        gsap.to(logoMesh.scale, { duration: 0.5, x: 0, y: 0, z: 0 });
    }
});


// =================================================================
// 🌟 3. INTERAZIONE NAV-ITEM (Manteniamo l'indicatore 3D)
// =================================================================

// ... (Codice THREE.js per indicatorRing e Materiale come prima) ...
const geometry = new THREE.TorusGeometry(0.3, 0.05, 16, 100);
const material = new THREE.MeshStandardMaterial({
    color: 0x00ffc4,
    emissive: 0x00ffc4,
    emissiveIntensity: 1.5,
    metalness: 0.8,
    roughness: 0.2
});
const indicatorRing = new THREE.Mesh(geometry, material);
indicatorRing.position.set(-10, 0, 0); 
scene.add(indicatorRing);

const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
    link.addEventListener('mouseenter', (event) => {
        const targetPos = mapDOMTo3D(event.target);

        // Uso di GSAP per un'animazione fluida dell'indicatore 3D
        gsap.to(indicatorRing.position, {
            duration: 0.5,
            x: targetPos.x,
            y: targetPos.y - 0.1, // Spostiamo leggermente sotto il testo
            z: 0,
            ease: "power2.out"
        });
        
        gsap.to(indicatorRing.scale, {
            duration: 0.3,
            x: 1.5, y: 1.5, z: 1.5,
            yoyo: true,
            repeat: 1
        });
        
        gsap.to(indicatorRing.material, { emissiveIntensity: 3, duration: 0.5 });
    });
});


// =================================================================
// 🌟 4. Loop di Animazione Principale
// =================================================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Movimento del Campo di Particelle (Effetto Scorrimento 3D)
    particleMesh.rotation.y = elapsedTime * 0.05;
    particleMesh.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
    
    // Piccolo movimento della telecamera per dare profondità (Effetto Cinematico)
    camera.position.x = Math.sin(elapsedTime * 0.1) * 0.1;

    // Rotazione continua degli oggetti della navbar (anche se non visibili, preparano la scena)
    indicatorRing.rotation.y += 0.01;

    renderer.render(scene, camera);
}
animate();
