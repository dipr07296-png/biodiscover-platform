/* ============================================================
   THREE-SCENE.JS — Three.js DNA Double Helix Hero Scene
   ============================================================ */

(function () {
  if (!window.THREE) return;

  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ---- Lighting ----
  const ambientLight = new THREE.AmbientLight(0x112244, 1.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x00d4ff, 3, 50);
  pointLight1.position.set(10, 10, 10);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0x7c4dff, 2, 50);
  pointLight2.position.set(-10, -5, 5);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0x00ff88, 1.5, 40);
  pointLight3.position.set(0, -10, -5);
  scene.add(pointLight3);

  // ---- DNA Double Helix ----
  const dnaGroup = new THREE.Group();
  scene.add(dnaGroup);

  const strandCount = 80;     // pairs per helix
  const radius = 3.5;
  const height = 20;
  const turns = 3;

  const nucleotideColors = [0x00d4ff, 0x7c4dff, 0x00ff88, 0xff4da6];

  const sphereGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const tubeGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);

  const strandMat1 = new THREE.MeshPhongMaterial({
    color: 0x00d4ff, emissive: 0x003344, shininess: 120, transparent: true, opacity: 0.9
  });
  const strandMat2 = new THREE.MeshPhongMaterial({
    color: 0x7c4dff, emissive: 0x220044, shininess: 120, transparent: true, opacity: 0.9
  });

  const nucleotideMeshes = [];

  for (let i = 0; i < strandCount; i++) {
    const t = i / strandCount;
    const angle = t * Math.PI * 2 * turns;
    const y = (t - 0.5) * height;

    // Strand 1
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;

    // Strand 2 (opposite side)
    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;

    // Nucleotide 1
    const nMat = new THREE.MeshPhongMaterial({
      color: nucleotideColors[i % 4], emissive: 0x111111, shininess: 80
    });
    const sphere1 = new THREE.Mesh(sphereGeo, strandMat1.clone());
    sphere1.position.set(x1, y, z1);
    dnaGroup.add(sphere1);
    nucleotideMeshes.push({ mesh: sphere1, baseY: y, t });

    // Nucleotide 2
    const sphere2 = new THREE.Mesh(sphereGeo, strandMat2.clone());
    sphere2.position.set(x2, y, z2);
    dnaGroup.add(sphere2);

    // Base pair bridge (every 4)
    if (i % 2 === 0) {
      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);

      const bridgeMat = new THREE.MeshPhongMaterial({
        color: nucleotideColors[i % 4], transparent: true, opacity: 0.5
      });
      const bridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, dist, 6),
        bridgeMat
      );
      bridge.position.set(midX, y, midZ);
      bridge.rotation.z = Math.PI / 2;
      bridge.lookAt(x2, y, z2);
      bridge.rotation.x += Math.PI / 2;
      dnaGroup.add(bridge);
    }
  }

  // ---- Floating Molecule Particles ----
  const particleCount = 200;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 50;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00d4ff, size: 0.12, transparent: true, opacity: 0.6,
    sizeAttenuation: true
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---- Atom Clusters ----
  function createAtom(position, color, scale = 1) {
    const group = new THREE.Group();

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.25 * scale, 16, 16),
      new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3, shininess: 100 })
    );
    group.add(nucleus);

    // Electron orbits
    for (let i = 0; i < 2; i++) {
      const torusMat = new THREE.MeshPhongMaterial({
        color, transparent: true, opacity: 0.3, wireframe: false
      });
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 * scale, 0.02, 6, 32),
        torusMat
      );
      torus.rotation.x = (Math.PI / 2) * i;
      torus.rotation.y = (Math.PI / 3) * i;
      group.add(torus);
    }

    group.position.copy(position);
    return group;
  }

  const atoms = [
    createAtom(new THREE.Vector3(-8, 3, -5), 0x00ff88, 1.5),
    createAtom(new THREE.Vector3(8, -2, -8), 0xff4da6, 1.2),
    createAtom(new THREE.Vector3(-6, -5, -3), 0xffd700, 1.0),
    createAtom(new THREE.Vector3(9, 6, -6), 0x7c4dff, 1.3),
  ];
  atoms.forEach(a => scene.add(a));

  // ---- Mouse parallax ----
  let mouseX = 0, mouseY = 0;
  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- Clock ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotate DNA helix
    dnaGroup.rotation.y = t * 0.15;
    dnaGroup.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Camera parallax
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // Particles drift
    particles.rotation.y = t * 0.02;
    particles.rotation.x = t * 0.01;

    // Animate atoms
    atoms.forEach((atom, i) => {
      atom.rotation.y = t * (0.3 + i * 0.1);
      atom.rotation.x = t * (0.2 + i * 0.05);
      atom.position.y += Math.sin(t + i) * 0.003;

      atom.children.forEach((child, ci) => {
        if (ci > 0) {
          child.rotation.z = t * (1 + i * 0.3);
        }
      });
    });

    // Nucleotide glow pulse
    nucleotideMeshes.forEach(({ mesh, t: nt }) => {
      const scale = 1 + Math.sin(t * 2 + nt * 10) * 0.15;
      mesh.scale.setScalar(scale);
    });

    // Lights orbit
    pointLight1.position.x = Math.sin(t * 0.5) * 12;
    pointLight1.position.z = Math.cos(t * 0.5) * 12;
    pointLight2.position.x = Math.cos(t * 0.4) * 10;
    pointLight2.position.z = Math.sin(t * 0.4) * 10;

    renderer.render(scene, camera);
  }

  animate();

  // ---- Resize ----
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
