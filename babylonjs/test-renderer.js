const Engine = window.BABYLON.Engine;
const Scene = window.BABYLON.Scene;
const MeshBuilder = window.BABYLON.MeshBuilder;
const StandardMaterial = window.BABYLON.StandardMaterial;
const Texture = window.BABYLON.Texture;
const ArcRotateCamera = window.BABYLON.ArcRotateCamera;
const Vector3 = window.BABYLON.Vector3;
const HemisphericLight = window.BABYLON.HemisphericLight;
const SceneLoader = window.BABYLON.SceneLoader;
const Matrix = window.BABYLON.Matrix;

let engine = null;

export function resize() {
    engine.resize();
}

export function run(showInspector = false, showLoadingDialogs = true, autoResize = true, numTrees = NaN, lod = NaN, treePositions = []) {
    const canvas = document.createElement("canvas");

    engine = new Engine(canvas, true);

    const scene = new Scene();
    if (showInspector) scene.debugLayer.show();

    //MeshBuilder.CreateBox("box", {});

    const groundWidth = 2850;
    const groundHeight = 2850;
    const groundElevationMin = 0;
    const groundElevationMax = 500;

    //const heightTexture = new Texture("../assets/gesaeuse_height_medium.png");

    const ground = MeshBuilder.CreateGroundFromHeightMap("ground", "../assets/gesaeuse_height_medium.png", {
        width: groundWidth, height: groundHeight, subdivisions: 250, maxHeight: groundElevationMax, minHeight: groundElevationMin,
    });
    ground.material = new StandardMaterial("groundMat");
    ground.material.diffuseTexture = new Texture("../assets/gesaeuse_color_small.jpg");

    if (showLoadingDialogs) alert("Click OK to load spruce tree (45 MB)");
    const loadStart = performance.now();
    const spruce = SceneLoader.ImportMesh(null, "../assets/", "spruce.glb", scene, async (meshes) => {
        const loadEnd = performance.now();
        if (showLoadingDialogs) alert("Spruce tree (45 MB) loaded in " + (loadEnd - loadStart) + " ms");

        const parent = meshes[0];
        parent.isVisible = false;
        meshes = meshes[0].getChildren()[0].getChildren();
        
        const lod0 = meshes[1];
        const lod1 = meshes[2];
        const lod2 = meshes[3];
        const lod3 = meshes[0]; // Billboard

        const scale = 0.5;
        const scaleInv = 1 / scale;
        for (const mesh of parent.getChildMeshes()) {
            mesh.scaling = new Vector3(scale, scale, scale);
            mesh.isVisible = false;
        }

        for (const mesh of meshes) {
            mesh.setParent(null);
        }
        parent.dispose();

        //mesh.position = new Vector3(0, 2, 4);
        //mesh.scaling = new Vector3(0.01, 0.01, 0.01);
        
        const matrices = [];

        while (isNaN(numTrees) || numTrees < 0) {
            numTrees = parseInt(prompt("Number of trees", ""));
        }

        while(isNaN(lod) || lod < 0 || lod > 3) {
            lod = parseInt(prompt("LOD (0=high-detail, 1=medium-detail, 2=low-detail, 3=billboards)", ""));
        }
        const lods = [lod0, lod1, lod2, lod3];
        const mesh = lods[lod];
        mesh.isVisible = true;

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
            let x = treePositions[i].x - groundWidth/2;
            let y = (treePositions[i].y * (groundElevationMax - groundElevationMin)) + groundElevationMin;
            let z = treePositions[i].z - groundHeight/2;

            const wtf = 3.28; // Todo: Wtf?

            x *= -1 * scaleInv * wtf;
            y *= scaleInv * wtf;
            z *= -1 * scaleInv * wtf;

            const matrix = Matrix.Translation(x, y, z);

            //const index = lod3.thinInstanceAddSelf(matrix);
            matrices.push(matrix);
        }
        
        mesh.thinInstanceAdd(matrices);
    });

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, Vector3.Zero());
    camera.attachControl(canvas, true);
    const light = new HemisphericLight("light", new Vector3(1, 1, 0));

    const fps = document.getElementById("fps") || document.createElement("div");
    if (fps.parentNode === null) {
        fps.style.position = "fixed";
        fps.style.top = "0";
        fps.style.right = "0";
        fps.style.fontSize = "2em";
        document.body.appendChild(fps);
    }
    engine.runRenderLoop(() => {
        fps.textContent = engine.getFps().toFixed() + " fps";
        scene.render()
    });
    if (autoResize) window.addEventListener("resize", () => resize());

    return canvas;
}