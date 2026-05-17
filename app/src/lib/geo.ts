/**
 * Geographic coordinate conversions for Three.js globe.
 */

const DEG_TO_RAD = Math.PI / 180;

/**
 * Convert lat/lon to a 3D unit vector on a sphere of given radius.
 * Coordinate system matches Three.js globe orientation.
 *
 * x = -cos(lat) * cos(lon)   (negative: lon=0 → facing -z in standard Three.js view)
 * y =  sin(lat)
 * z =  cos(lat) * sin(lon)
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = 1.01
): [number, number, number] {
  const phi = lat * DEG_TO_RAD;
  const theta = lon * DEG_TO_RAD;
  const x = -Math.cos(phi) * Math.cos(theta) * radius;
  const y = Math.sin(phi) * radius;
  const z = Math.cos(phi) * Math.sin(theta) * radius;
  return [x, y, z];
}

/**
 * Compute the rotation quaternion to orient a cone pointing radially
 * outward from the globe center at a given lat/lon position.
 * Returns [x, y, z, w] quaternion components.
 */
export function latLonToQuaternion(lat: number, lon: number): [number, number, number, number] {
  // The normal at lat/lon is the unit vector from center to surface
  const phi = lat * DEG_TO_RAD;
  const theta = lon * DEG_TO_RAD;
  const nx = -Math.cos(phi) * Math.cos(theta);
  const ny = Math.sin(phi);
  const nz = Math.cos(phi) * Math.sin(theta);

  // Default cone axis points in +Y direction
  // We need to rotate from +Y to the normal vector
  // Using axis-angle: cross(+Y, normal) gives rotation axis, dot gives cos(angle)
  const ux = 0, uy = 1, uz = 0; // +Y
  const dot = uy * ny; // dot product of +Y and normal

  if (Math.abs(dot + 1) < 0.0001) {
    // Anti-parallel: rotate 180° around X
    return [1, 0, 0, 0];
  }

  const cx = uy * nz - uz * ny;
  const cy = uz * nx - ux * nz;
  const cz = ux * ny - uy * nx;
  const sinHalf = Math.sqrt((1 - dot) / 2);
  const cosHalf = Math.sqrt((1 + dot) / 2);
  const len = Math.sqrt(cx * cx + cy * cy + cz * cz);

  if (len < 0.0001) {
    return [0, 0, 0, 1];
  }

  return [
    (cx / len) * sinHalf,
    (cy / len) * sinHalf,
    (cz / len) * sinHalf,
    cosHalf,
  ];
}
