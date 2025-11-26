// Inizia con le dichiarazioni di precisione
precision highp float;

// Variabile passata al Fragment Shader
varying vec2 vUv;

void main() {
    vUv = uv; // Passa le coordinate UV (0.0 a 1.0)
    // Trasforma la posizione del vertice nella posizione finale di clipping
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
