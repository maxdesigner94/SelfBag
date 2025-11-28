const pixiContainer = document.getElementById('pixi-container');
const PIXI_W = window.innerWidth;
const PIXI_H = window.innerHeight;

// 1. Inizializzazione App Pixi
const app = new PIXI.Application({
    width: PIXI_W,
    height: PIXI_H,
    backgroundAlpha: 0, // Sfondo trasparente
    resolution: window.devicePixelRatio || 1,
    resizeTo: window,
});

pixiContainer.appendChild(app.view);

// 2. Creazione Sistema Particellare
const particleContainer = new PIXI.ParticleContainer(5000, {
    position: true,
    rotation: false,
    uvs: false,
    tint: true
});
app.stage.addChild(particleContainer);

// Texture per le particelle (un semplice cerchio)
const graphics = new PIXI.Graphics();
graphics.beginFill(0x00f3ff);
graphics.drawCircle(0, 0, 1.5); // Piccolo punto neon
graphics.endFill();
const particleTexture = app.renderer.generateTexture(graphics);

const particles = [];
const PARTICLE_COUNT = 500;

for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = new PIXI.Sprite(particleTexture);
    particle.anchor.set(0.5);
    // Posiziona fuori dallo schermo (inizio)
    particle.x = Math.random() * PIXI_W;
    particle.y = Math.random() * PIXI_H;
    particle.alpha = 0.5;
    
    // Proprietà di velocità (simula la profondità)
    particle.speed = 1 + Math.random() * 4; 
    particle.scale.set(0.2 + Math.random() * 0.8);
    
    particleContainer.addChild(particle);
    particles.push(particle);
}

// 3. Loop di Animazione Pixi
app.ticker.add(() => {
    // Simula il movimento del tunnel
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        
        // Muovi la particella in base alla sua velocità (profondità)
        p.y += p.speed * 2;
        p.x += Math.sin(p.y * 0.01) * 0.5; // Leggera oscillazione laterale
        
        // Reset quando esce dallo schermo
        if (p.y > PIXI_H) {
            p.y = 0;
            p.x = Math.random() * PIXI_W;
        }
    }
});
