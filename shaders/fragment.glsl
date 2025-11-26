// Necessario per la precisione di calcolo
precision highp float;

// Uniforms 
uniform float uTime;
uniform float uScrollProgress; // Valore 0.0 (cima) a 1.0 (fondo)
uniform vec3 uColor;

// Variabile 
varying vec2 vUv; // Coordinate da 0.0 a 1.0

void main() {
    // 1. Posizione Verticale dell'Onda (Basata sullo Scroll)
    
    // Invertiamo uScrollProgress in modo che 0.0 sia la cima dello schermo (vUv.y = 1.0)
    // e 1.0 sia il fondo dello schermo (vUv.y = 0.0).
    // Nota: vUv.y va da 0 (basso) a 1 (alto) in Three.js, quindi invertiamo.
    float targetY = 1.0 - uScrollProgress;
    
    // 2. Definizione dello Spessore dell'Onda
    // 'waveThickness' definisce quanto è spessa l'onda come frazione dell'altezza dello schermo (0.01 = 1%)
    float waveThickness = 0.02; 
    
    // 3. Calcolo della Distanza dal Centro dell'Onda
    // abs(vUv.y - targetY) calcola la distanza verticale del pixel corrente dal centro dell'onda.
    float distance = abs(vUv.y - targetY);
    
    // 4. Creazione del Bagliore (Glow)
    // Usiamo smoothstep per creare un bagliore intenso al centro e che sfuma rapidamente.
    // L'onda è visibile solo se la distanza è minore di waveThickness.
    // L'intensità massima si ha quando distance è 0.0.
    float glow = smoothstep(waveThickness, 0.0, distance);

    // 5. Modulazione per la Pulsazione
    // Manteniamo una leggera pulsazione per renderla dinamica.
    float pulse = (sin(uTime * 1.5) * 0.1) + 0.9; 

    // 6. Combinazione Finale
    // Se glow è 0.0 (pixel è troppo lontano), finalGlow è 0.0.
    float finalGlow = glow * 3.0 * pulse; // 3.0 è il moltiplicatore di luminosità

    // 7. Output
    float alpha = finalGlow * 0.8; 

    // Ottimizzazione
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale (Colore uniforme * intensità calcolata, con alpha come opacità)
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
