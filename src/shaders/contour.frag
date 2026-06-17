#version 300 es
precision highp float;
uniform vec3 u_contourColor;
out vec4 outColor;

void main() {
    outColor = vec4(u_contourColor, 1.0f);
}