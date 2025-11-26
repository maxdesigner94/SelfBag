// shaders/fragment.glsl

uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uFlowColor;

varying vec2 vUv;
varying float vProgress; // Progresso lungo il tubo (0.0 a 1.0)

// Funzione per il calcolo del rumore
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

void main() {
    float normalizedProgress = vProgress; 

    // 1. Definisci la zona di flusso basata sullo scroll
    float flowWidth = 0.1; // Larghezza del fascio
    float flowPosition = uScrollProgress; 

    // Calcolo della distanza dal centro del fascio
    float distToFlow = abs(normalizedProgress - flowPosition);
    
    // 2. Calcolo dell'intensità (il nucleo illuminato)
    float flowIntensity = 1.0 - smoothstep(0.0, flowWidth, distToFlow);
    
    // Aggiungi vibrazione dinamica
    flowIntensity += sin(normalizedProgress * 50.0 + uTime * 10.0) * 0.1;

    // 3. Aggiungi il rumore (scintillio)
    float sparkle = random(vUv * 50.0 + uTime * 0.5); 
    
    // 4. Calcola l'opacità e il colore finale
    float glow = max(0.0, flowIntensity);
    glow = pow(glow, 15.0); // Potenza molto alta per focalizzare il glow e renderlo invisibile altrove

    float opacity = clamp(glow + sparkle * 0.1, 0.0, 1.0);
    
    vec3 finalColor = uFlowColor * (glow * 4.0 + sparkle * 0.5);

    // Bordo morbido (glow sul profilo del tubo)
    float edge = 1.0 - smoothstep(0.4, 0.5, abs(vUv.y - 0.5) * 2.0);
    opacity *= edge;
    finalColor *= edge;

    // Rimuovi i pixel totalmente trasparenti per garantire l'invisibilità
    if (opacity < 0.01) { 
        discard;
    }

    gl_FragColor = vec4(finalColor, opacity);
}
