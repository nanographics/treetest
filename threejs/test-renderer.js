import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://unpkg.com/three@0.154.0/examples/jsm/controls/OrbitControls.js";
import Stats from "https://unpkg.com/three@0.154.0/examples/jsm/libs/stats.module.js";

const Scene = THREE.Scene;
const PerspectiveCamera = THREE.PerspectiveCamera;
const BoxGeometry = THREE.BoxGeometry;
const PlaneGeometry = THREE.PlaneGeometry;
const MeshStandardMaterial = THREE.MeshStandardMaterial;
const Mesh = THREE.Mesh;
const Color = THREE.Color;
const AmbientLight = THREE.AmbientLight;
const DirectionalLight = THREE.DirectionalLight;
const Clock = THREE.Clock;
const WebGLRenderer = THREE.WebGLRenderer;
const TextureLoader = THREE.TextureLoader;
const InstancedMesh = THREE.InstancedMesh;
const Vector3 = THREE.Vector3;
const Matrix4 = THREE.Matrix4;

let camera;
let canvas;
let renderer;

export function resize() {
    camera.aspect = canvas.parentNode.clientWidth / canvas.parentNode.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentNode.clientWidth, canvas.parentNode.clientHeight);
};

function asd() {

}

export function run(showLoadingDialogs = true, autoResize = true, numTrees = NaN, lod = NaN, treePositions = []) {
    canvas = document.createElement("canvas");

    const scene = new Scene();

    scene.background = new Color("skyblue");

    const fov = 45;
    const aspect = 1;//canvas.clientWidth / canvas.clientHeight;
    const near = 1;
    const far = 10000;

    camera = new PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 1500, 3000);

    //const geometry = new BoxGeometry(2, 2, 2);
    //const material = new MeshStandardMaterial({ color: 0xbbbbbb });
    //const cube = new Mesh(geometry, material);
    //scene.add(cube);

    const groundWidth = 2850;
    const groundHeight = 2850;
    const groundElevationMin = 0;
    const groundElevationMax = 500;

    const colorMap = new TextureLoader().load("../assets/gesaeuse_color_small.jpg");
    const heightMap = new TextureLoader().load("../assets/gesaeuse_height_medium.png");
    const material = new MeshStandardMaterial({ map: colorMap, displacementMap: heightMap, displacementScale: groundElevationMax - groundElevationMin, displacementBias: groundElevationMin });
    const ground = new Mesh(new PlaneGeometry(groundWidth, groundHeight, 250, 250), material);
    ground.rotateX(-Math.PI / 2);
    scene.add(ground);

    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = true;

    const loader = new GLTFLoader();
    if (showLoadingDialogs) alert("Click OK to load spruce tree (45 MB)");
    const loadStart = performance.now();
    loader.load("../assets/spruce.glb", (gltf) => {
        const loadEnd = performance.now();
        if (showLoadingDialogs) alert("Spruce tree (45 MB) loaded in " + (loadEnd - loadStart) + " ms");
        
        while (isNaN(numTrees) || numTrees < 0) {
            numTrees = parseInt(prompt("Number of trees", ""));
        }
        
        while(isNaN(lod) || lod < 0 || lod > 3) {
            lod = parseInt(prompt("LOD (0=high-detail, 1=medium-detail, 2=low-detail, 3=billboards)", ""));
        }

        const children = gltf.scene.children[0].children;
        const lod0 = children[1];
        const lod1 = children[2];
        const lod2 = children[3];
        const lod3 = children[0]; // Billboards
        const lods = [lod0, lod1, lod2, lod3];

        //const scale = 0.25;
        var scale = gltf.scene.children[0].scale;
        scale.multiplyScalar(0.5);
        //const scale = 0.25;
        //const scaleInv = 1 / scale;

        const originalMesh = lods[lod];

        const mesh = new InstancedMesh(originalMesh.geometry, originalMesh.material, numTrees);
        
        while (treePositions.length < numTrees) {
            const x01 = Math.random();
            const z01 = Math.random();
            const y01 = 0;

            const x = groundWidth/2 * (x01 * 2 - 1);
            const y = y01;
            const z = groundHeight/2 * (z01 * 2 - 1);

            treePositions.push({ x, y, z });
        }

        for (let i = 0; i < numTrees; ++i) {
            const x = treePositions[i].x - groundWidth/2;
            const y = (treePositions[i].y * (groundElevationMax - groundElevationMin)) + groundElevationMin;
            const z = treePositions[i].z - groundHeight/2;
            const matrixTranslation = new Matrix4().makeTranslation(x, y, z);
            const matrixScale = new Matrix4().makeScale(scale.x, scale.y, scale.z);
            const matrix = matrixScale.clone().premultiply(matrixTranslation);
            mesh.setMatrixAt(i, matrix);
        }
        scene.add(mesh);
    });

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const clock = new Clock();

    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    renderer = new WebGLRenderer({ canvas });
    renderer.setAnimationLoop(() => {
        const deltaTime = clock.getDelta();

        controls.update();

        //cube.rotation.x += (0.1 * deltaTime);
        //cube.rotation.y += (0.2 * deltaTime);
        //cube.rotation.z += (0.3 * deltaTime);

        stats.begin();
        renderer.render(scene, camera);
        stats.end();
    });

    if (autoResize) window.addEventListener("resize", () => resize());
    if (canvas.parentNode) resize();

    return canvas;
}