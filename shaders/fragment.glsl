// Necessario per la precisione di calcolo
precision highp float;

// Uniforms 
uniform float uTime;
uniform float uScrollProgress; // Valore 0.0 (cima) a 1.0 (fondo)
uniform vec3 uColor;

// Variabile 
varying vec2 vUv; // Coordinate da 0.0 (basso, sinistra) a 1.0 (alto, destra)

void main() {
    // === 1. Definizione della Banda Verticale Fissa (Posizione Orizzontale) ===
    
    // Posizione orizzontale della banda (e.g., al centro dello schermo)
    float bandPositionX = 0.5; // 0.5 è il centro, 0.0 è sinistra, 1.0 è destra
    
    // Spessore della banda
    float bandThickness = 0.01; 
    
    // Calcola la distanza orizzontale del pixel corrente dal centro della banda.
    float distanceX = abs(vUv.x - bandPositionX);
    
    // 'bandMask' è l'intensità base (0.0 o 1.0) che definisce dove si trova la banda.
    // Usiamo smoothstep per dare un leggero fading ai bordi orizzontali della linea.
    float bandMask = smoothstep(bandThickness, 0.0, distanceX);

    // === 2. Illuminazione Progressiva Verticale (Basata sullo Scroll) ===

    // targetY è la posizione verticale raggiunta dallo scroll.
    // Invertiamo uScrollProgress: 0.0 scroll -> targetY 1.0 (cima); 1.0 scroll -> targetY 0.0 (fondo).
    float targetY = 1.0 - uScrollProgress; 

    // Calcolo dell'intensità di illuminazione progressiva (Scia)
    // L'area sopra targetY sarà illuminata. 0.4 definisce l'ampiezza del fading.
    float lightProgress = smoothstep(targetY - 0.4, targetY, vUv.y);

    // === 3. Creazione del Picco Luminoso di Transizione (Onda che scende) ===
    
    // Picco luminoso sulla linea di confine dello scroll (waveThickness stretto)
    float waveThickness = 0.01; 
    float distanceToEdgeY = abs(vUv.y - targetY);
    float waveGlow = smoothstep(waveThickness, 0.0, distanceToEdgeY);

    // === 4. Combinazione Finale ===

    // Moltiplichiamo la maschera verticale fissa (bandMask) con la progressione di illuminazione (lightProgress).
    // Questo garantisce che l'illuminazione avvenga SOLO all'interno della banda verticale.
    float combinedIntensity = bandMask * max(lightProgress, waveGlow * 1.5); 
    
    // Modulazione per la Pulsazione (Mantenuta per dinamismo)
    float pulse = (sin(uTime * 1.5) * 0.1) + 0.9; 

    // Applicazione del glow e della pulsazione
    float finalGlow = combinedIntensity * 2.0 * pulse; 

    // 5. Output
    float alpha = finalGlow * 0.9; 

    // Ottimizzazione
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale 
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
