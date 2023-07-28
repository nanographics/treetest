import { Engine } from "@babylonjs/core/index";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const engine = new Engine(canvas, true);

console.log(engine);