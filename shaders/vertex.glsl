// shaders/vertex.glsl

uniform float uTime;

varying vec2 vUv;
varying float vProgress;

void main() {
    vUv = uv;
    // Calcola il progresso lungo la geometria (lunghezza della curva)
    vProgress = position.x; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
