// Cubo unitário em STL binário para os testes: 12 triângulos, cada face quadrada dividida por uma diagonal.
// `altura` estica o z.
export function cubeSTL(altura = 1) {
  const v = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const faces = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  const buf = new ArrayBuffer(84 + faces.length * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, faces.length, true);
  faces.forEach((f, i) => {
    const o = 84 + i * 50;
    f.forEach((vi, k) => v[vi].forEach((c, j) => dv.setFloat32(o + 12 + k * 12 + j * 4, j === 2 ? c * altura : c, true)));
  });
  return buf;
}
