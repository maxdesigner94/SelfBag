// Necessario per la precisione di calcolo
precision highp float;

// Uniforms (ricevuti da flow.js)
uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uColor;

// Variabile (ricevuta da vertex.glsl)
varying vec2 vUv; 

void main() {
    // 1. Pattern di Flusso (linee che si muovono verticalmente)
    // uTime * 0.5 per la velocità del movimento, vUv.y * 10.0 per la frequenza delle linee
    float flowPattern = fract(vUv.y * 10.0 + uTime * 0.5);

    // 2. Punto di Attivazione (Basato sullo Scroll)
    // 1.0 - uScrollProgress: l'illuminazione inizia in alto (1.0) e si estende verso il basso (0.0)
    float activationPoint = 1.0 - uScrollProgress; 

    // Intensità del Flusso: Crea un'area illuminata che si espande con lo scroll
    // smoothstep(bordo_inizio, bordo_fine, valore_attuale)
    float flowIntensity = smoothstep(activationPoint - 0.3, activationPoint, vUv.y); 

    // 3. Creazione del Bagliore/Linea Sottile
    float band = abs(flowPattern - 0.5) * 2.0; 
    float glow = pow(1.0 - band, 15.0); // 15.0 crea un bagliore molto stretto e intenso

    // 4. Combinazione Finale
    // Moltiplica l'intensità di scroll (flowIntensity) per il bagliore pulsante (glow)
    float finalGlow = flowIntensity * glow * 3.0; // 3.0 è il moltiplicatore di luminosità

    // 5. Output
    float alpha = finalGlow * 0.7; 

    // Ottimizzazione: non renderizzare i pixel quasi invisibili
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale (Colore uniforme * intensità calcolata, con alpha come opacità)
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
