// Necessario per la precisione di calcolo
precision highp float;

// Uniforms 
uniform float uTime;
uniform float uScrollProgress; // Valore 0.0 (cima) a 1.0 (fondo)
uniform vec3 uColor;

// Variabile 
varying vec2 vUv; // Coordinate da 0.0 (basso) a 1.0 (alto)

void main() {
    // 1. Posizione del Bordo Illuminato (Scia)
    // targetY è la posizione verticale (da 0.0 a 1.0) che l'illuminazione deve raggiungere.
    // Invertiamo uScrollProgress: 0.0 scroll -> targetY 1.0 (cima); 1.0 scroll -> targetY 0.0 (fondo).
    float targetY = 1.0 - uScrollProgress; 

    // 2. Calcolo della Scia (L'Area Già Percorsa)
    // Questa funzione crea una transizione morbida tra l'area illuminata (sopra targetY) e l'area spenta (sotto).
    // È essenzialmente il flusso progressivo che avevi prima.
    // '0.4' definisce quanto è ampio il fading del bordo della scia.
    float trailIntensity = smoothstep(targetY - 0.4, targetY, vUv.y);

    // 3. Creazione del Picco Luminoso (L'Onda che si Muove)
    // Vogliamo un picco luminoso che esista solo in una stretta banda attorno a targetY.
    // 'waveThickness' definisce la larghezza del picco.
    float waveThickness = 0.01; 
    
    // Calcola la distanza verticale del pixel corrente dal bordo target.
    float distanceToEdge = abs(vUv.y - targetY);
    
    // Crea un bagliore intenso (picco) solo in una banda stretta
    float waveGlow = smoothstep(waveThickness, 0.0, distanceToEdge);

    // 4. Modulazione per la Pulsazione
    float pulse = (sin(uTime * 1.5) * 0.1) + 0.9; 

    // 5. Combinazione Finale
    // Sommiamo la Scia Base (che arriva fino al bordo) al Picco Luminoso (che è il bordo stesso).
    // Usiamo il valore massimo per non superare 1.0 di intensità.
    float combinedIntensity = max(trailIntensity, waveGlow * 1.5); // 1.5 moltiplica l'onda per farla spiccare

    // Applichiamo la pulsazione a tutto l'effetto
    float finalGlow = combinedIntensity * 2.0 * pulse; 

    // 6. Output
    float alpha = finalGlow * 0.9; 

    // Ottimizzazione
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale 
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
