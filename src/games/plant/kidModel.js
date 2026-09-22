/* The boy in the game: a cartoon boy from Mixamo (red cap, green jacket, shorts, boots) with Mixamo's own
   motion-captured moves, packed small in public/models/timmy/ (body.glb, moves.glb, skin textures).
   The engine drives him through `pose`, exactly as before.

   pose.act picks what his body is doing:
       idle    happy idle, weight shifting            run     a light run (held in place; the engine moves him)
       climb   on the ladder: his hands grip the rails and his feet find the rungs where the engine puts them
               (pose.hL / hR / fL / fR), solved with two-bone IK over the climbing clip
       pull    the plant: a low heave, straightening up
       crouch  kneeling down in the soil and staying there; his hands follow the engine's scooping (IK)
       jump    jumping for joy                          cheer   cheering, arms in the air
   pose.shot is a one-off move, played whenever pose.shotN changes (a jump, a nod, a head-shake, a happy
   gesture, a wave). pose.reach (0…1) lets his right hand go to pose.hR — that's how he picks a fruit.
   When he first stops running he waves hello.

   If the files can't load, the drawn-in doll from kid3d.js stands in so the game never loses its boy. */
import {
  Group, LoopOnce, LoopRepeat, Vector3, TextureLoader, MeshStandardMaterial, SRGBColorSpace, Box3, AnimationMixer,
  Quaternion, Euler,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createKid } from './kid3d.js';

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BASE = { idle: 'idle', run: 'run', climb: 'climb', pull: 'pull', crouch: 'kneel', jump: 'jump', cheer: 'cheer' };
const HOLD = new Set(['kneel']);                         // played once, then held (he stays kneeling)
const SHOT = { 'pick-up': 'pickup', jump: 'jump', 'emote-no': 'no', wave: 'wave', victory: 'victory' };

async function loadTimmy(base) {
  const gltf = new GLTFLoader();
  const tex = new TextureLoader();
  const [body, moves, map, normalMap] = await Promise.all([
    gltf.loadAsync(`${base}body.glb`), gltf.loadAsync(`${base}moves.glb`),
    tex.loadAsync(`${base}skin.jpg`), tex.loadAsync(`${base}skin_n.jpg`),
  ]);
  map.colorSpace = SRGBColorSpace;
  const model = body.scene;
  const material = new MeshStandardMaterial({ map, normalMap, roughness: .72, metalness: 0 });
  const bones = {};
  model.traverse(o => {
    if (o.isMesh) { o.material = material; o.frustumCulled = false; o.castShadow = true; }
    // Mixamo names its bones "mixamorig6LeftArm" and so on: keep them by what they are
    if (o.isBone) bones[o.name.replace(/^mixamorig\d*/, '')] = o;
  });
  const clips = Object.fromEntries(moves.animations.map(c => [c.name, c]));
  // Mixamo's ladder clip turns him round to the ladder as it starts; the engine already does the turning
  if (clips.climb) noTurn(clips.climb);
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  return { model, bones, clips, height: box.max.y - box.min.y, mixer: new AnimationMixer(model) };
}

/* two-bone IK (shoulder → elbow → hand, hip → knee → foot): turn the first two bones so the third reaches
   target, bending toward pole (where the elbow / knee should point). All in world space; weight blends it
   with the pose the animation gave. */
const A = new Vector3(), B = new Vector3(), C = new Vector3(), T = new Vector3();
const q = new Quaternion(), qa = new Quaternion(), qb = new Quaternion(), r = new Quaternion();
const v1 = new Vector3(), v2 = new Vector3(), v3 = new Vector3(), ax0 = new Vector3(), ax1 = new Vector3();
const keepA = new Quaternion(), keepB = new Quaternion();
const acos = x => Math.acos(Math.max(-1, Math.min(1, x)));

export function twoBone(a, b, c, target, pole, weight = 1) {
  if (!a || !b || !c || weight <= 0) return;
  keepA.copy(a.quaternion); keepB.copy(b.quaternion);
  a.getWorldPosition(A); b.getWorldPosition(B); c.getWorldPosition(C);
  const lab = A.distanceTo(B), lcb = B.distanceTo(C);
  const lat = Math.max(1e-3, Math.min(T.copy(target).sub(A).length(), (lab + lcb) * .999));
  const acAB0 = acos(v1.copy(C).sub(A).normalize().dot(v2.copy(B).sub(A).normalize()));
  const baBC0 = acos(v1.copy(A).sub(B).normalize().dot(v2.copy(C).sub(B).normalize()));
  const acAT0 = acos(v1.copy(C).sub(A).normalize().dot(v2.copy(target).sub(A).normalize()));
  const acAB1 = acos((lcb * lcb - lab * lab - lat * lat) / (-2 * lab * lat));
  const baBC1 = acos((lat * lat - lab * lab - lcb * lcb) / (-2 * lab * lcb));
  ax0.copy(v1.copy(C).sub(A)).cross(v3.copy(pole).sub(A)).normalize();
  ax1.copy(v1.copy(C).sub(A)).cross(v2.copy(target).sub(A)).normalize();
  a.getWorldQuaternion(qa).invert();
  b.getWorldQuaternion(qb).invert();
  if (ax0.lengthSq() > .5) {
    q.setFromAxisAngle(v1.copy(ax0).applyQuaternion(qa), acAB1 - acAB0);
    r.setFromAxisAngle(v2.copy(ax0).applyQuaternion(qb), baBC1 - baBC0);
    b.quaternion.multiply(r);
  } else q.identity();
  if (ax1.lengthSq() > .5) q.multiply(r.setFromAxisAngle(v1.copy(ax1).applyQuaternion(qa), acAT0));
  a.quaternion.multiply(q);
  if (weight < 1) { a.quaternion.slerpQuaternions(keepA, a.quaternion, weight); b.quaternion.slerpQuaternions(keepB, b.quaternion, weight); }
  a.updateMatrixWorld(true);
}

/* take the turning (yaw) out of a clip's hips, keeping their lean and roll */
function noTurn(clip) {
  const track = clip.tracks.find(t => /Hips.quaternion$/.test(t.name));
  if (!track) return;
  const q = new Quaternion(), e = new Euler();
  for (let i = 0; i < track.values.length; i += 4) {
    e.setFromQuaternion(q.fromArray(track.values, i), 'YXZ');
    e.y = 0;
    q.setFromEuler(e).toArray(track.values, i);
  }
}

export function createModelKid(base, { height = 205 } = {}) {
  const root = new Group();          // moved, leaned and squashed by the pose (drawing units, y up)
  const body = new Group();          // turned to face wherever he is looking
  root.add(body);

  let boy = null, fallback = null;
  let current = null, currentName = '', shot = null, shotN = 0, last = -1, lastAct = '', yesTurn = 0;

  loadTimmy(base).then(b => {
    boy = b;
    b.model.scale.setScalar(height / b.height);
    body.add(b.model);
    b.mixer.addEventListener('finished', e => {
      if (e.action !== shot) return;
      shot.fadeOut(.3);
      current?.reset().setEffectiveWeight(1).fadeIn(.3).play();
      shot = null;
    });
    if (import.meta.env.DEV) window.__kid = b;
  }).catch(err => {
    console.warn('the boy did not load — using the drawn-in one', err);
    fallback = createKid();
    root.add(fallback.group);
  });

  const action = name => boy.clips[name] && boy.mixer.clipAction(boy.clips[name]);

  function setAct(act) {
    const name = BASE[act] || BASE.idle;
    if (name === currentName) return;
    const next = action(name);
    if (!next) return;
    const hold = HOLD.has(name);
    current?.fadeOut(.3);
    next.reset().setLoop(hold ? LoopOnce : LoopRepeat, Infinity).play();
    next.clampWhenFinished = hold;
    // during a one-off move the new stance waits, silent, and comes in when the move is over
    if (shot) next.setEffectiveWeight(0); else next.setEffectiveWeight(1).fadeIn(.3);
    current = next;
    currentName = name;
  }

  function playShot(name) {
    // "yes!" comes two ways, taking turns: a nod, then a happy little gesture
    const clipName = name === 'emote-yes' ? (yesTurn++ % 2 ? 'happy' : 'yes') : SHOT[name];
    const a = action(clipName);
    if (!a) return;
    if (shot && shot !== a) shot.fadeOut(.2);
    if (current !== a) current?.fadeOut(.2);
    a.reset().setLoop(LoopOnce, 1).setEffectiveWeight(1).fadeIn(.2).play();
    a.clampWhenFinished = false;
    shot = a;
  }

  // a point given in the engine's drawing (relative to his feet, y down) → the world
  const toWorld = (out, x, y, z) => root.localToWorld(out.set(x, -y, z));
  const hand = new Vector3(), pole = new Vector3();

  function limbs(p, { hands = 0, feet = 0, reach = 0, depth = 0 }) {
    const bo = boy.bones;
    root.updateMatrixWorld(true);
    const arm = (side, x, y, w) => {
      if (w <= 0) return;
      const s = side === 'Left' ? -1 : 1;
      toWorld(hand, x, y, depth);
      toWorld(pole, x + s * 70, y + 90, depth + 60);          // elbows down, out and a little back
      twoBone(bo[`${side}Arm`], bo[`${side}ForeArm`], bo[`${side}Hand`], hand, pole, w);
    };
    arm('Left', p.hLx, p.hLy, hands);
    arm('Right', p.hRx, p.hRy, Math.max(hands, reach));
    if (feet > 0) {
      for (const [side, x, y] of [['Left', p.fLx, p.fLy], ['Right', p.fRx, p.fRy]]) {
        toWorld(hand, x, y, depth * .5);
        toWorld(pole, x, y - 60, depth * .5 - 80);          // knees forward, toward the ladder
        twoBone(bo[`${side}UpLeg`], bo[`${side}Leg`], bo[`${side}Foot`], hand, pole, feet);
      }
    }
  }

  function update(p, turn, time) {
    if (fallback) return fallback.update(p, turn);
    root.position.set(p.x, -(p.y - (p.sink || 0)), 0);
    root.rotation.z = -p.lean * .6 * DEG;
    root.scale.set(p.sx, p.sy, p.sx);
    body.rotation.y = (180 - turn) * DEG;          // 0 = his back to us, 180 = facing us
    if (!boy) return;

    const dt = last < 0 ? 0 : clamp(time - last, 0, .1);
    last = time;
    const act = p.act || 'idle';
    setAct(act);
    if (lastAct === 'run' && act === 'idle' && !shot) playShot('wave');    // he's arrived: hello!
    lastAct = act;
    if ((p.shotN || 0) !== shotN) { shotN = p.shotN || 0; if (p.shot) playShot(p.shot); }
    boy.mixer.update(dt);

    const bo = boy.bones;
    if (bo.Head) bo.Head.rotation.z += -p.head * .6 * DEG;

    // on the ladder the rungs are just in front of him; hands and feet go where the engine says
    if (act === 'climb') limbs(p, { hands: 1, feet: 1, depth: -34 });
    else if (act === 'crouch' && !shot) limbs(p, { hands: .7, depth: 26 });
    else if (p.reach > 0) limbs(p, { reach: p.reach, depth: 0 });
  }

  return {
    group: root,
    update,
    dispose() {
      boy?.mixer.stopAllAction();
      root.traverse(o => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach(m => { ['map', 'normalMap'].forEach(k => m[k]?.dispose()); m.dispose(); });
      });
      fallback?.dispose();
    },
  };
}
