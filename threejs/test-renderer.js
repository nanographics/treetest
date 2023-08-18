import * as THREE from "three";
import { GLTFLoader } from "https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://unpkg.com/three@0.154.0/examples/jsm/controls/OrbitControls.js";
import Stats from "https://unpkg.com/three@0.154.0/examples/jsm/libs/stats.module.js";

class TreeInstance
{
    mesh;
    meshIndex;
    translation;
    treeNr;
    scale;
}

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
const clock = new Clock();
const stats = new Stats();
const treeModelHeight = 20.8;

let camera;
let canvas;
let renderer;
let treeInstances;
let treeMeshes = new Map();
let simulations = [];
let simulationIterator;
let currentPlot;

let animationCounter = 0.0;

export function resize() {
    camera.aspect = canvas.parentNode.clientWidth / canvas.parentNode.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentNode.clientWidth, canvas.parentNode.clientHeight);
};


export function setSimulations(sims) {
    simulations = sims;
    simulationIterator =  simulations[0].entries();
    currentPlot = simulationIterator.next().value[1];
}

let firstFrame = true;

function setDebugColor(mesh, index, treeNr) {
    let color = new THREE.Color(0xffffff);
    if(treeNr === 0) {
        color = new THREE.Color(0xffffff);
    }
    if(treeNr === 1) {
        color = new THREE.Color(0xffffff);
    }
    if(treeNr === 2) {
        color = new THREE.Color(0xffffff);
    }
    if(treeNr === 3) {
        color = new THREE.Color(0x0040ff);
    }
    if(treeNr === 4) {
        color = new THREE.Color(0xff8000);
    }
    if(treeNr === 5) {
        color = new THREE.Color(0xf0f0f5);
    }
    if(treeNr === 6) {
        color = new THREE.Color(0xffad33);
    }
    if(treeNr === 7) {
        color = new THREE.Color(0xffffff);
    }

    mesh.setColorAt(index, color);
}


function preRender(elapsed) 
{
    if(treeMeshes.size === 0) {
        return;
    }
    // animate through the simulation years
    animationCounter += elapsed;
    const tick = 0.1;
    if(animationCounter > tick) {
        animationCounter -= tick;
        const nextSim = simulationIterator.next();
        if(!nextSim.done || firstFrame) {
            firstFrame = false;
            console.log(nextSim.value[0]);
            currentPlot = nextSim.value[1];
            console.log(currentPlot.trees[0].treeHeight);

            // update each instance over the simulation
            for (const [treeNr, positions] of treeInstances)
            {
                let isVisible = false;
                let mesh = treeMeshes.get(treeNr);
                let scale = mesh.originalScale.clone();
                // todo: use map instead of array to avoid iterating
                for (let i = 0; i < currentPlot.trees.length; i++) 
                {
                    const tree = currentPlot.trees[i];
                    if(tree.number === treeNr) // tree is found
                    {
                        isVisible = tree.snag === 0;
                        let scaleRatio = tree.treeHeight / treeModelHeight;
                        scale.multiplyScalar(scaleRatio);
                        break;
                    }
                }

                if(!isVisible) {
                    console.log("tree is invisible: " + treeNr);
                    mesh.visible = false;
                    continue;
                } else {
                    console.log("tree is visible: " + treeNr);
                    mesh.visible = true;
                }

                // iterate over all instances of this tree and update the instanced mesh
                for (let i = 0; i < positions.length; i++)
                {
                    const position = positions[i];
                    const matrixTranslation = new Matrix4().makeTranslation(position.x, position.y, position.z);
                    const matrixScale = new Matrix4().makeScale(scale.x, scale.y, scale.z);
                    const matrix = matrixTranslation.multiply(matrixScale);
                    setDebugColor(mesh, i, treeNr);
                    mesh.setMatrixAt(i, matrix);
                }
                // inform three.js that we updated the instanced mesh
                mesh.instanceMatrix.needsUpdate = true;
            }
        } else { // start from beginning
            simulationIterator =  simulations[0].entries();
            currentPlot = simulationIterator.next().value[1];
        }
    }   
}

/*
function preRender(elapsed) 
{
    // animate through the simulation years
    animationCounter += elapsed;
    const tick = 0.1;
    if(animationCounter > tick) {
        animationCounter -= tick;
        const nextSim = simulationIterator.next();
        if(!nextSim.done) {
            console.log(nextSim.value[0]);
            currentPlot = nextSim.value[1];
            console.log(currentPlot.trees[0].treeHeight);

            // update each instance over the simulation
            treeInstances.forEach(instance => {
                // todo: use map instead of array to avoid iterating
                let tree;
                let stillAlive = false;
                let scale = instance.scale.clone();
                for (let i = 0; i < currentPlot.trees.length; i++) 
                {
                    const plotTree = currentPlot.trees[i];
                    if(plotTree.number == instance.treeNr) {
                        tree = plotTree;     
                        stillAlive = tree.snag === 0;
                        let scaleRatio = tree.treeHeight / treeModelHeight;
                        scale.multiplyScalar(scaleRatio);
                        break; // tree is found
                    }
                }
        
                if (!stillAlive) {
                    instance.scale.multiplyScalar(0.0);    
                }
                
                const matrixTranslation = instance.translation;
                //instance.scale.multiplyScalar(1.005);
                //console.log(instance.scale);
                let matrix = new Matrix4().makeScale(scale.x, scale.y, scale.z);
                matrix.premultiply(matrixTranslation);
                let color = new THREE.Color(0xffffff);
                if(instance.treeNr === 0) {
                    color = new THREE.Color(0xffffff);
                }
                if(instance.treeNr === 1) {
                    color = new THREE.Color(0xffffff);
                }
                if(instance.treeNr === 2) {
                    color = new THREE.Color(0xffffff);
                }
                if(instance.treeNr === 3) {
                    color = new THREE.Color(0x0040ff);
                }
                if(instance.treeNr === 4) {
                    color = new THREE.Color(0xff8000);
                }
                if(instance.treeNr === 5) {
                    color = new THREE.Color(0xf0f0f5);
                }
                if(instance.treeNr === 6) {
                    color = new THREE.Color(0xffad33);
                }
                if(instance.treeNr === 7) {
                    color = new THREE.Color(0xffffff);
                }

                instance.mesh.setColorAt(instance.meshIndex, color);
                instance.mesh.setMatrixAt(instance.meshIndex, matrix);
           });
        } else { // start from beginning
            simulationIterator =  simulations[0].entries();
            currentPlot = simulationIterator.next().value[1];
        }
    }
    
        
   

    if(treeInstances.length > 0) {
        let matrix = new Matrix4();
        treeInstances[0].mesh.getMatrixAt(0, matrix);
        //console.log(matrix);
        treeInstances[0].mesh.instanceMatrix.needsUpdate = true;
    }
    
}
*/

function render(elapsed, controls, scene, camera) 
{
    controls.update();

    stats.begin();
    renderer.render(scene, camera);
    stats.end();
}

export function run(showLoadingDialogs = true, autoResize = true, numTrees = NaN, lod = NaN, treePositions) 
{
    treeInstances = treePositions;
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
        let treeModelScale = gltf.scene.children[0].scale;
        
        const originalMesh = lods[lod];         


        // iterate over all trees and create a mesh instance for each tree
        for (const [treeNr, positions] of treePositions)
        {
            // todo: check if we should disabel depth write
            originalMesh.material.depthWrite = false;
            const mesh = new InstancedMesh(originalMesh.geometry, originalMesh.material, positions.length);
            
            // check if tree is in first plot of the simulation and set visibility accordingly
            let firstPlot = simulations[0].entries().next().value[1];
            // todo: use map instead of array to avoid iterating over all trees
            let isVisible = false;
            for (let i = 0; i < firstPlot.trees.length; i++) 
            {
                const tree = firstPlot.trees[i];
                if(tree.number === treeNr) // tree is found
                {
                    isVisible = tree.snag === 0;
                    console.log("tree is visible: " + treeNr);
                    break;
                }
            }
            mesh.visible = isVisible;
            mesh.originalScale = treeModelScale;
            treeMeshes.set(treeNr, mesh);
            let i = 0;
            for (const position of positions)
            {
                //const x = position.x - groundWidth/2;
                //const y = (position.y * (groundElevationMax - groundElevationMin)) + groundElevationMin;
                //const z = position.z - groundHeight/2;
                let scale = treeModelScale.clone();
                const matrixTranslation = new Matrix4().makeTranslation(position.x, position.y, position.z);
                const matrixScale = new Matrix4().makeScale(scale.x, scale.y, scale.z);
                const matrix = matrixTranslation.multiply(matrixScale);
                setDebugColor(mesh, i, treeNr);
                mesh.setMatrixAt(i++, matrix);
            }
            scene.add(mesh);
        }
    });


    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 5.0);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    renderer = new WebGLRenderer({ canvas });
    renderer.setAnimationLoop(() => {
        const elapsed = clock.getDelta();
        preRender(elapsed);
        render(elapsed, controls, scene, camera);
    });

    if (autoResize) window.addEventListener("resize", () => resize());
    if (canvas.parentNode) resize();

    return canvas;
}

/*
export function run(showLoadingDialogs = true, autoResize = true, numTrees = NaN, lod = NaN, treePositions = [], treeInfo = []) {
    canvas = document.createElement("canvas");

    const scene = new Scene();

    const isTreeInfoValid = treePositions.length === treeInfo.length;

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
        let treeModelScale = gltf.scene.children[0].scale;
        //treeModelScale.multiplyScalar(0.5);
        //const scale = 0.25;
        //const scaleInv = 1 / scale;

        const originalMesh = lods[lod];

        //const mesh = new InstancedMesh(originalMesh.geometry, originalMesh.material, numTrees);
        const material = new THREE.MeshBasicMaterial();
        const mesh = new InstancedMesh(originalMesh.geometry, originalMesh.material, numTrees);
        
        while (treePositions.length < numTrees) {
            const x01 = Math.random();
            const z01 = Math.random();
            const y01 = 0;

            const x = groundWidth/2 * (x01 * 2 - 1);
            const y = y01;
            const z = groundHeight/2 * (z01 * 2 - 1);

            treePositions.push({ x, y, z });
            treeInfo.push({
                treeNr : -1,
                treeHeight : 100,
                snag : 0
            });
        }

        for (let i = 0; i < numTrees; ++i) 
        {
            const x = treePositions[i].x - groundWidth/2;
            const y = (treePositions[i].y * (groundElevationMax - groundElevationMin)) + groundElevationMin;
            const z = treePositions[i].z - groundHeight/2;
            let scale = treeModelScale.clone();
            if(isTreeInfoValid)
            {
                // assuming the height of the tree model is 20.8 meter (spruce tree model)
                let scaleRatio = treeInfo[i].treeHeight / treeModelHeight;
                scale.multiplyScalar(scaleRatio);
            }
            const matrixTranslation = new Matrix4().makeTranslation(x, y, z);
            const matrixScale = new Matrix4().makeScale(scale.x, scale.y, scale.z);
            const matrix = matrixScale.clone().premultiply(matrixTranslation);
            mesh.setMatrixAt(i, matrix);

            let treeinstance = new TreeInstance();
            treeinstance.mesh = mesh;
            treeinstance.translation = matrixTranslation;
            treeinstance.scale = treeModelScale;
            treeinstance.meshIndex = i;
            treeinstance.treeNr = treeInfo[i].treeNr;
            treeInstances.push(treeinstance);
        }
        scene.add(mesh);
    });

    const ambientLight = new AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 5.0);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    
    stats.showPanel(0);
    document.body.appendChild(stats.dom);

    renderer = new WebGLRenderer({ canvas });
    renderer.setAnimationLoop(() => {
        const elapsed = clock.getDelta();
        preRender(elapsed);
        render(elapsed, controls, scene, camera);
    });

    if (autoResize) window.addEventListener("resize", () => resize());
    if (canvas.parentNode) resize();

    return canvas;
}*/