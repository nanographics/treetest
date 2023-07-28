const WebSocketServer = require("ws").WebSocketServer;
const fs = require("fs").promises;

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
        console.log(`Received message => ${message}`);

        

        ws.send(`Hello, you sent => ${message}`);
    });
    ws.send("Hi there, I am a WebSocket server");
});