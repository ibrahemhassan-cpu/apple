/* The plant itself, in 3D. Each fruit's spec describes its real plant (spec.flora) and this grows it:
   a tree by space colonisation inside its crown shape, with bark and leaves drawn after the real species,
   or a potato plant with compound leaves and star flowers.

   World units are the SVG scene's (x right, y down, 800 × 1800). three.js gets the same x and a flipped y,
   so an orthographic camera lines the plant up exactly with the SVG ladder, kid and fruit on top of it. */
import {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, InstancedMesh, BufferGeometry, PlaneGeometry, ConeGeometry,
  BufferAttribute, InstancedBufferAttribute, MeshStandardMaterial, MeshDepthMaterial, HemisphereLight, DirectionalLight,
  CanvasTexture, Vector2, Vector3, Matrix4, Color, CatmullRomCurve3, DoubleSide, RepeatWrapping, SRGBColorSpace,
  RGBADepthPacking, PCFShadowMap, ACESFilmicToneMapping, ShaderChunk,
} from 'three';

const UP = new Vector3(0, 1, 0);
const FRONT = new Vector3(0, 0, 1);

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const perpendicular = v => new Vector3().crossVectors(v, Math.abs(v.y) < .9 ? UP : FRONT).normalize();
const smooth = t => t * t * (3 - 2 * t);

/* =====================================================================
   textures, painted once on a canvas
   ===================================================================== */

/* leaf silhouettes: half-width along the blade, t = 0 at the base, 1 at the tip */
const LEAF = {
  // apple: oval with a drawn-out tip and a finely toothed edge; paler, greyer underside
  apple: {
    hw: t => {
      let w = Math.pow(Math.sin(Math.PI * Math.pow(t, .72)), .8);
      if (t > .06 && t < .97) { const s = (t * 32) % 1; w *= 1 - .075 * s * s; }
      return w * .94;
    },
    petiole: .09, petW: 3.5,
    base: '#4C8A3A', edge: '#3B7230', mid: '#67A64C',
    vein: 'rgba(212,236,168,.8)', midW: 5, pairs: 8, v0: .05, v1: .82, rise: .17, latW: 2, latA: .5,
  },
  // mango: long, narrow, leathery, wavy-edged, with a pale yellow midrib and many fine side veins
  mango: {
    hw: t => Math.pow(Math.sin(Math.PI * Math.pow(t, .93)), .85) * (1 + .02 * Math.sin(t * 11)) * .9,
    petiole: .1, petW: 4.5,
    base: '#23592F', edge: '#1A4726', mid: '#2F6C3C',
    vein: 'rgba(232,220,150,.95)', midW: 8, pairs: 22, v0: .04, v1: .9, rise: .075, latW: 1.4, latA: .38,
  },
  // potato leaflet: broad oval, smooth edge, the surface puckered between the veins
  potato: {
    hw: t => Math.pow(Math.sin(Math.PI * Math.pow(t, .6)), .7) * .95,
    petiole: .05, petW: 3,
    base: '#4E8B3D', edge: '#3F7632', mid: '#66A34D',
    vein: 'rgba(168,206,136,.6)', midW: 5, pairs: 6, v0: .08, v1: .78, rise: .2, latW: 2.4, latA: .45, rugose: true,
  },
};

export function leafTexture(kind, seed) {
  const S = LEAF[kind], r = rng(seed);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const cx = 128, bot = 506, L = 498, half = 122;
  const yAt = t => bot - (S.petiole + t * (1 - S.petiole)) * L;
  const N = 220, outline = new Path2D();
  outline.moveTo(cx - S.petW, bot);
  for (let i = 0; i <= N; i++) { const t = i / N; outline.lineTo(cx - Math.max(S.petW * (1 - t), S.hw(t) * half), yAt(t)); }
  for (let i = N; i >= 0; i--) { const t = i / N; outline.lineTo(cx + Math.max(S.petW * (1 - t), S.hw(t) * half * .97), yAt(t)); }
  outline.lineTo(cx + S.petW, bot);
  outline.closePath();

  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, S.edge); grad.addColorStop(.3, S.base); grad.addColorStop(.5, S.mid);
  grad.addColorStop(.7, S.base); grad.addColorStop(1, S.edge);
  g.fillStyle = grad;
  g.fill(outline);
  g.save();
  g.clip(outline);
  // mottling, so no two patches of the blade are the same flat colour
  for (let i = 0; i < 420; i++) {
    g.fillStyle = r() > .5 ? `rgba(255,255,210,${.03 + r() * .05})` : `rgba(10,30,5,${.04 + r() * .07})`;
    g.beginPath();
    g.ellipse(r() * 256, r() * 512, 3 + r() * 16, 3 + r() * 10, r() * 3, 0, 6.29);
    g.fill();
  }
  // a darker band just inside the margin
  g.lineWidth = 16; g.strokeStyle = 'rgba(0,20,0,.12)'; g.stroke(outline);

  // side veins, curving toward the tip
  g.lineCap = 'round';
  for (let k = 0; k < S.pairs; k++) {
    const t0 = S.v0 + (S.v1 - S.v0) * k / Math.max(1, S.pairs - 1), t1 = Math.min(.99, t0 + S.rise);
    for (const side of [-1, 1]) {
      g.strokeStyle = S.vein; g.globalAlpha = S.latA; g.lineWidth = S.latW;
      g.beginPath();
      g.moveTo(cx, yAt(t0));
      g.quadraticCurveTo(cx + side * S.hw(t0) * half * .55, yAt(t0 + S.rise * .3), cx + side * S.hw(t1) * half * .9, yAt(t1));
      g.stroke();
      if (S.rugose) {                          // the net of small veins that puckers a potato leaf
        g.lineWidth = 1.2; g.globalAlpha = .28; g.strokeStyle = 'rgba(20,50,10,1)';
        for (let j = 0; j < 4; j++) {
          const u = .2 + j * .2, x = cx + side * S.hw(t0) * half * u, y = yAt(t0 + S.rise * u * .6);
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + side * 6 * r(), y - 22 - r() * 16); g.stroke();
        }
      }
    }
  }
  g.globalAlpha = 1;
  // midrib, thick at the base and fading out at the tip
  g.fillStyle = S.vein;
  g.beginPath();
  g.moveTo(cx - S.midW / 2, bot);
  g.lineTo(cx - .6, yAt(1));
  g.lineTo(cx + .6, yAt(1));
  g.lineTo(cx + S.midW / 2, bot);
  g.fill();
  g.restore();
  g.lineWidth = 2; g.strokeStyle = 'rgba(15,40,10,.45)'; g.stroke(outline);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* bark: long vertical fissures between plates, with lichen on the apple. Everything is drawn wrapped
   around both edges so the texture tiles up and around the trunk without a seam. */
function barkTexture(B, seed) {
  const r = rng(seed);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const tiled = draw => { for (const dx of [-256, 0, 256]) for (const dy of [-512, 0, 512]) draw(dx, dy); };
  g.fillStyle = B.base; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 160; i++) {
    const fill = r() > .5 ? B.light : B.dark, alpha = .12 + r() * .22;
    const x = r() * 256, y = r() * 512, w = 10 + r() * 34, h = 26 + r() * B.plate, rot = (r() - .5) * .2;
    g.fillStyle = fill; g.globalAlpha = alpha;
    tiled((dx, dy) => { g.beginPath(); g.ellipse(x + dx, y + dy, w / 2, h / 2, rot, 0, 6.29); g.fill(); });
  }
  g.strokeStyle = B.crack; g.lineCap = 'round';
  for (let i = 0; i < B.cracks; i++) {
    const pts = [];
    let x = r() * 256, y = r() * 512;
    const end = y + 80 + r() * 380;
    pts.push([x, y]);
    while (y < end) { y += 10 + r() * 14; x += (r() - .5) * 7; pts.push([x, y]); }
    g.globalAlpha = .45 + r() * .45; g.lineWidth = 1.2 + r() * B.crackW;
    tiled((dx, dy) => {
      g.beginPath();
      pts.forEach(([px, py], k) => (k ? g.lineTo(px + dx, py + dy) : g.moveTo(px + dx, py + dy)));
      g.stroke();
    });
  }
  if (B.lichen) {
    for (let i = 0; i < 40; i++) {
      const x = r() * 256, y = r() * 512, w = 4 + r() * 14, h = 3 + r() * 9, rot = r() * 3;
      g.fillStyle = r() > .5 ? '#9A9C84' : '#7F8A6A'; g.globalAlpha = .12 + r() * .16;
      tiled((dx, dy) => { g.beginPath(); g.ellipse(x + dx, y + dy, w, h, rot, 0, 6.29); g.fill(); });
    }
  }
  g.globalAlpha = 1;
  const img = g.getImageData(0, 0, 256, 512), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * B.grain; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/* a five-lobed potato flower seen face-on, with its yellow cone in the middle */
function flowerTexture(petal) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const path = new Path2D();
  for (let i = 0; i <= 200; i++) {
    const a = i / 200 * Math.PI * 2 - Math.PI / 2;
    const lobe = Math.pow(Math.abs(Math.cos(a * 2.5)), 1.6);
    const rr = 60 * (.58 + .42 * lobe);
    i ? path.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr) : path.moveTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr);
  }
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, '#FFF6C4'); grad.addColorStop(.25, petal); grad.addColorStop(1, '#FFFFFF');
  g.fillStyle = grad; g.fill(path);
  g.save(); g.clip(path);
  g.strokeStyle = 'rgba(190,200,120,.55)'; g.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 - Math.PI / 2;
    g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58); g.stroke();
  }
  g.restore();
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(120,100,150,.35)'; g.stroke(path);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/* =====================================================================
   geometry
   ===================================================================== */

/* one blade: long along +y (0 base → 1 tip), folded along the midrib and arched back */
function leafGeometry(curl, fold) {
  const xs = [-.5, -.25, 0, .25, .5], rows = 9;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const y = j / rows;
    for (const x of xs) {
      pos.push(x, y, fold * Math.abs(x) * 2 * Math.sin(Math.PI * Math.min(1, y * 1.1)) - curl * y * y);
      uv.push(x + .5, y);
    }
  }
  const cols = xs.length;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* many tubes in one geometry. Each vertex remembers its spine point and how far along the plant it is,
   so the shader can grow the wood from the root out to the twigs. */
class TubeBatch {
  constructor() { this.pos = []; this.nrm = []; this.uv = []; this.spine = []; this.order = []; this.idx = []; this.count = 0; }

  /* pts: [{ p: Vector3, r, o }] */
  add(pts, { radial = 8, smoothK = 2, uScale = 1 } = {}) {
    if (pts.length < 2) return;
    let samples = pts;
    if (pts.length > 2 && smoothK > 1) {
      const curve = new CatmullRomCurve3(pts.map(q => q.p), false, 'centripetal');
      const M = (pts.length - 1) * smoothK;
      samples = [];
      for (let i = 0; i <= M; i++) {
        const t = i / M, f = t * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(f)), u = f - k;
        samples.push({ p: curve.getPoint(t), r: pts[k].r + (pts[k + 1].r - pts[k].r) * u, o: pts[k].o + (pts[k + 1].o - pts[k].o) * u });
      }
    }
    // parallel-transport frames, so the tube doesn't twist
    const n = samples.length, tangents = [];
    for (let i = 0; i < n; i++) {
      const a = samples[Math.max(0, i - 1)].p, b = samples[Math.min(n - 1, i + 1)].p;
      tangents.push(new Vector3().subVectors(b, a).normalize());
    }
    let normal = perpendicular(tangents[0]);
    const base = this.count;
    let along = 0;
    for (let i = 0; i < n; i++) {
      if (i) {
        along += samples[i].p.distanceTo(samples[i - 1].p);
        const axis = new Vector3().crossVectors(tangents[i - 1], tangents[i]);
        const s = axis.length();
        if (s > 1e-5) normal.applyAxisAngle(axis.divideScalar(s), Math.asin(Math.min(1, s)));
      }
      const tg = tangents[i], bin = new Vector3().crossVectors(tg, normal);
      const { p, r, o } = samples[i];
      for (let j = 0; j <= radial; j++) {
        const a = j / radial * Math.PI * 2;
        const dx = normal.x * Math.cos(a) + bin.x * Math.sin(a);
        const dy = normal.y * Math.cos(a) + bin.y * Math.sin(a);
        const dz = normal.z * Math.cos(a) + bin.z * Math.sin(a);
        this.pos.push(p.x + dx * r, p.y + dy * r, p.z + dz * r);
        this.nrm.push(dx, dy, dz);
        this.uv.push(j / radial * uScale, along / 150);
        this.spine.push(p.x, p.y, p.z);
        this.order.push(o);
      }
    }
    const ring = radial + 1;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = base + i * ring + j, b = a + 1, c = a + ring, d = c + 1;
        this.idx.push(a, b, c, b, d, c);
      }
    }
    this.count += n * ring;
  }

  geometry() {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(this.pos), 3));
    geo.setAttribute('normal', new BufferAttribute(new Float32Array(this.nrm), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array(this.uv), 2));
    geo.setAttribute('aSpine', new BufferAttribute(new Float32Array(this.spine), 3));
    geo.setAttribute('aOrder', new BufferAttribute(new Float32Array(this.order), 1));
    geo.setIndex(new BufferAttribute(this.count > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx), 1));
    geo.computeBoundingSphere();
    return geo;
  }
}

/* =====================================================================
   shaders: growth, wind and a shake, patched into three's standard materials
   ===================================================================== */

const WOOD_HEAD = 'uniform float uGrow; uniform float uThick; attribute vec3 aSpine; attribute float aOrder;\n';
const WOOD_BEGIN = `
  float gk = clamp((uGrow - aOrder) / .06, 0., 1.);
  vec3 transformed = aSpine + (position - aSpine) * gk * uThick;
`;

const LEAF_HEAD = `
  uniform float uTime; uniform float uLeaves; uniform float uWind; uniform vec3 uShake; uniform vec2 uShakeK;
  attribute float aStart; attribute float aPhase; attribute float aYoung;
  varying float vYoung;
`;
const LEAF_BEGIN = `
  vec3 transformed = vec3(position);
  float gLeaf = smoothstep(aStart, aStart + .16, uLeaves);
  transformed.z += sin(uTime * (1.8 + aPhase) + aPhase * 7.) * uWind * .09 * position.y;
  transformed.x += cos(uTime * 1.4 + aPhase * 5.) * uWind * .05 * position.y;
  transformed *= gLeaf;
  vYoung = aYoung;
`;
const LEAF_MOVE = `
  vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][1]);
  float sAge = max(0., uTime - uShake.z);
  float sK = uShakeK.x * exp(-sAge * 3.2) * (1. - smoothstep(uShakeK.y * .35, uShakeK.y, distance(ip, uShake.xy)));
  mvPosition.x += sin(uTime * 31. + aPhase * 9.) * sK * 7.;
  mvPosition.y += cos(uTime * 27. + aPhase * 5.) * sK * 5.;
  mvPosition = modelViewMatrix * mvPosition;`;

function patch(material, key, uniforms, { head, begin, move, frag }) {
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${head}`)
      .replace('#include <begin_vertex>', begin);
    if (move) {
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>',
        ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', move));
    }
    if (frag) {
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${frag.head}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${frag.map}`);
    }
  };
  return material;
}

/* =====================================================================
   trees
   ===================================================================== */

/* space colonisation: scatter points through the crown's shape, and let branches grow toward them */
function growSkeleton(F, anchors, r) {
  const nodes = [];
  const grid = new Map(), cell = F.influence;
  const cellKey = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const add = (p, parent) => {
    const n = { p, parent, kids: [], r: 0, len: 0, i: nodes.length };
    if (parent) parent.kids.push(n);
    nodes.push(n);
    const k = cellKey(p.x, p.y, p.z);
    (grid.get(k) || grid.set(k, []).get(k)).push(n);
    return n;
  };

  // the trunk, with the lean and bend the species has
  const [bx, by] = F.base, y0 = -by, y1 = -F.trunkTop;
  let top = add(new Vector3(bx, y0, 0), null);
  const steps = Math.ceil((y1 - y0) / F.seg);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    top = add(new Vector3(bx + Math.sin(k * Math.PI * F.trunkBend[1]) * F.trunkBend[0], y0 + (y1 - y0) * k, Math.sin(k * 2.3) * 6), top);
  }

  // attraction points: the crown's shape, plus a few where each fruit hangs
  const C = F.crown, pts = [];
  let guard = 0;
  while (pts.length < C.points && guard++ < 200000) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1, d = Math.sqrt(x * x + y * y + z * z);
    if (d > 1) continue;
    if (C.shell && d < C.shell && r() > C.core) continue;            // an open centre
    const p = new Vector3(C.cx + x * C.rx, -C.cy - y * C.ry, z * C.rz);
    if (-p.y > C.bottom) continue;                                    // flat underside
    pts.push(p);
  }
  anchors.forEach(a => {
    for (let i = 0; i < 4; i++) pts.push(new Vector3(a.x + (r() - .5) * 50, a.y + (r() - .2) * 40, a.z * (.4 + r() * .4)));
  });

  let live = pts;
  for (let iter = 0; iter < 400 && live.length; iter++) {
    const pull = new Map(), next = [];
    for (const p of live) {
      let best = null, bd = F.influence;
      const ix = Math.floor(p.x / cell), iy = Math.floor(p.y / cell), iz = Math.floor(p.z / cell);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        const list = grid.get(`${ix + a},${iy + b},${iz + c}`);
        if (!list) continue;
        for (const n of list) { const d = n.p.distanceTo(p); if (d < bd) { bd = d; best = n; } }
      }
      if (best && bd < F.kill) continue;                              // reached: this point is used up
      next.push(p);
      if (!best) continue;
      const v = pull.get(best) || pull.set(best, new Vector3()).get(best);
      v.add(new Vector3().subVectors(p, best.p).normalize());
    }
    live = next;
    if (!pull.size) {
      if (iter < 12) { top = add(top.p.clone().add(new Vector3(0, F.seg, 0)), top); continue; }
      break;
    }
    let grew = 0;
    for (const [n, v] of pull) {
      if (v.lengthSq() < 1e-4) v.copy(UP);
      const dir = v.normalize().add(F.tropism);
      if (n.parent) dir.addScaledVector(new Vector3().subVectors(n.p, n.parent.p).normalize(), F.persist || 0);   // limbs keep their line
      dir.normalize();
      const p = n.p.clone().addScaledVector(dir, F.seg);
      if (n.kids.some(k => k.p.distanceToSquared(p) < 4)) continue;
      add(p, n); grew++;
    }
    if (!grew) break;
  }

  // pipe model: a branch is as thick as all the twigs it carries — with the exponent chosen so that
  // twigs stay twig-thin and the trunk comes out as thick as the species' trunk
  let tips = 0;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    n.tip = n.kids.length ? Math.min(...n.kids.map(k => k.tip)) + 1 : 0;     // steps to the nearest shoot tip
    if (!n.kids.length) tips++;
  }
  const pipe = Math.min(3.2, Math.max(1.6, Math.log(tips) / Math.log(F.trunkR / F.twig)));
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    n.r = n.kids.length ? Math.pow(n.kids.reduce((s, k) => s + Math.pow(k.r, pipe), 0), 1 / pipe) : F.twig;
  }
  let maxLen = 0;
  for (const n of nodes) {
    if (n.parent) n.len = n.parent.len + n.p.distanceTo(n.parent.p);
    maxLen = Math.max(maxLen, n.len);
    const h = n.p.y - y0;
    if (h < F.flareH) n.r *= 1 + F.flare * Math.pow(1 - h / F.flareH, 2);   // a flared foot
  }
  for (const n of nodes) n.o = n.len / maxLen;
  return nodes;
}

/* follow the thickest child so every limb is one continuous tube */
function chains(root) {
  const out = [], stack = [[root, null]];
  while (stack.length) {
    let [n, from] = stack.pop();
    const chain = [];
    if (from) chain.push({ p: from.p, r: n.r, o: from.o });
    chain.push({ p: n.p, r: n.r, o: n.o });
    while (n.kids.length) {
      const kids = n.kids.slice().sort((a, b) => b.r - a.r);
      for (let i = 1; i < kids.length; i++) stack.push([kids[i], n]);
      n = kids[0];
      chain.push({ p: n.p, r: n.r, o: n.o });
    }
    out.push(chain);
  }
  return out;
}

/* where every leaf goes, and which way it faces */
function placeLeaves(F, nodes, r) {
  const C = F.crown, LF = F.leaf, out = [];
  const shellOf = p => Math.sqrt(((p.x - C.cx) / C.rx) ** 2 + ((-p.y - C.cy) / C.ry) ** 2 + (p.z / C.rz) ** 2);
  const outward = p => new Vector3(p.x - C.cx, p.y + C.cy, p.z).normalize();
  const push = (p, dir, faceHint, size, start, young) => {
    const s = LF.size * (1 - LF.sizeVar / 2 + r() * LF.sizeVar) * size;
    const sh = Math.min(1.1, shellOf(p)), low = Math.min(1, Math.max(0, (-p.y - C.cy + C.ry) / (C.ry * 2)));
    const ao = (.5 + .5 * smooth(Math.min(1, sh))) * (1 - .25 * low);
    const hue = .9 + r() * .2;
    out.push({
      p, dir, face: faceHint, len: s, width: s * LF.aspect, start: Math.min(.84, start),
      color: [ao * hue * (young ? 1 : .96 + r() * .08), ao * (.94 + r() * .1), ao * (.85 + r() * .15)], young: young ? 1 : 0,
    });
  };

  if (F.arrangement === 'whorl') {
    // mango: leaves bunched in rosettes at the ends of the shoots; the new flush hangs limp and copper-red
    for (const n of nodes) {
      if (!n.parent || n.kids.length) continue;
      const young = r() < LF.youngShare;
      const axis = new Vector3().subVectors(n.p, n.parent.p).normalize().addScaledVector(UP, .35).normalize();
      const count = LF.whorl[0] + Math.floor(r() * (LF.whorl[1] - LF.whorl[0] + 1));
      const side = perpendicular(axis);
      for (let i = 0; i < count; i++) {
        const az = i / count * Math.PI * 2 + r() * .5;
        const tilt = (young ? .35 : .6) + r() * .6;
        const radial = side.clone().applyAxisAngle(axis, az);
        const dir = axis.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(radial, Math.sin(tilt));
        dir.y -= (young ? 1.3 : .25) + r() * .35;
        dir.normalize();
        push(n.p.clone().addScaledVector(dir, 2), dir, radial.clone().multiplyScalar(-.3).add(UP).addScaledVector(FRONT, .5), young ? .8 : 1, n.o * .8 + r() * .06, young);
      }
      // last season's leaves a little further back along the shoot
      const back = n.parent;
      if (back && r() < .7) {
        for (let i = 0; i < 5; i++) {
          const radial = side.clone().applyAxisAngle(axis, r() * Math.PI * 2);
          const dir = axis.clone().multiplyScalar(.25).addScaledVector(radial, .9);
          dir.y -= .4 + r() * .3;
          dir.normalize();
          push(back.p.clone(), dir, outward(back.p).add(UP).addScaledVector(FRONT, .5), .9, back.o * .8 + .04, false);
        }
      }
    }
  } else {
    // apple: leaves one by one in a spiral along the young shoots, and small rosettes on the fruiting spurs
    let phyllo = 0;
    for (const n of nodes) {
      if (!n.parent) continue;
      const b = new Vector3().subVectors(n.p, n.parent.p).normalize();
      if (n.tip <= LF.shoot) {
        const side = perpendicular(b);
        for (let i = 0; i < LF.perNode; i++) {
          phyllo += 2.4;
          const radial = side.clone().applyAxisAngle(b, phyllo);
          const dir = b.clone().multiplyScalar(.45).addScaledVector(radial, .9).addScaledVector(UP, .15)
            .add(new Vector3(r() - .5, r() - .5, r() - .5).multiplyScalar(.5));
          dir.y -= r() * .35;
          dir.normalize();
          const p = n.parent.p.clone().lerp(n.p, (i + r()) / LF.perNode);
          push(p, dir, outward(p).add(UP).addScaledVector(FRONT, .6), 1, n.o * .8 + r() * .05, false);
        }
      } else if (n.tip <= LF.spur && r() < LF.spurShare) {
        const count = 5 + Math.floor(r() * 4);
        for (let i = 0; i < count; i++) {
          const dir = outward(n.p).add(new Vector3(r() - .5, r() - .3, r() - .5).multiplyScalar(1.6)).normalize();
          push(n.p.clone(), dir, outward(n.p).add(UP).addScaledVector(FRONT, .6), .85, n.o * .8 + r() * .05, false);
        }
      }
    }
  }
  return out;
}

/* =====================================================================
   potato plant
   ===================================================================== */
function buildPotatoPlant(P, r) {
  const wood = new TubeBatch(), leaves = [], flowers = [];
  const stems = P.stems;
  stems.forEach((S, si) => {
    const lean = S.lean * Math.PI / 180, yaw = S.yaw * Math.PI / 180, L = S.len;
    const side = new Vector3(Math.sin(lean) * Math.cos(yaw), 0, Math.sin(lean) * Math.sin(yaw) + Math.sin(yaw) * .3);
    const p0 = new Vector3((r() - .5) * 10, 0, (r() - .5) * 10);
    const c1 = p0.clone().addScaledVector(UP, L * .62).addScaledVector(side, L * .2);
    const p2 = p0.clone().addScaledVector(UP, L * .72).addScaledVector(side, L * .95);
    const at = t => p0.clone().multiplyScalar((1 - t) ** 2).addScaledVector(c1, 2 * (1 - t) * t).addScaledVector(p2, t * t);
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push({ p: at(t), r: 4.6 - 2.4 * t, o: t * .8 }); }
    wood.add(pts, { radial: 7, smoothK: 1 });

    // compound leaves: a stalk carrying pairs of leaflets, tiny ones between them, and one at the tip
    [.2, .36, .5, .63, .76, .9].forEach((t, k) => {
      const s = at(t), tg = at(Math.min(1, t + .02)).sub(at(Math.max(0, t - .02))).normalize();
      const radial = perpendicular(tg).applyAxisAngle(tg, k * 2.4 + si * 1.3);
      const dir = radial.multiplyScalar(.9).addScaledVector(tg, .35).addScaledVector(UP, .2).normalize();
      const LL = (100 - t * 38) * P.leafScale;
      const down = new Vector3(0, -1, 0);
      const rach = u => s.clone().addScaledVector(dir, LL * u).addScaledVector(down, LL * .18 * u * u);
      const rp = [];
      for (let i = 0; i <= 5; i++) { const u = i / 5; rp.push({ p: rach(u), r: 1.7 - u * .8, o: t * .8 + u * .12 }); }
      wood.add(rp, { radial: 4, smoothK: 1 });
      const along = rach(1).sub(rach(.9)).normalize();
      // leaflets turn their faces up to the light and out toward us, never edge-on
      const face = UP.clone().multiplyScalar(.7).addScaledVector(FRONT, 1).addScaledVector(along, -along.dot(UP) * .7).normalize();
      const across = new Vector3().crossVectors(face, along).normalize();
      const leaflet = (u, len, sideK) => {
        const d = along.clone().multiplyScalar(sideK ? .35 : 1).addScaledVector(across, sideK * .95).normalize();
        d.y -= r() * .15;
        leaves.push({
          p: rach(u), dir: d.normalize(), face: face.clone().add(new Vector3(r() - .5, 0, r() - .5).multiplyScalar(.3)),
          len: len * P.leafScale * (.9 + r() * .2), width: len * P.leafScale * .66, start: Math.min(.84, t * .6 + u * .18),
          color: [.86 + r() * .14 - t * .05, .9 + r() * .12, .85 + r() * .12], young: 0,
        });
      };
      leaflet(1, 34, 0);
      [.3, .55, .8].forEach(u => { leaflet(u, 24 + u * 8, 1); leaflet(u, 24 + u * 8, -1); });
      [.43, .68].forEach(u => { leaflet(u, 10, 1); leaflet(u, 10, -1); });
    });

    // a cluster of flowers on a long stalk above the tallest stems
    if (S.flowers) {
      const tip = at(1), up = at(1).sub(at(.95)).normalize().addScaledVector(UP, 1.2).normalize();
      const head = tip.clone().addScaledVector(up, 38);
      wood.add([{ p: tip, r: 1.8, o: .82 }, { p: tip.clone().lerp(head, .5).add(new Vector3(4, 0, 0)), r: 1.5, o: .85 }, { p: head, r: 1.3, o: .88 }], { radial: 4, smoothK: 2 });
      for (let i = 0; i < S.flowers; i++) {
        const a = i / S.flowers * Math.PI * 2 + r();
        const d = new Vector3(Math.cos(a), .9 + r() * .4, Math.sin(a) * .8).normalize();
        const end = head.clone().addScaledVector(d, 13 + r() * 4);
        wood.add([{ p: head, r: 1, o: .88 }, { p: end, r: .8, o: .9 }], { radial: 3, smoothK: 1 });
        flowers.push({ p: end, face: d.clone().addScaledVector(FRONT, 1.1).normalize(), size: 22 + r() * 5 });
      }
    }
  });
  return { wood, leaves, flowers };
}

/* =====================================================================
   the renderer
   ===================================================================== */
export function createFlora({ canvas, spec, reduceMotion }) {
  const F = { ...spec.flora, tropism: new Vector3(...(spec.flora.tropism || [0, 0, 0])) };
  const noop = () => {};
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('WebGL is not available — the plant will not be drawn', e);
    return { growth: {}, pose: {}, show: noop, sync: noop, render: noop, resize: noop, shake: noop, detach: noop, hit: () => false, destroy: noop };
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const r = rng(F.seed || 7);
  const scene = new Scene();
  const camera = new OrthographicCamera(0, 800, 0, -1800, 1, 4000);
  camera.position.set(0, 0, 2000);

  const disposables = [];
  const keep = x => (disposables.push(x), x);

  // daylight: a warm sun from the upper right where the sun sits, blue sky above, grass bouncing below
  scene.add(new HemisphereLight(0xD6ECFF, 0x5E6F3A, 1.5));
  const sun = new DirectionalLight(0xFFF0D8, 2.6);
  const [lx, ly, lr] = F.light;              // what the sun looks at, and how wide its shadow must reach
  sun.target.position.set(lx, -ly, 0);
  sun.position.set(lx + 900, -ly + 1000, 1100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -lr, right: lr, top: lr, bottom: -lr, near: 200, far: 4000 });
  sun.shadow.bias = -.001;
  sun.shadow.normalBias = 2.5;
  scene.add(sun, sun.target);

  const U = {
    uTime: { value: 0 }, uGrow: { value: 0 }, uThick: { value: .3 }, uLeaves: { value: 0 },
    uWind: { value: reduceMotion ? .25 : 1 }, uShake: { value: new Vector3(0, 0, -100) }, uShakeK: { value: new Vector2(0, 1) },
  };

  const root = new Group();
  scene.add(root);
  root.visible = false;

  const growth = { wood: 0, leaves: 0, flowers: 0 };
  const pose = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, opacity: 1 };

  function woodMaterial(opts) {
    const m = keep(new MeshStandardMaterial(opts));
    patch(m, 'wood', U, { head: WOOD_HEAD, begin: WOOD_BEGIN });
    const depth = keep(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }));
    patch(depth, 'wood-depth', U, { head: WOOD_HEAD, begin: WOOD_BEGIN });
    return { m, depth };
  }

  function leafMesh(list, { texture, curl, fold, roughness, back, young }) {
    const geo = keep(leafGeometry(curl, fold));
    const n = list.length;
    const aStart = new Float32Array(n), aPhase = new Float32Array(n), aYoung = new Float32Array(n);
    const frag = {
      head: 'uniform vec3 uBack; uniform vec3 uYoungColor; varying float vYoung;\n',
      map: `
        diffuseColor.rgb = mix(diffuseColor.rgb, uYoungColor * (.45 + 2.2 * dot(diffuseColor.rgb, vec3(.3, .59, .11))), vYoung);
        if (!gl_FrontFacing) diffuseColor.rgb *= uBack;
      `,
    };
    const m = keep(new MeshStandardMaterial({ map: texture, alphaTest: .5, side: DoubleSide, roughness, metalness: 0, alphaToCoverage: true }));
    patch(m, `leaf-${spec.id}`, { ...U, uBack: { value: new Color(...back) }, uYoungColor: { value: new Color(young || '#9A3B22') } },
      { head: LEAF_HEAD, begin: LEAF_BEGIN, move: LEAF_MOVE, frag });
    const depth = keep(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: texture, alphaTest: .5 }));
    patch(depth, `leaf-depth-${spec.id}`, U, { head: LEAF_HEAD, begin: LEAF_BEGIN, move: LEAF_MOVE });

    const mesh = new InstancedMesh(geo, m, n);
    const X = new Vector3(), Y = new Vector3(), Z = new Vector3(), M = new Matrix4(), col = new Color();
    list.forEach((L, i) => {
      Y.copy(L.dir).normalize();
      Z.copy(L.face).addScaledVector(Y, -L.face.dot(Y));
      if (Z.lengthSq() < 1e-4) Z.copy(perpendicular(Y));
      Z.normalize();
      X.crossVectors(Y, Z).normalize();
      M.makeBasis(X.multiplyScalar(L.width), Y.multiplyScalar(L.len), Z.multiplyScalar(L.len)).setPosition(L.p);
      mesh.setMatrixAt(i, M);
      mesh.setColorAt(i, col.setRGB(...L.color));
      aStart[i] = L.start; aPhase[i] = r() * 3; aYoung[i] = L.young;
    });
    geo.setAttribute('aStart', new InstancedBufferAttribute(aStart, 1));
    geo.setAttribute('aPhase', new InstancedBufferAttribute(aPhase, 1));
    geo.setAttribute('aYoung', new InstancedBufferAttribute(aYoung, 1));
    mesh.customDepthMaterial = depth;
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    return mesh;
  }

  let group = root;                   // what the pose moves (the potato plant's pivot)
  const stalks = [];
  let crown = null, flowerMesh = null, flowerCones = null, flowerBase = [];

  if (F.type === 'tree') {
    /* where each fruit's stalk starts: above the fruit, at the front of the crown */
    const C = F.crown;
    const anchors = !F.stalk ? [] : spec.positions.map(([x, y]) => {
      const h = spec.fruitSize * 260 / 240;
      const topY = y - h * .47;
      const ax = x + (r() - .5) * F.stalk.lean;
      const ay = topY - F.stalk.len;
      const e = 1 - ((ax - C.cx) / C.rx) ** 2 - ((ay - C.cy) / C.ry) ** 2;
      return { x: ax, y: -ay, z: C.rz * Math.sqrt(Math.max(.05, e)), top: new Vector3(x, -topY, 0) };
    });
    const nodes = growSkeleton(F, anchors, r);
    crown = F.crown;

    const batch = new TubeBatch();
    for (const ch of chains(nodes[0])) {
      const R = ch[Math.min(1, ch.length - 1)].r;
      batch.add(ch, { radial: R > 12 ? 14 : R > 5 ? 9 : R > 2.5 ? 6 : 4, smoothK: R > 5 ? 3 : 2, uScale: Math.max(1, Math.round(R * 6.28 / 70)) });
    }
    const bark = keep(barkTexture(F.bark, 3));
    const { m, depth } = woodMaterial({ map: bark, bumpMap: bark, bumpScale: F.bark.bump, roughness: .95, color: 0xFFFFFF });
    const wood = new Mesh(keep(batch.geometry()), m);
    wood.customDepthMaterial = depth;
    wood.castShadow = wood.receiveShadow = true;
    wood.frustumCulled = false;
    root.add(wood);

    const leafList = placeLeaves(F, nodes, r);
    root.add(leafMesh(leafList, {
      texture: keep(leafTexture(spec.id, 5)), curl: F.leaf.curl, fold: F.leaf.fold, roughness: F.leaf.roughness,
      back: F.leaf.back, young: F.leaf.youngColor,
    }));

    /* the fruit stalks: they go when their fruit is picked */
    const stalkMat = F.stalk && keep(new MeshStandardMaterial({ color: F.stalk.color, roughness: .8 }));
    anchors.forEach(a => {
      const b = new TubeBatch(), from = new Vector3(a.x, a.y, a.z), to = a.top.clone().setZ(a.z + 6);
      const mid = from.clone().lerp(to, .5).add(new Vector3(F.stalk.len * .12, 0, 0));
      b.add([{ p: from, r: F.stalk.r * 1.2, o: 0 }, { p: mid, r: F.stalk.r, o: 0 }, { p: to, r: F.stalk.r * .9, o: 0 }], { radial: 5, smoothK: 4 });
      const g = keep(b.geometry());
      const mesh = new Mesh(g, stalkMat);
      mesh.castShadow = true;
      mesh.visible = false;
      root.add(mesh);
      stalks.push(mesh);
    });
  } else {
    /* potato: pivot at the base, so the plant can be pulled out of the ground */
    const [bx, by] = F.base;
    group = new Group();
    group.position.set(bx, -by, 0);
    root.add(group);
    const plant = buildPotatoPlant(F, r);
    const { m, depth } = woodMaterial({ color: F.stem, roughness: .7 });
    const wood = new Mesh(keep(plant.wood.geometry()), m);
    wood.customDepthMaterial = depth;
    wood.castShadow = wood.receiveShadow = true;
    wood.frustumCulled = false;
    group.add(wood);
    group.add(leafMesh(plant.leaves, { texture: keep(leafTexture('potato', 9)), curl: .12, fold: .06, roughness: .75, back: [1.05, 1.12, 1] }));

    const fm = keep(new MeshStandardMaterial({ map: keep(flowerTexture(F.petal)), alphaTest: .5, side: DoubleSide, roughness: .6 }));
    flowerMesh = new InstancedMesh(keep(new PlaneGeometry(1, 1)), fm, plant.flowers.length);
    flowerCones = new InstancedMesh(keep(new ConeGeometry(.16, .34, 10).rotateX(Math.PI / 2).translate(0, 0, .17)),
      keep(new MeshStandardMaterial({ color: '#F2C025', roughness: .5 })), plant.flowers.length);
    flowerBase = plant.flowers;
    [flowerMesh, flowerCones].forEach(x => { x.castShadow = true; x.frustumCulled = false; group.add(x); });
    placeFlowers(0);
  }

  function placeFlowers(k) {
    if (!flowerMesh) return;
    const M = new Matrix4(), Y = new Vector3(), X = new Vector3();
    flowerBase.forEach((f, i) => {
      const Z = f.face;
      X.copy(perpendicular(Z)); Y.crossVectors(Z, X);
      const s = f.size * Math.max(.0001, k);
      M.makeBasis(X.clone().multiplyScalar(s), Y.clone().multiplyScalar(s), Z.clone().multiplyScalar(s)).setPosition(f.p);
      flowerMesh.setMatrixAt(i, M);
      flowerCones.setMatrixAt(i, M);
    });
    flowerMesh.instanceMatrix.needsUpdate = flowerCones.instanceMatrix.needsUpdate = true;
  }

  /* ---------- per frame ---------- */
  const view = { L: 0, R: 800, T: 0, B: 1800, tx: 0, ty: 0 };
  let lastFlowers = -1, faded = false;

  function render(time) {
    if (!root.visible) return;
    canvas.style.transform = `translate3d(${view.tx}px,${view.ty}px,0)`;
    camera.left = view.L; camera.right = view.R; camera.top = -view.T; camera.bottom = -view.B;
    camera.updateProjectionMatrix();

    U.uTime.value = time;
    U.uGrow.value = growth.wood * 1.08;
    U.uThick.value = .3 + .7 * smooth(Math.min(1, growth.wood));
    U.uLeaves.value = growth.leaves * 1.02;
    const showStalks = growth.leaves > .85;
    stalks.forEach(s => { if (!s.userData.gone) s.visible = showStalks; });
    if (growth.flowers !== lastFlowers) { lastFlowers = growth.flowers; placeFlowers(growth.flowers); }

    if (group !== root) {
      const [bx, by] = F.base;
      group.position.set(bx + pose.x, -(by + pose.y), 0);
      group.rotation.z = -pose.rot * Math.PI / 180;
      group.scale.set(pose.sx, pose.sy, 1);
      if (pose.opacity < 1 || faded) {
        faded = true;
        group.visible = pose.opacity > .01;
        group.traverse(o => {
          if (!o.material) return;
          o.material.transparent = pose.opacity < 1;
          o.material.opacity = pose.opacity;
        });
      }
    }
    renderer.render(scene, camera);
  }

  return {
    growth, pose,
    show() { root.visible = true; canvas.style.visibility = 'visible'; },
    /* the visible world rectangle (world units) and where the canvas must sit to cover the screen */
    sync(v) { Object.assign(view, v); },
    render,
    resize(w, h) {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 700 ? 1.5 : 1.75));
      renderer.setSize(w, h, true);
    },
    /* a shiver through the leaves around a point */
    shake(x, y, k = 1, radius = 200) {
      U.uShake.value.set(x, -y, U.uTime.value);
      U.uShakeK.value.set(k, radius);
    },
    detach(i) { if (stalks[i]) { stalks[i].visible = false; stalks[i].userData.gone = true; } },
    /* is this world point on the tree? */
    hit(x, y) {
      if (!crown || growth.wood < .5) return false;
      const e = ((x - crown.cx) / (crown.rx * 1.05)) ** 2 + ((y - crown.cy) / (crown.ry * 1.05)) ** 2;
      return e <= 1 || (Math.abs(x - F.base[0]) < 60 && y > crown.cy && y < F.base[1]);
    },
    destroy() {
      disposables.forEach(d => d.dispose && d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
