// shaders/vertex.glsl

uniform float uTime;

varying vec2 vUv;
varying float vProgress;

void main() {
    vUv = uv;
    // vUv.x fornisce il progresso normalizzato lungo la lunghezza della TubeGeometry.
    vProgress = uv.x; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
