// Fresnel-style atmosphere shader. Rendered on a back-side sphere slightly larger
// than the Earth so the rim catches light at grazing angles.

export const ATMOSPHERE_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ATMOSPHERE_FRAG = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float rimStrength = 1.0 - abs(dot(vNormal, viewDir));
  rimStrength = pow(rimStrength, 2.2);
  vec3 atmosphereColor = vec3(0.28, 0.58, 1.0);
  float alpha = rimStrength * 0.85;
  gl_FragColor = vec4(atmosphereColor, alpha);
}
`;
