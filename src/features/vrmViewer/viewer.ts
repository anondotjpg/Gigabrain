import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;

  constructor() {
    this.isReady = false;

    this._scene = new THREE.Scene();

    /**
     * 🚫 DO NOT load textures here (SSR unsafe)
     * Background will be set in setup()
     */

    /**
     * ✅ VRM-SAFE LIGHTING
     */

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this._scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
    keyLight.position.set(1.0, 1.8, 1.2);
    this._scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.05);
    fillLight.position.set(-1.2, 1.2, 0.8);
    this._scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.25);
    rimLight.position.set(0, 1.5, -1.5);
    this._scene.add(rimLight);

    this._clock = new THREE.Clock();
    this._clock.start();
  }

  public loadVrm(url: string) {
    if (this.model?.vrm) {
      this.unloadVRM();
    }

    this.model = new Model(this._camera || new THREE.Object3D());

    this.model.loadVRM(url).then(async () => {
      if (!this.model?.vrm) return;

      this.model.vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });

      this._scene.add(this.model.vrm.scene);

      const vrma = await loadVRMAnimation(buildUrl("/idle_loop.vrma"));
      if (vrma) this.model.loadAnimation(vrma);

      requestAnimationFrame(() => {
        this.resetCamera();
      });
    });
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene);
      this.model.unLoadVrm();
    }
  }

  public setup(canvas: HTMLCanvasElement) {
    if (typeof window === "undefined") return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth || canvas.width;
    const height = parent?.clientHeight || canvas.height;

    this._renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
    });

    /**
     * ✅ COLOR PIPELINE
     */
    /**
     * ✅ COLOR PIPELINE (TS SAFE)
     */
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer.toneMapping = THREE.NoToneMapping;
    this._renderer.toneMappingExposure = 1.0;
    this._renderer.physicallyCorrectLights = false;
    this._renderer.shadowMap.enabled = false;


    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * ✅ SAFE BACKGROUND LOAD (CLIENT ONLY)
     */
    /**
     * ✅ SAFE BACKGROUND LOAD (CLIENT ONLY)
     */
    const loader = new THREE.TextureLoader();
    loader.load("/bg.jpg", (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      this._scene.background = texture;
    });


    this._camera = new THREE.PerspectiveCamera(20, width / height, 0.1, 20);
    this._camera.position.set(0, 1.35, 3.2);

    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.enabled = false;
    this._cameraControls.update();

    window.addEventListener("resize", () => this.resize());

    this.isReady = true;
    this.update();
  }

  public resize() {
    if (!this._renderer || !this._camera) return;

    const parent = this._renderer.domElement.parentElement;
    if (!parent) return;

    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(parent.clientWidth, parent.clientHeight);

    this._camera.aspect = parent.clientWidth / parent.clientHeight;
    this._camera.updateProjectionMatrix();
  }

  public resetCamera() {
    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode("head");
    if (!headNode || !this._camera) return;
  
    const headPos = headNode.getWorldPosition(new THREE.Vector3());
  
    const CAMERA_Y_OFFSET = 0.15; // ⬇️ tweak this
  
    this._camera.position.set(
      this._camera.position.x,
      headPos.y + CAMERA_Y_OFFSET,
      this._camera.position.z
    );
  
    this._cameraControls?.target.set(
      headPos.x,
      headPos.y + CAMERA_Y_OFFSET,
      headPos.z
    );
  
    this._cameraControls?.update();
  }

  public update = () => {
    requestAnimationFrame(this.update);

    const delta = this._clock.getDelta();
    this.model?.update(delta);

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
