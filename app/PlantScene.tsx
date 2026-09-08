import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
type Props = {
  growth: number;
  goal: number;
  day: boolean;
  selected: number;
  onSelect: (i: number) => void;
  reduced: boolean;
  resetKey: number;
  menu?: boolean;
  visible?: boolean;
};
export default function PlantScene(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    live = useRef(props);
  live.current = props;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let r: T.WebGLRenderer;
    try {
      r = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    r.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFShadowMap;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    r.outputColorSpace = T.SRGBColorSpace;
    el.appendChild(r.domElement);
    r.domElement.setAttribute(
      'aria-label',
      '3D greenhouse with your growing tomato plant. Drag to look around. Select a leaf to enter its cells.',
    );
    const scene = new T.Scene();
    scene.background = null;
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 90);
    camera.position.set(7, 6.3, 12);
    const controls = new OrbitControls(camera, r.domElement);
    controls.target.set(0, 2.8, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 18;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.4;
    controls.minAzimuthAngle = -1.2;
    controls.maxAzimuthAngle = 1.2;
    scene.add(new T.HemisphereLight('#d6ebee', '#3d4831', 2.5));
    const sun = new T.DirectionalLight('#fff0be', 4.2);
    sun.position.set(-7, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.normalBias = 0.03;
    scene.add(sun);
    const rim = new T.DirectionalLight('#c8e9eb', 1.2);
    rim.position.set(8, 6, -7);
    scene.add(rim);
    const mat = (c: string, rough = 0.8) =>
      new T.MeshStandardMaterial({ color: c, roughness: rough });
    const earth = mat('#433a2b'),
      leafMat = mat('#4c853e', 0.6),
      veinMat = mat('#9caf64');
    leafMat.side = T.DoubleSide;
    const sphere = new T.SphereGeometry(1, 22, 14);
    const cyl = new T.CylinderGeometry(1, 1, 1, 24);
    const cube = new T.BoxGeometry(1, 1, 1);
    const leaves: T.Object3D[] = [];
    const leafTargets: T.Object3D[] = [];
    const root = new T.Group();
    scene.add(root);
    function mesh(
      g: T.BufferGeometry,
      m: T.Material,
      p: number[],
      sc: number[],
      parent: T.Object3D = scene,
    ) {
      const a = new T.Mesh(g, m);
      a.position.set(...(p as [number, number, number]));
      a.scale.set(...(sc as [number, number, number]));
      a.castShadow = true;
      a.receiveShadow = true;
      parent.add(a);
      return a;
    }
    function tube(
      points: number[][],
      radius: number,
      m: T.Material,
      parent: T.Object3D = scene,
    ) {
      return mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(
            points.map(
              (p) => new T.Vector3(...(p as [number, number, number])),
            ),
          ),
          24,
          radius,
          7,
          false,
        ),
        m,
        [0, 0, 0],
        [1, 1, 1],
        parent,
      );
    }
    function pot(
      x: number,
      z: number,
      size: number,
      parent: T.Object3D = scene,
    ) {
      const profile = [
        new T.Vector2(0.62, 0),
        new T.Vector2(0.68, 0.1),
        new T.Vector2(0.94, 1.32),
        new T.Vector2(1.02, 1.34),
        new T.Vector2(1.02, 1.49),
        new T.Vector2(0.9, 1.5),
        new T.Vector2(0.88, 1.31),
        new T.Vector2(0.69, 0.16),
      ];
      const group = new T.Group();
      group.position.set(x, 0.46, z);
      group.scale.setScalar(size);
      parent.add(group);
      mesh(
        new T.LatheGeometry(profile, 48),
        mat('#b9815d'),
        [0, 0, 0],
        [1, 1, 1],
        group,
      );
      mesh(cyl, earth, [0, 1.28, 0], [0.875, 0.08, 0.875], group);
      for (let i = 0; i < 90; i++) {
        const a = i * 2.399,
          rad = 0.83 * Math.sqrt((i + 0.5) / 90);
        mesh(
          sphere,
          mat(i % 3 ? '#5b4933' : '#c0b497'),
          [Math.cos(a) * rad, 1.34, Math.sin(a) * rad],
          [0.025 + (i % 4) * 0.009, 0.015, 0.025],
          group,
        );
      }
      return group;
    }
    pot(0, 0, 1);
    const plant = new T.Group();
    plant.position.y = 1.8;
    root.add(plant);
    const stemMat = mat('#719449');
    tube(
      [
        [0, 0, 0],
        [-0.1, 1, 0],
        [0.12, 2.1, -0.1],
        [0, 3.5, 0],
      ],
      0.045,
      stemMat,
      plant,
    );
    function leaf(length: number, width: number) {
      const vertices = [],
        uv = [],
        indices = [];
      const n = 20;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const w = Math.sin(Math.PI * t) * width * (1 + 0.12 * Math.sin(t * 35));
        for (let side = -1; side <= 1; side++) {
          vertices.push(
            t * length,
            Math.sin(t * Math.PI) * 0.14 + Math.abs(side) * w * 0.16,
            side * w,
          );
          uv.push(t, (side + 1) / 2);
        }
      }
      for (let i = 0; i < n; i++)
        for (let j = 0; j < 2; j++) {
          const a = i * 3 + j;
          indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
        }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.setIndex(indices);
      g.computeVertexNormals();
      return g;
    }
    const primary: T.Group[] = [];
    for (let i = 0; i < 9; i++) {
      const g = new T.Group();
      g.position.set(0, 0.4 + i * 0.34, 0);
      g.rotation.y = i * 2.4;
      g.rotation.z = 0.25 + (i % 3) * 0.1;
      plant.add(g);
      const len = 1.35 - (i % 3) * 0.12;
      const blade = mesh(leaf(len, 0.43), leafMat, [0.3, 0, 0], [1, 1, 1], g);
      tube(
        [
          [0, 0, 0],
          [0.45, 0.06, 0],
          [len + 0.3, 0.01, 0],
        ],
        0.012,
        veinMat,
        g,
      );
      for (let j = 1; j < 7; j++) {
        const x = (j / 7) * len,
          w = Math.sin((j / 7) * Math.PI) * 0.43;
        for (const side of [-1, 1])
          tube(
            [
              [0.3 + x, 0.1, 0],
              [0.3 + x + 0.12, 0.12, side * w * 0.8],
            ],
            0.004,
            veinMat,
            g,
          );
      }
      blade.userData.cell = i % 3;
      leafTargets.push(blade);
      leaves.push(g);
      if (i < 3) primary.push(g);
    }
    // Flowers and ripening tomatoes emerge as the cells contribute to growth.
    const flowers = new T.Group(),
      fruits = new T.Group();
    plant.add(flowers, fruits);
    const fruitMats: T.MeshStandardMaterial[] = [];
    for (let i = 0; i < 3; i++) {
      const g = new T.Group();
      g.position.set(
        0.55 * Math.cos(i * 2.5),
        1.7 + i * 0.35,
        0.6 * Math.sin(i * 2.5),
      );
      flowers.add(g);
      for (let j = 0; j < 5; j++) {
        const petal = mesh(
          sphere,
          mat('#ead477'),
          [Math.cos(j * 1.256) * 0.11, 0, Math.sin(j * 1.256) * 0.11],
          [0.12, 0.025, 0.06],
          g,
        );
        petal.rotation.y = -j * 1.256;
      }
      mesh(sphere, mat('#d4a640'), [0, 0.03, 0], [0.05, 0.04, 0.05], g);
      const f = new T.Group();
      f.position.copy(g.position);
      f.position.y -= 0.24;
      fruits.add(f);
      const m = mat('#d2633f', 0.35);
      fruitMats.push(m);
      mesh(sphere, m, [0, 0, 0], [0.27, 0.25, 0.26], f);
      tube(
        [
          [0, 0.28, 0],
          [0.02, 0.4, -0.06],
          [-0.3, 0.5, 0],
        ],
        0.015,
        stemMat,
        f,
      );
      for (let j = 0; j < 5; j++) {
        const sepal = mesh(
          leaf(0.18, 0.045),
          leafMat,
          [0, 0.22, 0],
          [1, 1, 1],
          f,
        );
        sepal.rotation.y = j * 1.256;
      }
    }
    // A handwritten plant label.
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 128;
    const cx = labelCanvas.getContext('2d')!;
    cx.fillStyle = '#e0d6ad';
    cx.fillRect(0, 0, 256, 128);
    cx.fillStyle = '#435b43';
    cx.font = 'bold 32px serif';
    cx.fillText('SOLANUM', 35, 53);
    cx.font = '20px serif';
    cx.fillText('your first harvest', 38, 85);
    const labelTex = new T.CanvasTexture(labelCanvas);
    mesh(cube, mat('#b9a780'), [-1.15, 1, 1], [0.05, 1.1, 0.05]);
    const label = mesh(
      new T.PlaneGeometry(0.95, 0.47),
      new T.MeshStandardMaterial({
        map: labelTex,
        roughness: 1,
        side: T.DoubleSide,
      }),
      [-1.15, 1.53, 1],
      [1, 1, 1],
    );
    label.rotation.y = 0.3;
    const motes = new T.BufferGeometry();
    const pos = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) {
      pos[i * 3] = Math.sin(i * 23) * 9;
      pos[i * 3 + 1] = 1 + (i % 30) * 0.2;
      pos[i * 3 + 2] = Math.cos(i * 3) * 8;
    }
    motes.setAttribute('position', new T.BufferAttribute(pos, 3));
    const dust = new T.Points(
      motes,
      new T.PointsMaterial({
        color: '#fff1c2',
        size: 0.025,
        transparent: true,
        opacity: 0.65,
      }),
    );
    scene.add(dust);
    const selectHalo = mesh(
      new T.TorusGeometry(0.17, 0.012, 8, 32),
      new T.MeshBasicMaterial({
        color: '#f9ecb0',
        depthTest: false,
        transparent: true,
        opacity: 0.8,
      }),
      [0, 0, 0],
      [1, 1, 1],
    );
    selectHalo.renderOrder = 10;
    const ray = new T.Raycaster();
    const mouse = new T.Vector2();
    let down = [0, 0];
    const pd = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const pu = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const b = el.getBoundingClientRect();
      mouse.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        (-(e.clientY - b.top) / b.height) * 2 + 1,
      );
      ray.setFromCamera(mouse, camera);
      const h = ray.intersectObjects(leafTargets);
      if (h[0]) live.current.onSelect(h[0].object.userData.cell);
    };
    r.domElement.addEventListener('pointerdown', pd);
    r.domElement.addEventListener('pointerup', pu);
    const size = () => {
      r.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();
    let frame = 0,
      lastReset = live.current.resetKey;
    const start = performance.now();
    function draw() {
      frame = requestAnimationFrame(draw);
      if (document.hidden || live.current.visible === false) return;
      const p = live.current;
      const t = (performance.now() - start) / 1000;
      const f = Math.min(1, p.growth / p.goal);
      plant.scale.setScalar(0.52 + 0.48 * f);
      leaves.forEach((g, i) => {
        const scale =
          i < 3 ? 1 : Math.max(0.01, Math.min(1, (f - (i - 3) * 0.1) * 3));
        g.scale.setScalar(scale);
        if (!p.reduced) g.rotation.x = Math.sin(t * 0.8 + i) * 0.035;
      });
      flowers.scale.setScalar(Math.max(0.001, Math.min(1, (f - 0.48) * 4)));
      fruits.scale.setScalar(Math.max(0.001, Math.min(1, (f - 0.72) * 4)));
      fruitMats.forEach((m) =>
        m.color.setHSL(0.23 * (1 - Math.max(0, (f - 0.8) / 0.2)), 0.6, 0.46),
      );
      el.style.filter = p.day ? 'none' : 'brightness(.65) saturate(.65)';
      sun.intensity = T.MathUtils.lerp(sun.intensity, p.day ? 4.2 : 0.5, 0.025);
      if (!p.reduced) {
        dust.rotation.y = t * 0.009;
        plant.rotation.z = Math.sin(t * 0.5) * 0.006;
      }
      const target = primary[p.selected];
      target.updateWorldMatrix(true, false);
      selectHalo.position.copy(target.localToWorld(new T.Vector3(0.9, 0.2, 0)));
      selectHalo.quaternion.copy(camera.quaternion);
      selectHalo.visible = !p.menu;
      if (lastReset !== p.resetKey) {
        camera.position.set(7, 6.3, 12);
        controls.target.set(0, 2.8, 0);
        lastReset = p.resetKey;
      }
      controls.update();
      r.render(scene, camera);
    }
    draw();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      r.domElement.removeEventListener('pointerdown', pd);
      r.domElement.removeEventListener('pointerup', pu);
      scene.traverse((o) => {
        const m = o as T.Mesh;
        m.geometry?.dispose();
        if (m.material)
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
            x.dispose(),
          );
      });
      labelTex.dispose();
      r.dispose();
      el.replaceChildren();
    };
  }, []);
  return (
    <div className={`greenhouse-art ${props.day ? '' : 'night-art'}`}>
      <div ref={host} className="plant-scene">
        {failed && (
          <div className="fallback">
            <h2>Your greenhouse</h2>
            <p>
              This device cannot display 3D. Use the leaf-cell controls to keep
              growing your plant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
