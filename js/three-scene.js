import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function initThreeScene() {
  const container = document.getElementById("food3d");

  if (!container) return;

  const fallback = container.querySelector(".food-fallback");

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
  );

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(4, 5, 5);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0xffb18b, 1.5);
  fillLight.position.set(-4, 1, 3);
  scene.add(fillLight);

  const modelPivot = new THREE.Group();
  scene.add(modelPivot);

  const loader = new GLTFLoader();

  let modelLoaded = false;
  let animationFrame = null;
  let pointerX = 0;
  let pointerY = 0;

  loader.load(
    "assets/models/foodly-pasta.glb",

    gltf => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.sub(center);

      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDimension;

      model.scale.setScalar(scale);

      modelPivot.add(model);
      modelLoaded = true;

      if (fallback) fallback.style.display = "none";
    },

    undefined,

    error => {
      console.warn(
        "FOODLY 3D model unavailable. Showing fallback artwork.",
        error
      );
    }
  );

  function animate() {
    animationFrame = requestAnimationFrame(animate);

    if (modelLoaded) {
      modelPivot.rotation.y +=
        (pointerX * 0.18 - modelPivot.rotation.y) * 0.035;

      modelPivot.rotation.x +=
        (pointerY * 0.12 - modelPivot.rotation.x) * 0.035;
    }

    renderer.render(scene, camera);
  }

  animate();

  container.addEventListener("pointermove", event => {
    const rect = container.getBoundingClientRect();

    pointerX =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;

    pointerY =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  container.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });

  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });

  resizeObserver.observe(container);

  // Pause rendering when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrame);
    } else {
      animate();
    }
  });
}