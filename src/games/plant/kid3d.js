/* The boy, in 3D — the same boy, built out of real volumes instead of lines.

   The engine keeps driving him exactly as before: `pose` holds where his hands, knees and feet are, in the
   flat picture coordinates the SVG version used (x right, y down, feet on the ground). This just builds the
   body around those numbers, so every climb, jump, wave and squat carries over untouched.

   What is new is `pose.turn`: which way he is facing, in degrees.
       0 = his back to us (climbing the tree)   90 = facing right   -90 = facing left   180 = facing us
   His face is on the front of his head, so it shows exactly when he is really turned toward us. */
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, BoxGeometry, TorusGeometry, CircleGeometry,
  MeshStandardMaterial, Vector3,
} from 'three';

const DEG = Math.PI / 180;
const UP = new Vector3(0, 1, 0);

const C = {
  skin: '#F3C9A4', skinDark: '#E3B08A', hair: '#33241D',
  shirt: '#F2A541', shirtDark: '#DE8C2A',
  jeans: '#2D4A7C', jeansDark: '#24406E',
  cap: '#D7263D', capDark: '#AE1B2F', cream: '#FFF4DF', shoe: '#2A2233',
  eye: '#241A16', mouth: '#7E2233', cheek: '#EE9186',
};

/* a limb: a tube of unit height that gets stretched between two points every frame */
function limb(radius, material) {
  const m = new Mesh(new CylinderGeometry(radius, radius * .88, 1, 14), material);
  m.userData.radius = radius;
  return m;
}
const dir = new Vector3();
function stretch(mesh, a, b) {
  dir.subVectors(b, a);
  const len = dir.length() || .001;
  mesh.position.copy(a).addScaledVector(dir, .5);
  mesh.quaternion.setFromUnitVectors(UP, dir.divideScalar(len));
  mesh.scale.set(1, len, 1);
}

/* the elbow of an arm whose shoulder and hand are known: bent away from the body, and a little backwards */
const mid = new Vector3(), across = new Vector3(), elbowV = new Vector3();
function elbow(shoulder, hand, upper, fore, side) {
  mid.addVectors(shoulder, hand).multiplyScalar(.5);
  dir.subVectors(hand, shoulder);
  const d = Math.min(dir.length() || .001, upper + fore - 1);
  dir.normalize();
  across.set(-dir.y, dir.x, 0);                       // square to the arm, in the picture plane
  if (across.x * side < 0) across.negate();           // elbows point out, away from the chest
  across.z = -.45;                                    // and a little behind him, the way elbows bend
  across.addScaledVector(dir, -across.dot(dir)).normalize();
  const out = Math.sqrt(Math.max(0, upper * upper - (d / 2) ** 2));
  return elbowV.copy(mid).addScaledVector(across, out);
}

export function createKid() {
  const mats = [];
  const mat = (color, roughness = .8) => {
    const m = new MeshStandardMaterial({ color, roughness });
    mats.push(m);
    return m;
  };
  const M = {
    skin: mat(C.skin, .75), skinDark: mat(C.skinDark, .75), hair: mat(C.hair, .9),
    shirt: mat(C.shirt, .85), shirtDark: mat(C.shirtDark, .85),
    jeans: mat(C.jeans, .9), jeansDark: mat(C.jeansDark, .9),
    cap: mat(C.cap, .8), capDark: mat(C.capDark, .8), cream: mat(C.cream, .8), shoe: mat(C.shoe, .7),
    eye: mat(C.eye, .4), white: mat('#FFFFFF', .4), mouth: mat(C.mouth, .6), cheek: mat(C.cheek, .9),
  };
  const add = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const ball = (r, m, sx = 1, sy = 1, sz = 1) => {
    const b = new Mesh(new SphereGeometry(r, 20, 14), m);
    b.scale.set(sx, sy, sz);
    return b;
  };

  const root = new Group();          // moved, leaned and squashed by the pose
  const body = new Group();          // turned to face wherever he is looking
  root.add(body);

  /* ---------- legs and shoes ---------- */
  const thighL = limb(9.5, M.jeans), thighR = limb(9.5, M.jeans);
  const shinL = limb(8, M.jeans), shinR = limb(8, M.jeans);
  const kneeL = ball(8, M.jeans), kneeR = ball(8, M.jeans);
  const shoeL = ball(10.5, M.shoe, 1, .62, 1.7), shoeR = ball(10.5, M.shoe, 1, .62, 1.7);
  body.add(thighL, thighR, shinL, shinR, kneeL, kneeR, shoeL, shoeR);

  /* ---------- shorts and shirt ---------- */
  add(body, ball(19, M.jeans, 1.6, 1.05, 1), 0, 80, 0);                       // hips
  const torso = new Mesh(new CylinderGeometry(.5, .44, 1, 22), M.shirt);
  torso.scale.set(55, 62, 32);
  add(body, torso, 0, 116, 0);
  add(body, ball(14, M.shirt, 2, .62, 1.16), 0, 146, 0);                      // rounded chest and shoulders
  add(body, ball(11, M.shirt), -27, 145, 0);
  add(body, ball(11, M.shirt), 27, 145, 0);
  add(body, ball(15, M.shirt, 1.85, .5, 1.08), 0, 86, 0);                     // the hem of the shirt
  const collar = add(body, new Mesh(new TorusGeometry(12, 3.2, 8, 22), M.shirtDark), 0, 152, 0);
  collar.rotation.x = Math.PI / 2;
  add(body, new Mesh(new BoxGeometry(24, 3.2, 2), M.shirtDark)).position.set(0, 104, 16);

  /* ---------- arms ---------- */
  const upperL = limb(8.2, M.shirt), upperR = limb(8.2, M.shirt);
  const foreL = limb(6.6, M.skin), foreR = limb(6.6, M.skin);
  const elbowL = ball(6.8, M.skin), elbowR = ball(6.8, M.skin);
  const handL = ball(9.5, M.skin, 1, 1, .85), handR = ball(9.5, M.skin, 1, 1, .85);
  const sleeveL = ball(9.6, M.shirtDark, 1, .45, 1), sleeveR = ball(9.6, M.shirtDark, 1, .45, 1);
  body.add(upperL, upperR, foreL, foreR, elbowL, elbowR, handL, handR, sleeveL, sleeveR);

  /* ---------- head ---------- */
  const neck = add(body, new Mesh(new CylinderGeometry(8, 9, 16, 12), M.skin), 0, 152, 0);
  const head = new Group();
  add(body, head, 0, 160, 0);                 // the head tips from here, like the drawn one did
  const H = 28;                               // head centre, above that pivot
  add(head, ball(30, M.skin, 1, 1.05, .96), 0, H, 0);
  add(head, ball(7, M.skin, .8, 1, .8), -29, H - 2, -2);
  add(head, ball(7, M.skin, .8, 1, .8), 29, H - 2, -2);
  // hair: the back and sides, leaving the face clear, with a fringe under the cap
  const hair = add(head, new Mesh(new SphereGeometry(31.4, 28, 20, Math.PI * .86, Math.PI * 1.28, 0, Math.PI * .82), M.hair), 0, H, 0);
  hair.scale.set(1, 1.04, .99);
  add(head, ball(9, M.hair, 1.7, .4, .75), 0, H + 12, 21);                    // the fringe under the cap
  // cap
  const capTop = add(head, new Mesh(new SphereGeometry(30.5, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), M.cap), 0, H + 9, 0);
  capTop.scale.set(1.04, .95, 1.04);
  const band = add(head, new Mesh(new TorusGeometry(30.6, 3.4, 8, 26), M.capDark), 0, H + 9, 0);
  band.rotation.x = Math.PI / 2;
  const brim = add(head, new Mesh(new CircleGeometry(27, 26, 0, Math.PI), M.capDark), 0, H + 9, 4);
  brim.rotation.set(Math.PI / 2 - .3, 0, 0);
  brim.scale.set(1, .85, 1);
  add(head, ball(4.6, M.cream), 0, H + 38, 0);
  // face
  [-11.5, 11.5].forEach(x => {
    add(head, ball(6, M.white, 1, 1.1, .55), x, H + 1, 25.6);
    add(head, ball(4, M.eye, 1, 1.05, .6), x + Math.sign(x) * .6, H + .6, 27.4);
    add(head, ball(1.5, M.white), x + Math.sign(x) * 2, H + 3, 29.4);
    const brow = add(head, new Mesh(new BoxGeometry(11, 2.4, 2.6), M.hair), x, H + 9.5, 25);
    brow.rotation.z = -.14 * Math.sign(x);
    add(head, ball(6.5, M.cheek, 1.25, .85, .3), x * 1.8, H - 7, 23.5);
  });
  add(head, ball(4.4, M.skinDark, .9, .9, 1), 0, H - 4, 28.6);
  const mouth = add(head, new Mesh(new TorusGeometry(6.5, 2, 8, 18, Math.PI), M.mouth), 0, H - 12, 25.8);
  mouth.rotation.set(-.15, 0, Math.PI);

  /* ---------- put it all where the pose says, every frame ---------- */
  const S = new Vector3(), Hd = new Vector3(), K = new Vector3(), F = new Vector3(), E = new Vector3();
  const SHOULDER = 29, SHOULDER_Y = 146, HIP = 14, HIP_Y = 80;

  function update(p, turn) {
    // flat poses are drawn side by side; seen from the side they must fold in toward his middle
    const flat = 1 - .62 * Math.abs(Math.sin(turn * DEG));
    root.position.set(p.x, -p.y, 0);
    root.rotation.z = -p.lean * DEG;
    root.scale.set(p.sx, p.sy, p.sx);
    body.rotation.y = (180 - turn) * DEG;   // turn 0 = his back to us, 180 = facing us
    head.rotation.z = -p.head * DEG;

    // arms: shoulder → elbow → hand
    [[-1, p.hLx, p.hLy, upperL, foreL, elbowL, handL, sleeveL], [1, p.hRx, p.hRy, upperR, foreR, elbowR, handR, sleeveR]]
      .forEach(([side, hx, hy, upper, fore, joint, hand, sleeve]) => {
        S.set(side * SHOULDER * flat, SHOULDER_Y, 0);
        Hd.set(hx * flat, -hy, 0);
        E.copy(elbow(S, Hd, 44, 44, side));
        stretch(upper, S, E);
        stretch(fore, E, Hd);
        joint.position.copy(E);
        hand.position.copy(Hd);
        sleeve.position.copy(S).lerp(E, .42);
        sleeve.quaternion.copy(upper.quaternion);
      });

    // legs: hip → knee → foot, with the shoe pointing the way he faces
    [[-1, p.kLx, p.kLy, p.fLx, p.fLy, thighL, shinL, kneeL, shoeL], [1, p.kRx, p.kRy, p.fRx, p.fRy, thighR, shinR, kneeR, shoeR]]
      .forEach(([side, kx, ky, fx, fy, thigh, shin, joint, shoe]) => {
        S.set(side * HIP * flat, HIP_Y, 0);
        K.set(kx * flat, -ky, 0);
        F.set(fx * flat, -fy, 0);
        stretch(thigh, S, K);
        stretch(shin, K, F);
        joint.position.copy(K);
        shoe.position.set(F.x, Math.max(6, F.y), 5);
      });
  }

  return {
    group: root,
    update,
    dispose() { mats.forEach(m => m.dispose()); root.traverse(o => o.geometry && o.geometry.dispose()); },
  };
}
