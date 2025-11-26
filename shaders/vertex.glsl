// Necessario per la precisione di calcolo
precision highp float;

// Variabile passata al Fragment Shader
varying vec2 vUv;

void main() {
    vUv = uv; 
    // Trasforma la posizione del vertice
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
