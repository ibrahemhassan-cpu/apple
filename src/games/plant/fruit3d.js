/* The fruit itself, in 3D: a real-looking apple, mango or potato for every one on the plant.
   The clickable .fruit-node divs stay exactly where they are (they still do the picking, dragging and rings);
   this only draws what's inside them, copying each node's scale, spin and fade every frame.
   It also renders one still picture of the fruit, used for the ones flying to the basket and lying in it.

   Models are built in the fruit's SVG box units (x −120…120, y −140…120, y down), so a model fills
   its node exactly the way the old drawing did. */
import {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, LatheGeometry, SphereGeometry, TubeGeometry, PlaneGeometry,
  MeshPhysicalMaterial, MeshStandardMaterial, HemisphereLight, DirectionalLight, CanvasTexture, Vector2, Vector3,
  CatmullRomCurve3, SplineCurve, BufferAttribute, DoubleSide, SRGBColorSpace, ACESFilmicToneMapping,
} from 'three';
import { leafTexture } from './flora3d.js';

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* skins, painted wrapped around the fruit: canvas x = around, canvas top = the stem end */
function skin(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
/* draw at x and wrapped one width either side, so the seam round the back never shows */
const around = (w, draw) => { draw(-w); draw(0); draw(w); };

/* ---------- apple: red flushed over yellow in fine streaks, pale freckles, green-gold round the stem ---------- */
function appleSkin(r) {
  return skin(512, 256, (g, w, h) => {
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, '#B7A43E'); v.addColorStop(.1, '#B5412F'); v.addColorStop(.25, '#C8263A');
    v.addColorStop(.7, '#B51A30'); v.addColorStop(.92, '#8E1426'); v.addColorStop(1, '#A58A3E');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    // the side that was in the shade stays yellower
    const shade = g.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, 'rgba(236,190,70,.32)'); shade.addColorStop(.3, 'rgba(236,190,70,0)');
    shade.addColorStop(.7, 'rgba(236,190,70,0)'); shade.addColorStop(1, 'rgba(236,190,70,.32)');
    g.fillStyle = shade; g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    g.filter = 'blur(2.5px)';                         // streaks melt into the flush rather than look painted on
    for (let i = 0; i < 150; i++) {
      const x = r() * w, y0 = 20 + r() * 120, len = 40 + r() * 100, lw = 2 + r() * 5;
      g.strokeStyle = r() > .45 ? `rgba(110,8,26,${.12 + r() * .18})` : `rgba(250,160,80,${.06 + r() * .1})`;
      g.lineWidth = lw;
      around(w, dx => { g.beginPath(); g.moveTo(x + dx, y0); g.quadraticCurveTo(x + dx + (r() - .5) * 8, y0 + len / 2, x + dx + (r() - .5) * 6, y0 + len); g.stroke(); });
    }
    g.filter = 'none';
    for (let i = 0; i < 380; i++) {
      const x = r() * w, y = 8 + r() * (h - 16), s = .5 + r() * .9;
      g.fillStyle = `rgba(255,232,180,${.2 + r() * .3})`;
      around(w, dx => { g.beginPath(); g.ellipse(x + dx, y, s, s * .8, 0, 0, 6.29); g.fill(); });
    }
  });
}

/* ---------- mango: green at the shoulder ripening through yellow to orange, a red blush, pale dots ---------- */
function mangoSkin(r) {
  return skin(512, 256, (g, w, h) => {
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, '#7FA83A'); v.addColorStop(.16, '#B9C446'); v.addColorStop(.36, '#F2C443');
    v.addColorStop(.62, '#F59A35'); v.addColorStop(1, '#E8662E');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
    // the sunny cheek blushes red
    around(w, dx => {
      const b = g.createRadialGradient(w * .5 + dx, h * .72, 4, w * .5 + dx, h * .72, w * .32);
      b.addColorStop(0, 'rgba(208,48,40,.75)'); b.addColorStop(.6, 'rgba(214,70,44,.3)'); b.addColorStop(1, 'rgba(214,70,44,0)');
      g.fillStyle = b; g.fillRect(dx, 0, w, h);
    });
    g.filter = 'blur(6px)';
    for (let i = 0; i < 140; i++) {
      const x = r() * w, y = r() * h, s = 6 + r() * 26;
      g.fillStyle = r() > .5 ? `rgba(255,230,120,${.05 + r() * .08})` : `rgba(160,90,20,${.04 + r() * .06})`;
      around(w, dx => { g.beginPath(); g.ellipse(x + dx, y, s, s * .7, r() * 3, 0, 6.29); g.fill(); });
    }
    g.filter = 'none';
    for (let i = 0; i < 600; i++) {
      const x = r() * w, y = r() * h, s = .4 + r() * .7;
      g.fillStyle = `rgba(255,245,190,${.25 + r() * .3})`;
      around(w, dx => { g.beginPath(); g.arc(x + dx, y, s, 0, 6.29); g.fill(); });
    }
  });
}

/* ---------- potato: dusty tan skin, darker blotches, specks of soil ---------- */
function potatoSkin(r) {
  return skin(512, 256, (g, w, h) => {
    g.fillStyle = '#C79A60'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(5px)';
    for (let i = 0; i < 260; i++) {
      const x = r() * w, y = r() * h, s = 5 + r() * 30;
      g.fillStyle = r() > .5 ? `rgba(226,186,122,${.12 + r() * .2})` : `rgba(140,96,50,${.1 + r() * .18})`;
      around(w, dx => { g.beginPath(); g.ellipse(x + dx, y, s, s * (.5 + r() * .5), r() * 3, 0, 6.29); g.fill(); });
    }
    g.filter = 'blur(1.5px)';
    for (let i = 0; i < 60; i++) {                           // dried soil
      const x = r() * w, y = r() * h, s = 3 + r() * 14;
      g.fillStyle = `rgba(110,78,48,${.2 + r() * .25})`;
      around(w, dx => { g.beginPath(); g.ellipse(x + dx, y, s, s * .6, r() * 3, 0, 6.29); g.fill(); });
    }
    g.filter = 'none';
    for (let i = 0; i < 900; i++) {
      const x = r() * w, y = r() * h;
      g.fillStyle = r() > .5 ? 'rgba(92,60,30,.45)' : 'rgba(240,210,160,.35)';
      g.fillRect(x, y, 1 + r() * 1.5, 1 + r() * 1.5);
    }
  });
}

/* =====================================================================
   models
   ===================================================================== */
function tube(points, radius, material) {
  const geo = new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), 12, radius, 8);
  return new Mesh(geo, material);
}

/* lean the top a little toward us, so the fruit reads as round rather than as a flat cut-out */
function tilted(model, a) {
  const g = new Group();
  model.rotation.x = a;
  g.add(model);
  return g;
}

function appleModel(r) {
  // the classic apple outline, from the calyx dimple at the bottom round to the stem cavity at the top
  const profile = [[0, -66], [10, -74], [26, -84], [46, -90], [66, -88], [86, -76], [101, -56], [111, -30], [114, -2],
    [112, 26], [105, 52], [92, 74], [74, 90], [54, 97], [36, 95], [20, 86], [8, 74], [0, 70]];
  const outline = new SplineCurve(profile.map(([x, y]) => new Vector2(x, y))).getPoints(64);   // smooth, not faceted
  const geo = new LatheGeometry(outline, 72);
  geo.rotateY(Math.PI);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x), low = Math.max(0, -y / 95);
    const k = 1 + .025 * Math.cos(a * 5) * low + .02 * Math.cos(a + .6);   // gentle lobes toward the base
    pos.setXYZ(i, x * k, y, z * k * .96);
  }
  geo.translate(0, -8, 0);
  geo.computeVertexNormals();
  const body = new Mesh(geo, new MeshPhysicalMaterial({ map: appleSkin(r), roughness: .38, clearcoat: .7, clearcoatRoughness: .28 }));

  const g = new Group();
  g.add(body);
  g.add(tube([[0, 58, 0], [3, 90, 0], [9, 112, 1], [19, 124, 2]], 4.5, new MeshStandardMaterial({ color: '#5B3B1E', roughness: .8 })));
  // one leaf still on the stem
  const leafGeo = new PlaneGeometry(1, 1, 1, 4).translate(0, .5, 0);
  const lp = leafGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) lp.setZ(i, -.18 * lp.getY(i) ** 2);
  leafGeo.computeVertexNormals();
  const leaf = new Mesh(leafGeo, new MeshStandardMaterial({ map: leafTexture('apple', 5), alphaTest: .5, side: DoubleSide, roughness: .7 }));
  leaf.scale.set(34, 68, 68);
  leaf.position.set(12, 106, 4);
  leaf.rotation.set(.35, 0, -1.3);
  g.add(leaf);
  return tilted(g, .32);
}

function mangoModel(r) {
  const geo = new SphereGeometry(1, 72, 48);
  geo.rotateY(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let X = x * 90, Y = y * 110, Z = z * 70;                 // longer than wide, flattened side to side
    if (y < 0) X *= 1 - .12 * -y;                            // narrower toward the tip
    X += -14 * y;                                            // leaning, with the stem off to one side
    X += 10 * Math.max(0, x) * Math.max(0, y + .3);          // the round back
    const d = ((x + .82) / .32) ** 2 + ((y + .42) / .28) ** 2;
    X -= 16 * Math.exp(-d);                                  // the little beak on the belly side
    pos.setXYZ(i, X, Y + 2, Z);
  }
  geo.computeVertexNormals();
  const g = new Group();
  g.add(new Mesh(geo, new MeshPhysicalMaterial({ map: mangoSkin(r), roughness: .5, clearcoat: .35, clearcoatRoughness: .45 })));
  g.add(tube([[-13, 100, 0], [-9, 120, 0], [-3, 136, 0]], 5, new MeshStandardMaterial({ color: '#6B5A2C', roughness: .8 })));
  return tilted(g, .18);
}

function potatoModel(r) {
  const geo = new SphereGeometry(1, 64, 40);
  geo.rotateZ(Math.PI / 2);                                  // the skin's pinched poles go to the two narrow ends
  const pos = geo.attributes.position;
  const eyes = Array.from({ length: 10 }, () => new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize());
  const colors = new Float32Array(pos.count * 3);
  const n = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    let k = 1 + .05 * Math.sin(3.1 * n.x + 1.3) * Math.sin(2.3 * n.y + .4) + .04 * Math.sin(4.7 * n.z + 2.1 * n.y) + .025 * Math.sin(6 * n.x + 5 * n.y);
    let dark = 0;
    for (const e of eyes) {
      const d = n.dot(e);
      if (d > .975) { const t = (d - .975) / .025; k -= .05 * t * t; dark = Math.max(dark, t); }   // sunken eyes
    }
    pos.setXYZ(i, n.x * 112 * k, n.y * 100 * k, n.z * 80 * k);
    const c = 1 - .45 * dark;
    colors[i * 3] = c; colors[i * 3 + 1] = c * .95; colors[i * 3 + 2] = c * .9;
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const g = new Group();
  g.add(new Mesh(geo, new MeshStandardMaterial({ map: potatoSkin(r), vertexColors: true, roughness: .92 })));
  return tilted(g, .3);
}

const MODELS = { apple: appleModel, mango: mangoModel, potato: potatoModel };
/* =====================================================================
   renderer
   ===================================================================== */
export function createFruits({ canvas, spec }) {
  if (!MODELS[spec.id]) return null;              // no model yet for this fruit: the engine keeps its drawing
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;                                  // no WebGL: the engine keeps the drawn fruit
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const hemi = new HemisphereLight(0xDDEEFF, 0x6A5A3A, 1.5);
  const sun = new DirectionalLight(0xFFF2DD, 2.6);
  sun.position.set(.7, .8, 1);                      // from the sun's corner of the sky, and in front
  scene.add(hemi, sun);
  const camera = new OrthographicCamera(0, 800, 0, -1800, 1, 3000);
  camera.position.set(0, 0, 1500);

  const r = rng(13);
  const model = MODELS[spec.id](r);

  /* one still picture of the fruit for the flyers and the basket, framed like the SVG box */
  const sprite = (() => {
    const shot = new Scene();
    shot.add(hemi.clone(), sun.clone());
    shot.add(model);
    const cam = new OrthographicCamera(-120, 120, 140, -120, 1, 3000);
    cam.position.set(0, 0, 1500);
    renderer.setPixelRatio(1);
    renderer.setSize(480, 520, false);
    cam.updateProjectionMatrix();
    renderer.render(shot, cam);
    const url = canvas.toDataURL('image/png');
    shot.remove(model);
    return url;
  })();

  /* each fruit: centre → its own spin and pop → sway from the stem → the model */
  const Z = 600;                                    // in front of everything; the camera is orthographic
  const fruits = spec.positions.map(() => {
    const outer = new Group(), sway = new Group(), m = model.clone(true);
    m.traverse(o => { if (o.material) o.material = o.material.clone(); });
    m.position.y = -135;
    sway.position.y = 135;
    sway.add(m);
    outer.add(sway);
    scene.add(outer);
    return { outer, sway, m, alpha: -1 };
  });

  const view = { L: 0, R: 800, T: 0, B: 1800, tx: 0, ty: 0 };

  return {
    sprite,
    sync(v) { Object.assign(view, v); },
    resize(w, h) {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, true);
    },
    /* states: [{ x, y, size, scale, rot, sway, alpha }] in world units / degrees */
    render(states) {
      canvas.style.transform = `translate3d(${view.tx}px,${view.ty}px,0)`;
      camera.left = view.L; camera.right = view.R; camera.top = -view.T; camera.bottom = -view.B;
      camera.updateProjectionMatrix();
      let any = false;
      states.forEach((s, i) => {
        const f = fruits[i];
        f.outer.visible = s.alpha > .01 && s.scale > .001;
        if (!f.outer.visible) return;
        any = true;
        f.outer.position.set(s.x, -s.y, Z + i);
        f.outer.rotation.z = -s.rot * Math.PI / 180;
        f.outer.scale.setScalar(s.size / 240 * s.scale);
        f.sway.rotation.z = -s.sway * Math.PI / 180;
        if (Math.abs(s.alpha - f.alpha) > .005) {
          f.alpha = s.alpha;
          f.m.traverse(o => {
            if (!o.material) return;
            o.material.transparent = s.alpha < .999;
            o.material.opacity = s.alpha;
          });
        }
      });
      if (any || this.drawn) renderer.render(scene, camera);
      this.drawn = any;
    },
    destroy() {
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { o.material.map?.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
