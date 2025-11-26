// shaders/fragment.glsl

uniform float uTime;
uniform float uScrollProgress;
uniform vec3 uFlowColor;

varying vec2 vUv;
varying float vProgress; 

// Funzione per il calcolo del rumore
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))
                 * 43758.5453123);
}

void main() {
    // 1. Definisci la zona di flusso basata sullo scroll
    float flowWidth = 0.2; 
    float flowPosition = uScrollProgress * 2.0; 

    // Funzione triangolare per una zona centrale più luminosa
    float flowIntensity = 1.0 - abs(vProgress - flowPosition) / flowWidth;
    
    // Aggiungi un piccolo offset basato sul tempo per far "vibrare" il flusso
    flowIntensity += sin(vProgress * 15.0 + uTime * 5.0) * 0.1;

    // 2. Aggiungi il rumore (scintillio)
    float sparkle = random(vUv * 50.0 + uTime * 0.5) * 0.3;
    
    // 3. Calcola l'opacità e il colore finale
    float glow = max(0.0, flowIntensity);
    glow = pow(glow, 5.0); 

    // Il flusso ha un'opacità minima, visibile solo quando glow > 0
    float opacity = clamp(glow + sparkle, 0.0, 1.0);
    
    vec3 finalColor = uFlowColor * (glow * 1.5 + sparkle * 0.5);

    // Bordo morbido per l'effetto glow (se il tubo è spesso, si vuole che la luce sia al centro)
    float edge = 1.0 - smoothstep(0.4, 0.5, abs(vUv.y - 0.5) * 2.0);
    opacity *= edge;
    finalColor *= edge;

    gl_FragColor = vec4(finalColor, opacity);
}
