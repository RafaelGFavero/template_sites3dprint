// Orthographic views of a z-up part, first-angle arrangement (ABNT NBR 10067).
// Each view returns [u, v, depth]: u to the right, v downwards, larger depth = closer to the viewer.
export const VISTAS = {
  frontal: (x, y, z) => [x, -z, -y],   // seen from -Y
  superior: (x, y, z) => [x, -y, z],   // seen from above, drawn below the front view
  lateral: (x, y, z) => [-y, -z, -x],  // left view (seen from -X), drawn to the right of the front view
};

export const ISO = { az: 45, el: (Math.asin(1 / Math.sqrt(3)) * 180) / Math.PI }; // isométrica exata

// Free view around the part: azimuth turns around Z starting from the front, elevation lifts the eye.
export function orbita(azGraus, elGraus) {
  const az = (azGraus * Math.PI) / 180, el = (elGraus * Math.PI) / 180;
  const d = [Math.cos(el) * Math.sin(az), -Math.cos(el) * Math.cos(az), Math.sin(el)];
  const r = [Math.cos(az), Math.sin(az), 0];
  const up = [-Math.sin(el) * Math.sin(az), Math.sin(el) * Math.cos(az), Math.cos(el)];
  return (x, y, z) => [
    x * r[0] + y * r[1] + z * r[2],
    -(x * up[0] + y * up[1] + z * up[2]),
    x * d[0] + y * d[1] + z * d[2],
  ];
}

// Part of a triangle at or below height h (Sutherland-Hodgman against one plane).
export function recortaAbaixo(tri, h) {
  const out = [];
  for (let i = 0; i < tri.length; i++) {
    const p = tri[i], q = tri[(i + 1) % tri.length];
    const pIn = p[2] <= h, qIn = q[2] <= h;
    if (pIn) out.push(p);
    if (pIn !== qIn) {
      const t = (h - p[2]) / (q[2] - p[2]);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), h]);
    }
  }
  return out;
}
