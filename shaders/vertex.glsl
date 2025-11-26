// shaders/vertex.glsl

uniform float uTime;

varying vec2 vUv;
varying float vProgress;

void main() {
    vUv = uv;
    // Calcola il progresso lungo l'asse X della geometria del tubo.
    vProgress = position.x; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
