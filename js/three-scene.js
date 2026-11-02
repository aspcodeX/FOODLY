
/* FOODLY — THREE.JS PASTA BOWL */

import * as THREE from "three";

export function createFoodScene(container) {
  if (!container) return null;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 4.5, 8.5);
  camera.lookAt(0, 0.3, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  container.appendChild(renderer.domElement);

  const bowl = new THREE.Group();
  scene.add(bowl);

  // Bowl exterior
  const bowlGeometry = new THREE.SphereGeometry(
    2.2, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.48
  );

  const bowlMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6eee3,
    roughness: 0.28,
    metalness: 0.03
  });

  const bowlMesh = new THREE.Mesh(bowlGeometry, bowlMaterial);
  bowlMesh.scale.y = 0.75;
  bowlMesh.position.y = 0.1;
  bowlMesh.rotation.x = Math.PI;
  bowlMesh.castShadow = true;
  bowlMesh.receiveShadow = true;
  bowl.add(bowlMesh);

  // Pasta bed
  const pastaMaterial = new THREE.MeshStandardMaterial({
    color: 0xe7a83d,
    roughness: 0.65
  });

  const pastaGroup = new THREE.Group();
  pastaGroup.position.y = 0.85;
  bowl.add(pastaGroup);

  // Curved pasta strands
  for (let i = 0; i < 38; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.2, 0, -0.4),
      new THREE.Vector3(-0.5, 0.2, 0.3),
      new THREE.Vector3(0.2, 0.05, -0.2),
      new THREE.Vector3(0.8, 0.25, 0.4),
      new THREE.Vector3(1.2, 0.05, -0.1)
    ]);

    const points = curve.getPoints(30);
    const geometry = new THREE.TubeGeometry(
      curve,
      30,
      0.045,
      8,
      false
    );

    const strand = new THREE.Mesh(geometry, pastaMaterial);
    strand.rotation.y = Math.random() * Math.PI * 2;
    strand.rotation.x = (Math.random() - 0.5) * 0.6;
    strand.position.set(
      (Math.random() - 0.5) * 1.4,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 1.4
    );

    pastaGroup.add(strand);
  }

  // Tomato pieces
  const tomatoMaterial = new THREE.MeshStandardMaterial({
    color: 0xe94f36,
    roughness: 0.45
  });

  for (let i = 0; i < 9; i++) {
    const tomato = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 20, 20),
      tomatoMaterial
    );

    const angle = (i / 9) * Math.PI * 2;
    const radius = 0.85;

    tomato.position.set(
      Math.cos(angle) * radius,
      0.2 + Math.random() * 0.12,
      Math.sin(angle) * radius
    );

    tomato.scale.set(1, 0.8, 1);
    pastaGroup.add(tomato);
  }

  // Basil leaves
  const basilMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b8a45,
    roughness: 0.7,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      basilMaterial
    );

    leaf.scale.set(0.65, 0.12, 1.5);
    leaf.position.set(
      (Math.random() - 0.5) * 1.3,
      0.35,
      (Math.random() - 0.5) * 1.3
    );

    leaf.rotation.y = Math.random() * Math.PI;
    pastaGroup.add(leaf);
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xffa66b, 45);
  fillLight.position.set(-4, 2, -3);
  scene.add(fillLight);

  // Ground shadow
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3, 64),
    new THREE.ShadowMaterial({ opacity: 0.13 })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Interaction
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const onPointerMove = (event) => {
    const rect = container.getBoundingClientRect();

    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  container.addEventListener("pointermove", onPointerMove);

  let animationId;
  let isVisible = true;

  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });

  observer.observe(container);

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (!isVisible) return;

    targetX += (pointerY * 0.12 - targetX) * 0.035;
    targetY += (pointerX * 0.18 - targetY) * 0.035;

    bowl.rotation.x = targetX;
    bowl.rotation.y += 0.0025;
    bowl.rotation.y += (targetY - bowl.rotation.y) * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  resizeObserver.observe(container);

  return {
    destroy() {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      container.replaceChildren();
    }
  };
}
