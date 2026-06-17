#version 300 es
in vec3 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;
uniform float u_contourWidth;

void main() {
  vec4 worldPos = u_world * vec4(a_position + a_normal * u_contourWidth, 1.0f);
  gl_Position = u_projection * u_view * worldPos;
}