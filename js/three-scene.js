
import * as THREE from "three";

export function createFoodScene(container) {
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#fff4e9");

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 4.4, 9);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd5bba5, 2));

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-4, 8, 6);
  light.castShadow = true;
  scene.add(light);

  // Ground shadow
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(5, 64),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  scene.add(ground);

  const dish = new THREE.Group();
  scene.add(dish);

  // Ceramic bowl
  const bowlMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffdf8,
    roughness: 0.25
  });

  const bowlPoints = [
    new THREE.Vector2(0, 0.12),
    new THREE.Vector2(0.7, 0.12),
    new THREE.Vector2(1.3, 0.2),
    new THREE.Vector2(1.75, 0.38),
    new THREE.Vector2(2, 0.67),
    new THREE.Vector2(2.02, 0.72),
    new THREE.Vector2(1.85, 0.7),
    new THREE.Vector2(1.65, 0.48),
    new THREE.Vector2(1.2, 0.32),
    new THREE.Vector2(0.6, 0.27),
    new THREE.Vector2(0, 0.27)
  ];

  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(bowlPoints, 96),
    bowlMaterial
  );

  bowl.castShadow = true;
  bowl.receiveShadow = true;
  dish.add(bowl);

  // All toppings stay inside the bowl.
  const food = new THREE.Group();
  dish.add(food);

  const pastaMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6ad35,
    roughness: 0.45
  });

  const tomatoMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4935,
    roughness: 0.5
  });

  const basilMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d8a42,
    roughness: 0.6,
    side: THREE.DoubleSide
  });

  // Spaghetti nest
  function createSpaghetti(index) {
    const points = [];

    const phase = index * 1.71;
    const radius = 0.22 + (index % 5) * 0.12;
    const turns = 1.5 + (index % 4) * 0.2;

    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = phase + t * Math.PI * 2 * turns;

      const r = radius + 0.18 * Math.sin(t * Math.PI);

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // Lower height keeps spaghetti inside the bowl.
      const y =
        0.43 +
        0.07 * Math.sin(t * Math.PI * 2 + phase);

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    const strand = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 100, 0.035, 8, false),
      pastaMaterial
    );

    strand.castShadow = true;
    food.add(strand);
  }

  for (let i = 0; i < 26; i++) {
    createSpaghetti(i);
  }

  // Tomato pieces
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.399;
    const radius = 0.3 + (i % 3) * 0.25;

    const tomato = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 18),
      tomatoMaterial
    );

    tomato.scale.set(1, 0.75, 1);

    tomato.position.set(
      Math.cos(angle) * radius,
      0.56,
      Math.sin(angle) * radius
    );

    tomato.castShadow = true;
    food.add(tomato);
  }

  // Basil leaves
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.2;

    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 20, 14),
      basilMaterial
    );

    leaf.scale.set(1.4, 0.12, 0.55);
    leaf.rotation.y = angle;

    leaf.position.set(
      Math.cos(angle) * 0.4,
      0.62,
      Math.sin(angle) * 0.4
    );

    leaf.castShadow = true;
    food.add(leaf);
  }

  // Position the whole bowl and food together.
  dish.position.y = -0.18;

  let targetX = 0;
  let targetY = 0;

  container.addEventListener("pointermove", (event) => {
    const rect = container.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    targetY = (x - 0.5) * 0.22;
    targetX = (y - 0.5) * 0.1;
  });

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function animate() {
    requestAnimationFrame(animate);

    dish.rotation.y +=
      (targetY - dish.rotation.y) * 0.035;

    dish.rotation.x +=
      (-0.04 + targetX - dish.rotation.x) * 0.035;

    renderer.render(scene, camera);
  }

  animate();
}
