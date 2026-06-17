#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
in vec3 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

out vec3 v_normal;
out vec2 v_texcoord;
out vec4 v_color;
out vec3 v_worldPosition;

void main() {
    vec4 worldPos = u_world * vec4(a_position, 1.0f);
    gl_Position = u_projection * u_view * worldPos;
    v_worldPosition = worldPos.xyz;
    v_normal = normalize(mat3(u_world) * a_normal);
    v_texcoord = a_texcoord;
    v_color = vec4(a_color, 1.0f);
}