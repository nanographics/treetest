const path = require("path");

module.exports = {
    entry: "./src/index.js",
    output: {
        filename: "test2.js",
        path: path.resolve(__dirname, "dist"),
        library: {
            name: "Test",
            type: "window",
            export: "default",
        },
    },
};