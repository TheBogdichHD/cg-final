#version 300 es
precision highp float;

in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_color;
in vec3 v_worldPosition;

uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;
uniform vec3 u_viewWorldPosition;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform sampler2D u_texture;
uniform bool u_useTexture;

out vec4 outColor;

void main() {
    vec3 normal = normalize(v_normal) * (gl_FrontFacing ? 1.0f : -1.0f);
    vec3 lightDir = normalize(u_lightDirection);
    float diff = max(dot(normal, lightDir), 0.0f);

    float diffuseLevel;
    if(diff > 0.8f) {
        diffuseLevel = 0.85f;
    } else if(diff > 0.4f) {
        diffuseLevel = 0.6f;
    } else {
        diffuseLevel = 0.2f;
    }

    vec3 ambient = u_ambientLight * u_diffuseColor;
    vec3 diffuse = diffuseLevel * u_diffuseColor;

    vec3 viewDir = normalize(u_viewWorldPosition - v_worldPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0f), u_shininess);
    float specLevel = 0.0f;
    if(spec > 0.85f) {
        specLevel = 0.1f;
    }
    vec3 specular = specLevel * u_specularColor;

    float rim = 1.0f - max(dot(normal, viewDir), 0.0f);
    rim = smoothstep(0.7f, 1.0f, rim) * 0.1f;
    vec3 rimColor = vec3(0.8f, 0.8f, 1.0f) * rim;

    vec4 texColor = u_useTexture ? texture(u_texture, v_texcoord) : vec4(1.0f);
    vec3 baseColor = texColor.rgb * v_color.rgb;

    vec3 color = (ambient + diffuse) * baseColor + specular + rimColor;
    color = clamp(color, 0.0f, 1.0f);

    outColor = vec4(color, texColor.a * v_color.a);
    // outColor = vec4(normal * 0.5f + 0.5f, 1.0f);
}