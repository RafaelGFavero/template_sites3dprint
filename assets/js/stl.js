// Binary STL: 80-byte header, uint32 triangle count, then 50 bytes per triangle
// (normal, three vertices, attribute). Units are whatever the file used (mm here).
export function parseSTL(buffer) {
  const dv = new DataView(buffer);
  const count = dv.getUint32(80, true);
  const positions = new Float32Array(count * 9);
  for (let i = 0; i < count; i++) {
    const o = 84 + i * 50 + 12;
    for (let k = 0; k < 9; k++) positions[i * 9 + k] = dv.getFloat32(o + k * 4, true);
  }
  return { count, positions, normals: faceNormals(positions, count) };
}

function faceNormals(p, count) {
  const n = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const o = i * 9;
    const ux = p[o + 3] - p[o], uy = p[o + 4] - p[o + 1], uz = p[o + 5] - p[o + 2];
    const vx = p[o + 6] - p[o], vy = p[o + 7] - p[o + 1], vz = p[o + 8] - p[o + 2];
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
    const len = Math.hypot(x, y, z) || 1;
    n[i * 3] = x / len; n[i * 3 + 1] = y / len; n[i * 3 + 2] = z / len;
  }
  return n;
}

export function bounds({ positions }) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], positions[i + a]);
      max[a] = Math.max(max[a], positions[i + a]);
    }
  }
  return { min, max, size: max.map((v, a) => v - min[a]) };
}

// Edges a draftsman would draw: where the two faces meet at more than `angleDeg`,
// plus open or non-manifold edges. Returns { a:[x,y,z], b:[x,y,z], faces } per edge.
export function featureEdgeList({ count, positions, normals }, angleDeg = 30) {
  const key = (i) => `${positions[i].toFixed(4)},${positions[i + 1].toFixed(4)},${positions[i + 2].toFixed(4)}`;
  const edges = new Map();
  for (let f = 0; f < count; f++) {
    for (let k = 0; k < 3; k++) {
      const a = f * 9 + k * 3, b = f * 9 + ((k + 1) % 3) * 3;
      const ka = key(a), kb = key(b);
      const id = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      const e = edges.get(id);
      if (e) e.faces.push(f); else edges.set(id, { a, b, faces: [f] });
    }
  }
  const cos = Math.cos((angleDeg * Math.PI) / 180);
  const out = [];
  for (const { a, b, faces } of edges.values()) {
    if (faces.length === 2) {
      const [f, g] = faces;
      const dot = normals[f * 3] * normals[g * 3] + normals[f * 3 + 1] * normals[g * 3 + 1] + normals[f * 3 + 2] * normals[g * 3 + 2];
      if (dot > cos) continue;
    }
    out.push({ a: [positions[a], positions[a + 1], positions[a + 2]], b: [positions[b], positions[b + 1], positions[b + 2]], faces });
  }
  return out;
}

// Where the plane (coordinate `axis` = value) cuts the mesh, as flat 2D segments
// in the two remaining coordinates, in x, y, z order.
export function sliceAxis({ count, positions }, axis, value) {
  const [ua, va] = [0, 1, 2].filter((c) => c !== axis);
  const out = [];
  for (let f = 0; f < count; f++) {
    const p = [0, 1, 2].map((k) => positions.subarray(f * 9 + k * 3, f * 9 + k * 3 + 3));
    const d = p.map((q) => q[axis] - value);
    const hits = [];
    for (let k = 0; k < 3; k++) {
      const i = k, j = (k + 1) % 3;
      if ((d[i] < 0) === (d[j] < 0)) continue;
      const t = d[i] / (d[i] - d[j]);
      hits.push(p[i][ua] + t * (p[j][ua] - p[i][ua]), p[i][va] + t * (p[j][va] - p[i][va]));
    }
    if (hits.length === 4 && Math.hypot(hits[2] - hits[0], hits[3] - hits[1]) > 1e-9) out.push(...hits);
  }
  return out;
}

// Chain unordered segments into closed loops by matching endpoints within `tol`.
export function loops(segments, tol = 1e-3) {
  const segs = [];
  for (let i = 0; i < segments.length; i += 4) segs.push([[segments[i], segments[i + 1]], [segments[i + 2], segments[i + 3]]]);
  const same = (p, q) => Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol;
  const used = new Array(segs.length).fill(false);
  const out = [];
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const loop = [segs[s][0], segs[s][1]];
    for (let grew = true; grew && !same(loop[0], loop[loop.length - 1]);) {
      grew = false;
      const tail = loop[loop.length - 1];
      for (let t = 0; t < segs.length; t++) {
        if (used[t]) continue;
        const [p, q] = segs[t];
        if (same(p, tail)) { loop.push(q); used[t] = grew = true; break; }
        if (same(q, tail)) { loop.push(p); used[t] = grew = true; break; }
      }
    }
    if (!same(loop[0], loop[loop.length - 1])) continue; // open chain: not a loop
    loop.pop();
    if (loop.length >= 3) out.push(loop);
  }
  return out;
}

export function layerCount(mesh, layer = 0.2) {
  return Math.ceil(bounds(mesh).size[2] / layer - 1e-6);
}
