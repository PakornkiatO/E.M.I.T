const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin: "http://124.122.140.111:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("✅ New socket connected:", socket.id);

    socket.on("send_message", (data) => {
        console.log(`Message from ${socket.id}: ${data.message}`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);
    });
});

server.listen(3001, () => {
    console.log("🚀 Server is running on http://124.122.140.111:30001");
});