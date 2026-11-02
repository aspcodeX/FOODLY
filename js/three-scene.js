
import * as THREE from "three";

export function initThreeScene() {
  const container = document.getElementById("food3d");
  if (!container) return;

  // SCENE
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 2.3, 6.5);
  camera.lookAt(0, -0.15, 0);

  // RENDERER
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  container.appendChild(renderer.domElement);

  // LIGHTING
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb36b40, 2.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
  keyLight.position.set(3, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xff7043, 2, 10);
  fillLight.position.set(-4, 2, 3);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffc66b, 2, 10);
  rimLight.position.set(2, 3, -4);
  scene.add(rimLight);

  // MAIN FOOD GROUP
  const foodGroup = new THREE.Group();
  scene.add(foodGroup);

  const bowlGroup = new THREE.Group();
  foodGroup.add(bowlGroup);

  // MATERIALS
  const ceramic = new THREE.MeshStandardMaterial({
    color: 0xfff8ef,
    roughness: 0.22,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const sauceMaterial = new THREE.MeshStandardMaterial({
    color: 0xb92e16,
    roughness: 0.3,
    metalness: 0
  });

  const pastaMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5c66c,
    roughness: 0.48
  });

  const basilMaterial = new THREE.MeshStandardMaterial({
    color: 0x287b35,
    roughness: 0.65,
    side: THREE.DoubleSide
  });

  const parmesanMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    roughness: 0.8
  });

  // BOWL - LATHE GEOMETRY
  const bowlProfile = [
    new THREE.Vector2(0.2, -0.9),
    new THREE.Vector2(0.55, -0.88),
    new THREE.Vector2(0.9, -0.72),
    new THREE.Vector2(1.2, -0.42),
    new THREE.Vector2(1.38, -0.05),
    new THREE.Vector2(1.42, 0.22),
    new THREE.Vector2(1.37, 0.27),
    new THREE.Vector2(1.28, 0.16),
    new THREE.Vector2(1.15, -0.22),
    new THREE.Vector2(0.85, -0.52),
    new THREE.Vector2(0.45, -0.66),
    new THREE.Vector2(0.15, -0.68)
  ];

  const bowlGeometry = new THREE.LatheGeometry(
    bowlProfile,
    96
  );

  const bowl = new THREE.Mesh(bowlGeometry, ceramic);
  bowlGroup.add(bowl);

  // DECORATIVE GOLDEN RIM
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.39, 0.025, 12, 96),
    new THREE.MeshStandardMaterial({
      color: 0xe9b76c,
      roughness: 0.3,
      metalness: 0.5
    })
  );

  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.235;
  bowlGroup.add(rim);

  // TOMATO SAUCE
  const sauce = new THREE.Mesh(
    new THREE.CircleGeometry(1.12, 80),
    sauceMaterial
  );

  sauce.rotation.x = -Math.PI / 2;
  sauce.position.y = -0.035;
  bowlGroup.add(sauce);

  // PASTA - CURVED TUBE GEOMETRY
  function createPastaPiece(x, z, angle, scale = 1) {
    const curvePoints = [
      new THREE.Vector3(-0.3, 0, 0),
      new THREE.Vector3(-0.18, 0.13, 0.05),
      new THREE.Vector3(0.05, 0.16, 0.12),
      new THREE.Vector3(0.25, 0.05, 0.08),
      new THREE.Vector3(0.34, -0.04, 0)
    ];

    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const geometry = new THREE.TubeGeometry(
      curve,
      24,
      0.095,
      10,
      false
    );

    const pasta = new THREE.Mesh(geometry, pastaMaterial);

    pasta.position.set(x, 0.12, z);
    pasta.rotation.y = angle;
    pasta.scale.setScalar(scale);

    bowlGroup.add(pasta);
  }

  const pastaPositions = [
    [-0.55, -0.35, 0.2],
    [0.05, -0.55, 1.1],
    [0.55, -0.3, 2.2],
    [-0.25, 0.0, 0.8],
    [0.35, 0.05, 1.8],
    [-0.65, 0.3, 2.5],
    [0.65, 0.35, 0.4],
    [-0.1, 0.48, 1.5],
    [0.2, -0.1, 2.8],
    [-0.4, -0.55, 0.5],
    [0.6, -0.05, 1.4],
    [-0.1, 0.2, 2.1]
  ];

  pastaPositions.forEach((position, index) => {
    createPastaPiece(
      position[0],
      position[1],
      position[2],
      0.85 + (index % 3) * 0.12
    );
  });

  // BASIL LEAVES
  function createBasilLeaf(x, z, rotation, scale = 1) {
    const shape = new THREE.Shape();

    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.12, 0.18, -0.32, 0.32, 0, 0.55);
    shape.bezierCurveTo(0.32, 0.32, 0.12, 0.18, 0, 0);

    const geometry = new THREE.ShapeGeometry(shape, 16);
    const leaf = new THREE.Mesh(geometry, basilMaterial);

    leaf.position.set(x, 0.23, z);
    leaf.rotation.set(-Math.PI / 2, rotation, 0);
    leaf.scale.setScalar(scale);

    bowlGroup.add(leaf);
  }

  createBasilLeaf(-0.45, 0.18, 0.4, 0.9);
  createBasilLeaf(0.48, -0.25, 1.5, 0.8);
  createBasilLeaf(0.12, 0.48, 2.2, 0.65);

  // PARMESAN PIECES
  for (let i = 0; i < 24; i++) {
    const flake = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + Math.random() * 0.025, 8, 6),
      parmesanMaterial
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.85;

    flake.position.set(
      Math.cos(angle) * radius,
      0.24 + Math.random() * 0.04,
      Math.sin(angle) * radius
    );

    flake.scale.y = 0.4;
    bowlGroup.add(flake);
  }

  // FLOATING DECORATIVE TOMATOES
  const tomatoMaterial = new THREE.MeshStandardMaterial({
    color: 0xe84725,
    roughness: 0.35
  });

  const floatingObjects = [];

  function createTomato(x, y, z, scale) {
    const tomato = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 24),
      tomatoMaterial
    );

    tomato.scale.set(scale, scale * 0.8, scale);
    tomato.position.set(x, y, z);

    scene.add(tomato);
    floatingObjects.push({
      mesh: tomato,
      initialY: y,
      phase: Math.random() * Math.PI * 2
    });
  }

  createTomato(-1.65, 0.8, 0.2, 0.8);
  createTomato(1.7, -0.2, 0.1, 0.7);
  createTomato(1.4, 1.2, -0.4, 0.55);

  // INTERACTION
  let pointerX = 0;
  let pointerY = 0;

  container.addEventListener("pointermove", event => {
    const rect = container.getBoundingClientRect();

    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  container.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  // ANIMATION
  const clock = new THREE.Clock();
  let animationFrame;
  let isRunning = false;

  function animate() {
    if (isRunning) return;
    isRunning = true;

    function frame() {
      animationFrame = requestAnimationFrame(frame);

      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrame);
        return;
      }

      const elapsed = clock.getElapsedTime();

      // Gentle automatic rotation
      foodGroup.rotation.y +=
        (pointerX * 0.2 + Math.sin(elapsed * 0.35) * 0.08 -
          foodGroup.rotation.y) * 0.025;

      foodGroup.rotation.x +=
        (pointerY * 0.12 - foodGroup.rotation.x) * 0.025;

      // Floating tomatoes
      floatingObjects.forEach(item => {
        item.mesh.position.y =
          item.initialY + Math.sin(elapsed * 1.5 + item.phase) * 0.08;

        item.mesh.rotation.y += 0.008;
      });

      // Soft floating movement
      bowlGroup.position.y = Math.sin(elapsed * 1.2) * 0.035;

      renderer.render(scene, camera);
    }

    frame();
  }

  animate();

  // RESPONSIVE RESIZING
  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });

  resizeObserver.observe(container);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      animate();
    }
  });
}
