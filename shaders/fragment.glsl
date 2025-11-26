// Necessario per la precisione di calcolo
precision highp float;

// Uniforms (ricevuti da flow.js)
// uTime è mantenuto per un leggero effetto pulsante sul bagliore, ma non per il movimento del flusso.
uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uColor;

// Variabile (ricevuta da vertex.glsl)
varying vec2 vUv; 

void main() {
    // 1. Punto di Attivazione (Basato sullo Scroll)
    // 1.0 - uScrollProgress: l'illuminazione inizia in alto (1.0) e si estende verso il basso (0.0)
    // Il progresso dello scroll determina il 'bordo' inferiore del flusso illuminato.
    float activationPoint = 1.0 - uScrollProgress; 

    // 2. Intensità del Flusso: Crea un'area illuminata che si espande con lo scroll
    // Usiamo smoothstep per creare un fading morbido.
    // L'area tra activationPoint - 0.5 (inizio fading) e activationPoint (fine fading) è la zona di transizione.
    float flowIntensity = smoothstep(activationPoint - 0.5, activationPoint, vUv.y); 

    // 3. Modulazione per il Bagliore (Glow Statico o Pulsante)
    // Creiamo un leggero effetto pulsante sul bagliore per renderlo dinamico, ma non mobile.
    // Utilizziamo un seno sul tempo per far "respirare" l'intensità generale.
    float pulse = (sin(uTime * 1.5) * 0.1) + 0.9; // Varia da 0.8 a 1.0 (leggera pulsazione)

    // 4. Combinazione Finale
    // Applichiamo l'intensità del flusso e la pulsazione.
    float finalGlow = flowIntensity * 2.0 * pulse; // 2.0 è il moltiplicatore di luminosità

    // 5. Output
    float alpha = finalGlow * 0.8; // Opacità massima leggermente aumentata

    // Ottimizzazione: non renderizzare i pixel quasi invisibili
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale (Colore uniforme * intensità calcolata, con alpha come opacità)
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
