// Minimal three.js viewer: renderer, camera, orbit controls, studio lighting,
// with fit() to frame a unit and translucent parts.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Studio environment for the metals: a warm grey dome (light above, a lighter table below) with
 * softboxes above-left, to the right, in front and below the front (so the panel's chrome bats
 * and nuts catch a reflection) and a strip behind for rim highlights. Chrome and aluminium take
 * their look almost entirely from what they reflect. (From the Leibniz simulator's viewer.)
 * @returns {THREE.Scene}
 */
function studioEnvironment() {
  const env = new THREE.Scene();
  const dome = new THREE.SphereGeometry(10, 32, 16);
  const pos = dome.getAttribute("position");
  /** @type {number[]} */
  const colours = [];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i) / 10; // -1 (floor) .. 1 (top)
    const v = h >= 0 ? 0.38 + 0.32 * h : 0.38 - 0.16 * h * h; // a mid-grey table below, not a black floor
    c.setRGB(v * 1.04, v, v * 0.92);
    colours.push(c.r, c.g, c.b);
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  env.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
  /**
   * @param {number} w
   * @param {number} h
   * @param {number} intensity
   * @param {[number, number, number]} p
   */
  const box = (w, h, intensity, p) => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    m.color.setScalar(intensity);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    b.position.set(...p);
    b.lookAt(0, 0, 0);
    env.add(b);
  };
  box(5, 3, 9, [-3, 6, 3]); // key, above left
  box(1.2, 5, 6, [6, 2.5, 1]); // strip, right
  box(8, 2.5, 4, [0, 1.5, 7]); // front fill, low
  box(6, 2, 2.2, [1, -2.5, 6]); // bounce card below the front, for the vertical brass faces
  box(8, 1, 3, [0, 3, -6]); // rim, behind
  return env;
}

/** Parts smaller than this (bounding-sphere radius, m) do not cast shadows: LEDs, leads, pins. */
const SHADOW_MIN_RADIUS = 0.004;
/** Below this frame rate while animating, "auto" quality drops to "lite" (once). */
const LITE_BELOW_FPS = 25;

/** @typedef {"high" | "lite"} Quality */

export class Viewer {
  /**
   * @readonly
   * @type {THREE.WebGLRenderer}
   */
  renderer;
  /**
   * Render only when something changed (invalidate()), not 60 times a second: an idle page
   * then costs nothing.
   */
  renderOnDemand = false;
  /**
   * "auto" starts high and drops to lite when animation runs slowly.
   * @type {Quality | "auto"}
   */
  qualityMode = "auto";
  /** @type {Quality} */
  quality = "high";
  /** Frames actually rendered (for ?perf). */
  renderedFrames = 0;
  /** @private */
  dirty = true;
  /** @private */
  sceneDirty = true;
  /**
   * @private
   * @type {number[]}
   */
  slowFrames = [];
  /** @private */
  lastRender = 0;
  /** @type {((q: Quality) => void) | null} */
  onQualityChange = null;
  /** @readonly */
  scene = new THREE.Scene();
  /**
   * @readonly
   * @type {THREE.PerspectiveCamera}
   */
  camera;
  /**
   * @readonly
   * @type {OrbitControls}
   */
  controls;
  /**
   * @private
   * @type {((dt: number) => void)[]}
   */
  onFrame = [];
  /**
   * @private
   * @type {THREE.DirectionalLight}
   */
  key;
  /** @private */
  timer = new THREE.Timer();

  /**
   * @private
   * @type {HTMLElement}
   */
  host;

  /**
   * @param {HTMLElement} host
   * @param {{ transparent?: boolean }} [options] transparent: no background of its own, so the
   *   page's shows through (the main page's dark stage); the developer pages keep the light grey.
   */
  constructor(host, options = {}) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!options.transparent });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Neutral keeps the hue of brass (ACES pushes yellows towards olive)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    host.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const studio = studioEnvironment();
    this.scene.environment = pmrem.fromScene(studio, 0.02).texture;
    // only the environment map is kept: free the generator and the studio it was rendered from
    pmrem.dispose();
    studio.traverse((o) => {
      const m = /** @type {THREE.Mesh} */ (o);
      if (!m.isMesh) return;
      m.geometry.dispose();
      /** @type {THREE.Material} */ (m.material).dispose();
    });
    this.scene.background = options.transparent ? null : new THREE.Color(0xe9e7e2);

    const key = new THREE.DirectionalLight(0xfff4e6, 1.2);
    key.position.set(0.25, 0.45, 0.3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.05;
    key.shadow.camera.far = 2.5;
    Object.assign(key.shadow.camera, { left: -0.35, right: 0.35, top: 0.35, bottom: -0.35 });
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    this.key = key;

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.005, 20);
    this.camera.position.set(0.18, 0.2, 0.95);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.09, 0.2);
    this.controls.enableDamping = true;

    this.controls.addEventListener("change", () => this.invalidate(false));
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.timer.connect(document);
    this.renderer.setAnimationLoop((time) => this.tick(time));
  }

  /**
   * Fit the key light's shadow box around a model of the given half-size (metres) centred at c.
   * @param {number} half
   * @param {THREE.Vector3Like} [c]
   * @returns {void}
   */
  setShadowExtent(half, c = { x: 0, y: 0, z: 0 }) {
    const cam = this.key.shadow.camera;
    Object.assign(cam, { left: -half, right: half, top: half, bottom: -half, far: 4 * half + 1 });
    this.key.position.set(c.x + half * 0.7, c.y + half * 1.3, c.z + half * 0.9);
    this.key.target.position.set(c.x, c.y, c.z);
    this.scene.add(this.key.target);
    cam.updateProjectionMatrix();
  }

  /**
   * @param {string} url
   * @param {(fraction: number) => void} [onProgress] the share of the file loaded so far
   * @returns {Promise<THREE.Group>}
   */
  async load(url, onProgress) {
    const gltf = await new GLTFLoader().loadAsync(url, (e) => onProgress?.(e.total ? e.loaded / e.total : 0));
    gltf.scene.traverse((o) => {
      const m = /** @type {THREE.Mesh} */ (o);
      if (!m.isMesh) return;
      m.geometry.computeBoundingSphere();
      m.castShadow = (m.geometry.boundingSphere?.radius ?? 1) >= SHADOW_MIN_RADIUS;
      m.receiveShadow = true;
      // Parts marked translucent by the build (the warp sheets) let the parts behind show.
      let p = /** @type {THREE.Object3D | null} */ (m);
      while (p && !p.userData.translucent) p = p.parent;
      if (p) {
        const mats = /** @type {THREE.MeshStandardMaterial[]} */ ([]).concat(/** @type {THREE.MeshStandardMaterial} */ (m.material));
        const opacity = typeof p.userData.opacity === "number" ? p.userData.opacity : 0.28;
        for (const mt of mats) Object.assign(mt, { transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
        m.castShadow = false;
        m.receiveShadow = false;
        m.renderOrder = 1;
      }
    });
    this.scene.add(gltf.scene);
    this.invalidate();
    return gltf.scene;
  }

  /**
   * Ask for a new frame (render-on-demand). sceneChanged = false for camera-only changes:
   * the shadow map is then reused, since the light and the parts did not move.
   * @returns {void}
   */
  invalidate(sceneChanged = true) {
    this.dirty = true;
    if (sceneChanged) this.sceneDirty = true;
  }

  /**
   * Shadows on or off and the pixel ratio: "lite" for weak devices.
   * @param {Quality} q
   * @returns {void}
   */
  setQuality(q) {
    if (q === this.quality) return;
    this.quality = q;
    this.renderer.shadowMap.enabled = q === "high";
    this.key.castShadow = q === "high";
    this.renderer.setPixelRatio(q === "high" ? Math.min(window.devicePixelRatio, 2) : 1);
    this.scene.traverse((o) => {
      const mats = (/** @type {THREE.Mesh} */ (o)).isMesh ? (/** @type {THREE.Material[]} */ ([])).concat((/** @type {THREE.Mesh} */ (o)).material) : [];
      for (const mt of mats) mt.needsUpdate = true; // shaders change with shadows on/off
    });
    this.resize();
    this.invalidate();
    this.onQualityChange?.(q);
  }

  /**
   * @param {(dt: number) => void} cb
   * @returns {void}
   */
  addFrameCallback(cb) {
    this.onFrame.push(cb);
  }

  /**
   * Smoothly move the camera to look at target from position (metres).
   * @param {THREE.Vector3Like} position
   * @param {THREE.Vector3Like} target
   * @returns {void}
   */
  flyTo(position, target, seconds = 0.8) {
    // A new flight replaces one under way, from wherever the camera is now.
    if (this.flight) this.endFlight(this.flight);
    const p0 = this.camera.position.clone();
    const t0 = this.controls.target.clone();
    const p1 = new THREE.Vector3().copy(position);
    const t1 = new THREE.Vector3().copy(target);
    let t = 0;
    /** @param {number} dt */
    const step = (dt) => {
      t = Math.min(1, t + dt / seconds);
      const e = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(p0, p1, e);
      this.controls.target.lerpVectors(t0, t1, e);
      this.invalidate(false);
      if (t >= 1) this.endFlight(step);
    };
    this.flight = step;
    this.onFrame.push(step);
  }

  /**
   * Take a flight's frame callback off, once (a flight replaced in the frame it ends in is gone).
   * @private
   * @param {(dt: number) => void} step
   */
  endFlight(step) {
    const i = this.onFrame.indexOf(step);
    if (i >= 0) this.onFrame.splice(i, 1);
    if (this.flight === step) this.flight = null;
  }

  /**
   * Frames an object: the camera looks at its centre from the given direction (a three.js
   * vector, need not be unit), far enough back to see all of it, and the shadows fit it.
   * @param {THREE.Object3D | THREE.Object3D[]} object one object, or several to frame together
   * @param {THREE.Vector3Like} [from]
   * @param {boolean} [fly] move there smoothly rather than at once
   * @returns {void}
   */
  fit(object, from = { x: 0.6, y: 0.35, z: 1 }, fly = false) {
    // Only what is shown counts (the card pool keeps hidden cards at the origin).
    const box = new THREE.Box3();
    for (const o of /** @type {THREE.Object3D[]} */ ([]).concat(object)) {
      o.updateWorldMatrix(true, true);
      o.traverseVisible((m) => {
        if (/** @type {THREE.Mesh} */ (m).isMesh) box.union(new THREE.Box3().setFromObject(m, false));
      });
    }
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dir = new THREE.Vector3().copy(from).normalize();
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const dist = (sphere.radius / Math.sin(fov / 2)) * (this.camera.aspect < 1 ? 1 / Math.max(0.45, this.camera.aspect) : 1) * 1.05;
    const pos = sphere.center.clone().addScaledVector(dir, dist);
    this.camera.near = Math.max(0.001, dist / 200);
    this.camera.far = dist * 20;
    this.camera.updateProjectionMatrix();
    this.setShadowExtent(sphere.radius * 1.2, sphere.center);
    if (fly) this.flyTo(pos, sphere.center);
    else {
      if (this.flight) this.endFlight(this.flight);
      this.camera.position.copy(pos);
      this.controls.target.copy(sphere.center);
      this.controls.update();
      this.invalidate();
    }
  }

  /**
   * @private
   * @returns {void}
   */
  resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    for (const cb of this.onResize) cb(w, h);
    this.invalidate(false);
  }

  /**
   * Called after the canvas changed size (and the camera's aspect with it).
   * @type {((width: number, height: number) => void)[]}
   */
  onResize = [];

  /**
   * The camera flight under way, if any.
   * @private
   * @type {((dt: number) => void) | null}
   */
  flight = null;

  /** @returns {boolean} true while the camera flies to a view */
  get isFlying() {
    return this.flight !== null;
  }

  /**
   * @private
   * @param {number} time
   * @returns {void}
   */
  tick(time) {
    this.timer.update(time);
    // Clamp to 0..0.1 s: after a visibility change the timer can report a negative delta,
    // which would run animations backwards (an Add turned into a subtraction).
    const dt = Math.max(0, Math.min(0.1, this.timer.getDelta()));
    for (const cb of [...this.onFrame]) cb(dt);
    this.controls.update();
    if (!this.renderOnDemand) {
      this.draw(time);
      return;
    }
    if (!this.dirty) {
      this.lastRender = 0; // an idle gap is not a slow frame
      return;
    }
    // The shadow map only needs redrawing when parts moved, not when the camera did.
    this.renderer.shadowMap.autoUpdate = false;
    if (this.sceneDirty) this.renderer.shadowMap.needsUpdate = true;
    this.dirty = false;
    this.sceneDirty = false;
    this.draw(time);
  }

  /**
   * @private
   * @param {number} time
   * @returns {void}
   */
  draw(time) {
    this.renderer.render(this.scene, this.camera);
    this.renderedFrames++;
    // Auto quality: watch back-to-back frames (animation, orbiting); if they are slow,
    // drop shadows and the pixel ratio once.
    if (this.qualityMode === "auto" && this.quality === "high" && this.lastRender > 0) {
      this.slowFrames.push(time - this.lastRender);
      if (this.slowFrames.length > 60) this.slowFrames.shift();
      const avg = this.slowFrames.reduce((a, b) => a + b, 0) / this.slowFrames.length;
      if (this.slowFrames.length === 60 && avg > 1000 / LITE_BELOW_FPS) this.setQuality("lite");
    }
    this.lastRender = time;
  }
}
