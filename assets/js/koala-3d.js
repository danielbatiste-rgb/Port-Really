/* ==========================================================================
   Koala - live 3D prototype (three.js), built from primitives in code.
   Two looks:  "toon"  → cel shading + ink outlines (faithful to the drawing)
               "fuzzy" → shell-textured fur (plush toy)
   Head turns toward the pointer, pupils track, blinks, tap = hop.
   Stand-in until/unless a sculpted model (.glb) replaces it.
   ========================================================================== */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const C = {
  fur: "#abafc6",
  light: "#e8eaf5",
  ink: "#1a1a1a",
  green: "#00966f",
  yellow: "#eaeb2e",
  white: "#f1f1f1",
};

const SHELLS = 28;
const BASE_YAW = 0.42; // 3/4 view, facing right like the drawing

export function mountKoala3D(container, { look = "toon", interactive = true } = {}) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:manipulation";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.15, 8.2);
  camera.lookAt(0, 0.1, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8d91aa, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-3, 4, 5);
  scene.add(sun);
  const LIGHT_DIR = sun.position.clone().normalize();

  /* ---------- materials ---------- */
  const ramp = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: ramp });

  const outlineMat = (thick) =>
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uThick: { value: thick }, uColor: { value: new THREE.Color(C.ink) } },
      vertexShader: /* glsl */ `
        uniform float uThick;
        void main() {
          vec3 p = position + normal * uThick;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
          #include <colorspace_fragment>
        }`,
    });

  const furMat = (root, tip, len, density, layer) =>
    new THREE.ShaderMaterial({
      uniforms: {
        uLayer: { value: layer },
        uLen: { value: len },
        uDensity: { value: density },
        uRoot: { value: new THREE.Color(root) },
        uTip: { value: new THREE.Color(tip) },
        uLight: { value: LIGHT_DIR },
        uDrag: { value: new THREE.Vector3() },
      },
      vertexShader: /* glsl */ `
        uniform float uLayer, uLen;
        uniform vec3 uDrag;
        varying vec2 vUv;
        varying vec3 vN, vW;
        void main() {
          vUv = uv;
          vec3 p = position + normal * uLen * uLayer;
          p += (uDrag + vec3(0.0, -0.35 * uLen, 0.0)) * uLayer * uLayer; // gravity + lag
          vec4 w = modelMatrix * vec4(p, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLayer;
        uniform vec2 uDensity;
        uniform vec3 uRoot, uTip, uLight;
        varying vec2 vUv;
        varying vec3 vN, vW;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec2 g = vUv * uDensity;
          vec2 cell = floor(g);
          float h = mix(0.6, 1.0, hash(cell));
          vec2 f = fract(g) - 0.5 + (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.3;
          if (uLayer > 0.0 && (uLayer > h || length(f) > 0.55 * (1.0 - 0.55 * uLayer / h))) discard;
          vec3 n = normalize(vN);
          vec3 v = normalize(cameraPosition - vW);
          float diff = clamp(dot(n, uLight), 0.0, 1.0) * 0.55 + 0.5;
          float ao = mix(0.72, 1.06, uLayer);
          float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5) * 0.35 * uLayer;
          vec3 col = mix(uRoot * 0.85, uTip, uLayer) * diff * ao + rim;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });

  /* ---------- geometry helpers ---------- */
  // Soft lumpy sphere - gives the cloud-like silhouette of the drawing
  const lumpy = (r, amt = 0.045, seg = 64) => {
    const g = new THREE.SphereGeometry(r, seg, seg * 0.75);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = v.clone().normalize();
      const bump = Math.sin(n.x * 9 + n.y * 3) * Math.sin(n.y * 8 - n.z * 4) * amt;
      v.multiplyScalar(1 + bump);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  };
  const sphere = (r, seg = 40) => new THREE.SphereGeometry(r, seg, seg * 0.75);

  const outlines = [];
  const furred = []; // { mesh, shells: [] }

  // Adds a mesh (+ ink outline) to parent. fur: { len, density, root, tip }
  function part(parent, geo, color, { pos = [0, 0, 0], scale = [1, 1, 1], ink = 0.03, fur } = {}) {
    const mesh = new THREE.Mesh(geo, toon(color));
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    parent.add(mesh);
    if (ink) {
      const avg = (scale[0] + scale[1] + scale[2]) / 3;
      const o = new THREE.Mesh(geo, outlineMat(ink / avg));
      mesh.add(o);
      outlines.push({ mesh: o, fur: !!fur });
    }
    if (fur) {
      const shells = [];
      for (let i = 0; i < SHELLS; i++) {
        const s = new THREE.Mesh(geo, furMat(fur.root, fur.tip, fur.len / ((scale[0] + scale[1] + scale[2]) / 3), fur.density, i / (SHELLS - 1)));
        s.renderOrder = i;
        s.visible = false;
        mesh.add(s);
        shells.push(s);
      }
      furred.push({ mesh, shells });
    }
    return mesh;
  }

  // Orient a child so its +Z faces outward along `normal` (in parent space)
  const faceOut = (obj, normal) => obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());

  /* ---------- build the koala ---------- */
  const rig = new THREE.Group();     // hop / squash
  const head = new THREE.Group();    // turn
  const face = new THREE.Group();    // features (pushed out in fuzzy mode)
  scene.add(rig);
  rig.add(head);
  head.add(face);
  rig.position.y = -0.05;

  const FUR = { len: 0.11, density: new THREE.Vector2(280, 140), root: C.fur, tip: "#c4c8da" };
  const FUR_LIGHT = { len: 0.055, density: new THREE.Vector2(240, 120), root: C.light, tip: C.white };

  part(head, lumpy(1), C.fur, { scale: [1.2, 0.95, 1.0], ink: 0.035, fur: FUR });

  for (const side of [-1, 1]) {
    const ear = part(head, lumpy(0.62, 0.06), C.fur, { pos: [side * 1.15, 0.32, -0.18], scale: [1, 1, 0.6], ink: 0.035, fur: FUR });
    part(ear, sphere(0.4), C.light, { pos: [-side * 0.06, -0.06, 0.56], scale: [0.85, 0.95, 0.35], ink: 0, fur: FUR_LIGHT });
  }

  // Muzzle
  part(face, lumpy(0.5, 0.03), C.light, { pos: [0.06, -0.43, 0.68], scale: [1.25, 0.78, 0.75], ink: 0.03, fur: FUR_LIGHT });

  // Eyes (white → pupil → highlight)
  const eyes = [];
  for (const side of [-1, 1]) {
    const n = new THREE.Vector3(side * 0.33, 0.17, 0.93);
    const eye = new THREE.Group();
    eye.position.copy(n);
    faceOut(eye, new THREE.Vector3(side * 0.3, 0.16, 0.94).normalize());
    face.add(eye);
    part(eye, sphere(0.27), C.white, { scale: [0.78, 1.3, 0.45], ink: 0.05 });
    const pupil = new THREE.Group();
    eye.add(pupil);
    part(pupil, sphere(0.19), C.ink, { pos: [0, -0.03, 0.04], scale: [0.72, 1.18, 0.5], ink: 0 });
    part(pupil, sphere(0.045), C.white, { pos: [0.05, 0.1, 0.14], scale: [0.8, 1.2, 0.5], ink: 0 });
    eyes.push({ eye, pupil });
  }

  // Nose (big, glossy) + highlights
  part(face, sphere(0.3, 48), C.ink, { pos: [0.02, -0.12, 0.99], scale: [0.95, 1.3, 0.85], ink: 0.03 });
  part(face, sphere(0.05), C.white, { pos: [0.1, 0.1, 1.22], scale: [0.6, 1.5, 0.5], ink: 0 });
  part(face, sphere(0.026), C.white, { pos: [0.16, -0.06, 1.22], ink: 0 });

  // Mouth (little frown) + whisker dots
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 8, 24, Math.PI), new THREE.MeshBasicMaterial({ color: C.ink }));
  mouth.position.set(0.12, -0.66, 1.02);
  mouth.rotation.set(-0.45, 0.25, 0);
  face.add(mouth);
  const surfaceBits = [mouth]; // sit on the muzzle - lifted above the fur in fuzzy mode
  for (const [x, y, z] of [[0.46, -0.36, 0.98], [0.56, -0.44, 0.93], [0.44, -0.47, 0.99]]) {
    surfaceBits.push(part(face, sphere(0.024, 12), C.ink, { pos: [x, y, z], ink: 0 }));
  }
  surfaceBits.forEach((m) => (m.userData.z = m.position.z));

  // Cap - dome, brim, button, yellow patch
  const cap = new THREE.Group();
  cap.position.set(-0.12, 0.7, -0.12);
  cap.rotation.set(-0.3, 0.2, 0.28);
  cap.scale.setScalar(1.18);
  head.add(cap);
  part(cap, new THREE.SphereGeometry(0.7, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), C.green, { scale: [1, 0.74, 1], ink: 0.03 });
  const brim = part(cap, new THREE.CylinderGeometry(0.72, 0.72, 0.045, 48, 1, false, 0, Math.PI), C.green, { pos: [0.02, 0.01, 0], scale: [1.55, 1, 1], ink: 0.025 });
  brim.rotation.set(0.5, -0.5, 0.32);
  part(cap, sphere(0.07, 16), C.green, { pos: [0, 0.52, 0], ink: 0.02 });
  const patchN = new THREE.Vector3(0.38, 0.72, 0.5).normalize();
  const patch = part(cap, sphere(0.17, 24), C.yellow, { pos: [patchN.x * 0.69, patchN.y * 0.69 * 0.74, patchN.z * 0.69], scale: [1, 0.75, 0.18], ink: 0 });
  faceOut(patch, patchN);

  /* ---------- look switching ---------- */
  function setLook(next) {
    look = next;
    const fuzzy = look === "fuzzy";
    for (const f of furred) {
      f.mesh.material.visible = !fuzzy;   // shell 0 becomes the skin
      f.shells.forEach((s) => (s.visible = fuzzy));
    }
    for (const o of outlines) o.mesh.visible = fuzzy ? !o.fur : true;
    face.scale.setScalar(fuzzy ? 1.07 : 1); // lift features clear of the fur
    surfaceBits.forEach((m) => (m.position.z = m.userData.z + (fuzzy ? 0.06 : 0)));
    cap.position.y = fuzzy ? 0.78 : 0.7;
  }
  setLook(look);

  /* ---------- sizing ---------- */
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ---------- interaction + loop ---------- */
  const st = { x: 0, y: 0, tx: 0, ty: 0, last: 0, blinkAt: performance.now() + 1800, hop: -1, prevYaw: 0, prevPitch: 0, vy: 0 };

  const onPointer = (e) => {
    const r = container.getBoundingClientRect();
    st.tx = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5), -1, 1);
    st.ty = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (innerHeight * 0.5), -1, 1);
    st.last = performance.now();
  };
  const poke = () => { if (st.hop < 0) st.hop = 0; };
  if (interactive) {
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("pointerdown", onPointer, { passive: true });
    container.addEventListener("click", poke);
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(container);

  const drag = new THREE.Vector3();
  renderer.setAnimationLoop((now) => {
    if (!visible) return;

    if (now - st.last > 2500) {
      const t = now / 1000;
      st.tx = Math.sin(t * 0.6) * 0.45 + Math.sin(t * 1.7) * 0.1;
      st.ty = Math.sin(t * 0.45 + 1) * 0.25;
    }
    const k = reduce ? 1 : 0.08;
    st.x += (st.tx - st.x) * k;
    st.y += (st.ty - st.y) * k;

    const yaw = BASE_YAW + st.x * 0.6;
    const pitch = st.y * 0.32;
    head.rotation.set(pitch, yaw, -st.x * 0.06);

    // Pupils look a little further than the head turns
    for (const { pupil } of eyes) pupil.position.set(st.x * 0.06, -st.y * 0.06, 0);

    // Blink
    let closed = 0;
    if (!reduce && now >= st.blinkAt) {
      const t = (now - st.blinkAt) / 170;
      if (t >= 1) st.blinkAt = now + 2200 + Math.random() * 3200;
      else closed = Math.sin(t * Math.PI);
    }
    for (const { eye } of eyes) eye.scale.y = 1 - 0.9 * closed;

    // Hop: squash, jump, cap pops
    let hopY = 0, sq = 0, capPop = 0;
    if (st.hop >= 0) {
      st.hop += 0.04;
      const t = Math.min(st.hop, 1);
      hopY = Math.sin(t * Math.PI) * 0.45;
      sq = Math.sin(t * Math.PI * 2) * 0.08;
      capPop = Math.sin(Math.min(1, t * 1.25) * Math.PI) * 0.3;
      if (st.hop >= 1) st.hop = -1;
    }
    const bob = reduce ? 0 : Math.sin(now / 900) * 0.03;
    rig.position.y = -0.05 + hopY + bob;
    rig.scale.set(1 + sq, 1 - sq, 1 + sq);
    cap.position.y = (look === "fuzzy" ? 0.78 : 0.7) + capPop;

    // Fur lags behind motion
    if (look === "fuzzy") {
      const vy = hopY - st.vy;
      drag.set(-(yaw - st.prevYaw) * 6, -vy * 2.5 - (pitch - st.prevPitch) * 3, 0);
      for (const f of furred) for (const s of f.shells) s.material.uniforms.uDrag.value.lerp(drag, 0.25);
      st.vy = hopY;
    }
    st.prevYaw = yaw;
    st.prevPitch = pitch;

    renderer.render(scene, camera);
  });

  return {
    poke,
    setLook,
    destroy() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      removeEventListener("pointermove", onPointer);
      removeEventListener("pointerdown", onPointer);
      container.removeEventListener("click", poke);
      renderer.dispose();
      container.innerHTML = "";
    },
  };
}
