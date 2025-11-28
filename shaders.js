/** * SHADERS.JS: Contiene il codice GLSL per gli Shader Custom
 * * 1. CarShader: Per l'auto, crea un riflesso anamorfico in movimento.
 * 2. GridShader: Per lo sfondo, crea una griglia 3D animata.
 */

// ---------------------------------------------
// 1. Shader per l'Auto: Riflessi Cinetici
// ---------------------------------------------

const carVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const carFragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    uniform vec3 uLightDirection;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vec3 normal = normalize(vNormal);
        
        // Simula la luce direzionale di base
        vec3 ambientLight = vec3(0.1);
        float diffuse = max(dot(normal, uLightDirection), 0.0);
        
        vec3 finalColor = ambientLight + uColor * diffuse;

        // Effetto Striscia di Luce (Anamorphic Flare)
        // Calcola la posizione del riflesso in base al tempo (uTime)
        vec3 viewDir = normalize(cameraPosition - vPosition);
        vec3 reflected = normalize(reflect(-uLightDirection, normal));
        float spec = pow(max(dot(viewDir, reflected), 0.0), 32.0);

        // Crea una "striscia" sottile e mobile (effetto cinetico)
        float stripePos = mod(vPosition.x * 0.5 - uTime * 0.5, 1.0);
        float stripeWidth = 0.05;
        float stripeIntensity = smoothstep(0.0, stripeWidth, stripePos) * smoothstep(stripeWidth, 0.0, stripePos);
        
        vec3 flareColor = vec3(0.0, 0.9, 1.0); // Blu Ciano

        finalColor += flareColor * stripeIntensity * 2.0;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// ---------------------------------------------
// 2. Shader per la Griglia di Sfondo
// ---------------------------------------------

const gridVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const gridFragmentShader = `
    uniform float uTime;
    uniform vec3 uGridColor;
    uniform float uScale;

    varying vec2 vUv;

    // Funzione per disegnare la griglia
    float grid(vec2 coords, float spacing) {
        vec2 c = floor(coords * spacing);
        vec2 f = fract(coords * spacing);

        // Calcola la distanza dai bordi della cella
        float dist = min(f.x, 1.0 - f.x);
        dist = min(dist, f.y);
        dist = min(dist, 1.0 - f.y);

        // Ritorna l'intensità della linea (più vicino al bordo, più scuro)
        return 1.0 - smoothstep(0.0, 0.05 / spacing, dist);
    }

    void main() {
        // Applica movimento e prospettiva UV
        vec2 uv = vUv * uScale; 
        uv.y += uTime * 0.05; // Animazione in Z (profondità)
        
        // Due livelli di griglia per profondità
        float grid1 = grid(uv, 40.0); // Griglia principale
        float grid2 = grid(uv, 8.0);  // Griglia secondaria più spessa

        float finalGrid = max(grid1 * 0.5, grid2);
        
        // Aggiunge un leggero sfumato in base alla Y per simulare l'orizzonte
        float fade = pow(1.0 - vUv.y, 2.0); 

        vec3 color = uGridColor * finalGrid * fade;
        
        gl_FragColor = vec4(color, finalGrid * fade * 0.9); // Usa alpha per trasparenza
    }
`;
