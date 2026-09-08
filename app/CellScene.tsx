import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

type Props = {
  selected: string;
  onSelect: (p: string) => void;
  water: number;
  growth: number;
  daylight: boolean;
  reduced: boolean;
  resetKey: number;
  active: boolean;
};
export default function CellScene(props: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const host = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x071c20, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D plant cell. Drag to orbit, scroll to zoom. Use the structure buttons for keyboard access.',
    );
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 10, 12.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 22;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = 1.3;
    controls.target.set(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xb9e6d5, 1.5));
    const sun = new THREE.DirectionalLight(0xffedd5, 4);
    sun.position.set(-5, 10, 5);
    scene.add(sun);
    const fill = new THREE.PointLight(0x62dbdc, 25, 20);
    fill.position.set(5, 3, -3);
    scene.add(fill);
    const cell = new THREE.Group();
    scene.add(cell);
    const meshes: THREE.Object3D[] = [];
    const animated: THREE.Group[] = [];
    const material = (color: string, roughness = 0.32, metalness = 0.05) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    function add(
      g: THREE.BufferGeometry,
      m: THREE.Material,
      pos: number[],
      scale: number[],
      parent: THREE.Object3D = cell,
      name?: string,
    ) {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      parent.add(mesh);
      if (name) {
        mesh.userData.part = name;
        meshes.push(mesh);
      }
      return mesh;
    }
    const sphere = new THREE.SphereGeometry(1, 32, 20);
    // Rounded cell cross-section: wall outside the separate membrane.
    function outline(w: number, h: number, r: number) {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2);
      s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r);
      s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2);
      s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r);
      s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    }
    const outer = outline(10.4, 7.2, 2);
    const inner = outline(9.95, 6.75, 1.8);
    outer.holes.push(new THREE.Path(inner.getPoints()));
    const wall = add(
      new THREE.ExtrudeGeometry(outer, {
        depth: 0.7,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1,
      }),
      new THREE.MeshPhysicalMaterial({
        color: '#89b976',
        roughness: 0.18,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        clearcoat: 1,
        side: THREE.DoubleSide,
      }),
      [0, -0.58, 0],
      [1, 1, 1],
      cell,
      'wall',
    );
    wall.rotation.x = -Math.PI / 2;
    const mem = outline(9.9, 6.7, 1.8);
    mem.holes.push(new THREE.Path(outline(9.76, 6.56, 1.72).getPoints()));
    const membrane = add(
      new THREE.ExtrudeGeometry(mem, { depth: 0.72, bevelEnabled: false }),
      new THREE.MeshStandardMaterial({
        color: '#84e5b6',
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
      }),
      [0, -0.47, 0],
      [1, 1, 1],
      cell,
      'membrane',
    );
    membrane.rotation.x = -Math.PI / 2;
    const base = add(
      new THREE.ShapeGeometry(outline(9.75, 6.55, 1.7)),
      new THREE.MeshStandardMaterial({
        color: '#326c59',
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        roughness: 0.4,
      }),
      [0, -0.4, 0],
      [1, 1, 1],
      cell,
      'cytoplasm',
    );
    base.rotation.x = -Math.PI / 2;
    const vac = add(
      sphere,
      new THREE.MeshPhysicalMaterial({
        color: '#59afbe',
        transparent: true,
        opacity: 0.64,
        roughness: 0.19,
        metalness: 0.05,
        clearcoat: 1,
        side: THREE.FrontSide,
      }),
      [0.8, 0.2, 0.15],
      [2.8, 0.85, 2.13],
      cell,
      'vacuole',
    );
    const vacCore = add(
      sphere,
      new THREE.MeshBasicMaterial({
        color: '#90e2dd',
        transparent: true,
        opacity: 0.12,
      }),
      [0.8, 0.22, 0.15],
      [2.61, 0.72, 1.99],
    );
    const nuc = new THREE.Group();
    nuc.position.set(-2.7, 0.33, 0.5);
    cell.add(nuc);
    add(
      sphere,
      new THREE.MeshPhysicalMaterial({
        color: '#a98abf',
        roughness: 0.26,
        clearcoat: 1,
      }),
      [0, 0, 0],
      [1.03, 0.79, 1.03],
      nuc,
      'nucleus',
    );
    add(
      sphere,
      material('#6e487b'),
      [0.08, 0.68, 0.06],
      [0.36, 0.2, 0.36],
      nuc,
      'nucleus',
    );
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      add(
        sphere,
        material('#cbb0e0'),
        [Math.cos(a) * 0.9, 0.2, Math.sin(a) * 0.9],
        [0.065, 0.065, 0.065],
        nuc,
        'nucleus',
      );
    }
    const chloros = [
      [-3.5, -1.55, 0.35],
      [-1.35, -2.38, -0.1],
      [1.15, -2.5, 0.2],
      [3.6, -1.7, -0.55],
      [3.75, 1.65, 0.4],
      [-1.6, 2.45, -0.2],
    ];
    chloros.forEach(([x, z, a]) => {
      const g = new THREE.Group();
      g.position.set(x, 0.1, z);
      g.rotation.y = a;
      cell.add(g);
      animated.push(g);
      add(
        sphere,
        new THREE.MeshPhysicalMaterial({
          color: '#4c9b51',
          roughness: 0.22,
          transparent: true,
          opacity: 0.8,
          clearcoat: 1,
        }),
        [0, 0, 0],
        [0.77, 0.35, 0.43],
        g,
        'chloroplast',
      );
      for (let i = -1; i <= 1; i++)
        for (let j = 0; j < 3; j++)
          add(
            new THREE.CylinderGeometry(0.19, 0.19, 0.047, 16),
            material(j === 2 ? '#c2e986' : '#3d7842'),
            [i * 0.4, 0.24 + j * 0.055, 0],
            [1, 1, 1],
            g,
            'chloroplast',
          );
    });
    [
      [-3.7, 1.9, 0.7],
      [0.6, 2.55, -0.2],
      [3.9, -0.2, 1.1],
      [-3.25, -0.5, 0.3],
    ].forEach(([x, z, a]) => {
      const g = new THREE.Group();
      g.position.set(x, 0.11, z);
      g.rotation.y = a;
      cell.add(g);
      animated.push(g);
      add(
        sphere,
        material('#d18e61'),
        [0, 0, 0],
        [0.56, 0.27, 0.31],
        g,
        'mitochondrion',
      );
      const pts = [];
      for (let i = 0; i < 16; i++)
        pts.push(
          new THREE.Vector3(-0.42 + i * 0.056, 0.245, Math.sin(i * 1.4) * 0.14),
        );
      add(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts),
          40,
          0.03,
          6,
          false,
        ),
        material('#ffe1a6'),
        [0, 0, 0],
        [1, 1, 1],
        g,
        'mitochondrion',
      );
    });
    // Folded membranes around the nucleus, vesicles and cytoplasmic strands add living detail.
    for (let j = 0; j < 5; j++) {
      const pts = [];
      for (let i = 0; i < 25; i++) {
        const a = -1.2 + (i / 24) * 2.3;
        const rad = 1.13 + j * 0.13;
        pts.push(
          new THREE.Vector3(
            -2.7 + Math.cos(a) * rad * 0.85,
            -0.12 + j * 0.065,
            0.5 + Math.sin(a) * rad,
          ),
        );
      }
      add(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts),
          40,
          0.045,
          7,
          false,
        ),
        new THREE.MeshStandardMaterial({ color: '#9f879f', roughness: 0.45 }),
        [0, 0, 0],
        [1, 1, 1],
        cell,
        'cytoplasm',
      );
    }
    for (let j = 0; j < 26; j++) {
      const a = j * 2.399;
      add(
        sphere,
        new THREE.MeshPhysicalMaterial({
          color: j % 3 ? '#8ec4a0' : '#dfa28b',
          transparent: true,
          opacity: 0.36,
          roughness: 0.1,
          clearcoat: 1,
        }),
        [
          Math.cos(a) * (3.1 + (j % 3) * 0.4),
          0.1 + (j % 4) * 0.035,
          Math.sin(a) * (2 + (j % 2) * 0.2),
        ],
        [0.07, 0.065, 0.07],
        cell,
        'cytoplasm',
      );
    }
    const streaming = new THREE.Group();
    cell.add(streaming);
    for (let j = 0; j < 45; j++) {
      const a = (j / 45) * Math.PI * 2;
      add(
        sphere,
        new THREE.MeshBasicMaterial({
          color: '#d2edbb',
          transparent: true,
          opacity: 0.55,
        }),
        [Math.cos(a) * 3.5, 0.08, Math.sin(a) * 2.45],
        [0.022, 0.022, 0.022],
        streaming,
      );
    }
    // A few ribosome-scale dots; a model, not literal molecular scale.
    for (let i = 0; i < 55; i++) {
      const a = i * 2.399;
      const radius = 3.05 + (i % 5) * 0.25;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius * 0.65;
      add(
        sphere,
        material('#b2cabb'),
        [x, -0.1, z],
        [0.035, 0.035, 0.035],
        cell,
        'cytoplasm',
      );
    }
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) {
      positions[i * 3] = Math.sin(i * 12.32) * 8;
      positions[i * 3 + 1] = Math.cos(i * 7.2) * 2 - 1;
      positions[i * 3 + 2] = Math.sin(i * 3.12) * 6;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(
      particles,
      new THREE.PointsMaterial({
        size: 0.035,
        color: '#9ce1bd',
        transparent: true,
        opacity: 0.4,
      }),
    );
    scene.add(dust);
    const ring = add(
      new THREE.TorusGeometry(1, 0.018, 8, 80),
      new THREE.MeshBasicMaterial({
        color: '#e4ffc4',
        transparent: true,
        opacity: 0.8,
      }),
      [0, 0.9, 0],
      [1, 1, 1],
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    const targets: Record<string, number[]> = {
      nucleus: [-2.7, 1.15, 0.5, 1.18],
      vacuole: [0.8, 1.1, 0.15, 2.7],
      chloroplast: [-3.5, 0.6, -1.55, 0.91],
      mitochondrion: [0.6, 0.56, 2.55, 0.68],
      wall: [0, 0.7, 0, 5.2],
      membrane: [0, 0.6, 0, 4.9],
      cytoplasm: [0, -0.15, 0, 3.6],
    };
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = [0, 0];
    const downFn = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const upFn = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const b = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        (-(e.clientY - b.top) / b.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hits = ray.intersectObjects(meshes);
      if (hits[0]) live.current.onSelect(hits[0].object.userData.part);
    };
    renderer.domElement.addEventListener('pointerdown', downFn);
    renderer.domElement.addEventListener('pointerup', upFn);
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    let frame = 0,
      lastReset = live.current.resetKey;
    const startTime = performance.now();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (document.hidden) return;
      const t = (performance.now() - startTime) / 1000;
      const p = live.current;
      if (p.resetKey !== lastReset) {
        camera.position.set(0, 10, 12.6);
        controls.target.set(0, 0, 0);
        lastReset = p.resetKey;
      }
      const growthScale = 1 + Math.min(p.growth / 340, 1) * 0.1;
      cell.scale.setScalar(growthScale);
      const waterScale = 0.8 + Math.min(p.water / 110, 1) * 0.2;
      vac.scale.set(2.8 * waterScale, 0.85 * waterScale, 2.13 * waterScale);
      vacCore.scale.set(
        2.61 * waterScale,
        0.72 * waterScale,
        1.99 * waterScale,
      );
      sun.intensity = THREE.MathUtils.lerp(
        sun.intensity,
        p.daylight ? 4 : 1.3,
        0.02,
      );
      if (!p.reduced) {
        dust.rotation.y = t * 0.012;
        streaming.rotation.y = Math.sin(t * 0.1) * 0.15;
        animated.forEach(
          (g, i) => (g.position.y = 0.1 + Math.sin(t * 0.6 + i) * 0.035),
        );
      }
      const tar = targets[p.selected];
      ring.visible =
        !!tar && !['wall', 'membrane', 'cytoplasm'].includes(p.selected);
      if (tar) {
        ring.position.set(tar[0], tar[1], tar[2]);
        ring.scale.set(tar[3], tar[3], 1);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', downFn);
      renderer.domElement.removeEventListener('pointerup', upFn);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
            x.dispose(),
          );
        }
      });
      renderer.dispose();
      host.replaceChildren();
    };
  }, []);
  return (
    <div className="scene" ref={mount}>
      {failed && (
        <div className="fallback">
          <h2>Your cell, in focus</h2>
          <p>
            3D is unavailable on this device. All game controls still work
            below.
          </p>
          <div className="flat-cell">
            <span>Central vacuole</span>
            <i>Nucleus</i>
          </div>
        </div>
      )}
    </div>
  );
}
