// Necessario per la precisione di calcolo
precision highp float;

// Uniforms 
uniform float uTime;
uniform float uScrollProgress; // Valore 0.0 (cima) a 1.0 (fondo)
uniform vec3 uColor;

// Variabile 
varying vec2 vUv; // Coordinate da 0.0 (basso, sinistra) a 1.0 (alto, destra)

void main() {
    // 1. Posizione Orizzontale dell'Onda (Basata sullo Scroll)
    
    // targetX è la posizione orizzontale (da 0.0 a 1.0) che l'onda deve raggiungere.
    // Usiamo uScrollProgress direttamente: 0.0 scroll -> targetX 0.0 (sinistra); 1.0 scroll -> targetX 1.0 (destra).
    float targetX = uScrollProgress;
    
    // 2. Definizione dello Spessore dell'Onda
    // 'waveThickness' definisce quanto è spessa la banda (circa 1% della larghezza dello schermo)
    float waveThickness = 0.01; 
    
    // 3. Calcolo della Distanza dal Centro dell'Onda
    // Calcola la distanza orizzontale del pixel corrente dal centro dell'onda (targetX).
    float distance = abs(vUv.x - targetX);
    
    // 4. Creazione del Bagliore (L'Onda Singola)
    // Usiamo smoothstep per creare un bagliore che è massimo quando distance è 0.0.
    float waveGlow = smoothstep(waveThickness, 0.0, distance);

    // 5. Modulazione per la Pulsazione
    // Manteniamo una leggera pulsazione per renderla dinamica.
    float pulse = (sin(uTime * 1.5) * 0.1) + 0.9; 

    // 6. Combinazione Finale
    // L'unica intensità è data dal picco dell'onda.
    float finalGlow = waveGlow * 3.0 * pulse; // 3.0 moltiplica l'onda per renderla molto luminosa

    // 7. Output
    float alpha = finalGlow * 0.8; 

    // Ottimizzazione
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale 
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
