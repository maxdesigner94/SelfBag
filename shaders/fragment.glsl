// Inizia con le dichiarazioni di precisione
precision highp float;

// Uniforms (ricevuti da flow.js)
uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uColor;

// Variabile (ricevuta da vertex.glsl)
varying vec2 vUv; 

void main() {
    // 1. Pattern di Flusso (linee che si muovono)
    float flowPattern = fract(vUv.y * 5.0 + uTime * 0.1);

    // 2. Punto di Attivazione (Basato sullo Scroll)
    // 1.0 - uScrollProgress fa sì che l'illuminazione inizi dall'alto (1.0) e scenda a 0.0
    float activationPoint = 1.0 - uScrollProgress; 

    // Calcola l'intensità del flusso (solo se il pixel è "sotto" il punto di attivazione, con un fading)
    // smoothstep crea una transizione morbida
    float flowIntensity = smoothstep(activationPoint - 0.2, activationPoint, vUv.y); 

    // 3. Creazione del Bagliore (Glow)
    // Crea una linea sottile e luminosa all'interno del pattern:
    float band = abs(flowPattern - 0.5) * 2.0; 
    float glow = pow(1.0 - band, 10.0); // pow(..., 10.0) crea il picco di luce

    // 4. Combinazione Finale
    float finalGlow = flowIntensity * glow * 2.0; 

    // 5. Output
    float alpha = finalGlow * 0.7; 

    // Se l'opacità è troppo bassa, il pixel non viene renderizzato (ottimizzazione)
    if (alpha < 0.001) {
        discard; 
    }

    // Colore finale (colore base * intensità del bagliore)
    gl_FragColor = vec4(uColor * finalGlow, alpha);
}
