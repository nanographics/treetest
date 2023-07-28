const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs");
const path = require("path");

const wss = new WebSocketServer({ port: 8080 });

const exists = async (file) => {
    try {
        await fs.promises.access(file, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
};

const isReadable = async (file) => {
    try {
        await fs.promises.access(file, fs.constants.R_OK);
        return true;
    } catch {
        return false;
    }
};

wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
        console.log(`Received message => ${message}`);

        const fileName = "spruce.glb";

        const filePath = path.join(__dirname, "..", "assets", fileName);

        const fileExists = await exists(filePath);
        if (!fileExists) {
            ws.send(`File ${filePath} does not exist`);
            return;
        }

        const fileIsReadable = await isReadable(filePath);
        if (!fileIsReadable) {
            ws.send(`File ${filePath} is not readable`);
            return;
        }

        const file = await fs.promises.readFile(filePath, "binary");

        //ws.send(`Hello, you sent => ${message}`);
        ws.send(file);
    });
    ws.send("Hi there, I am a WebSocket server");
});