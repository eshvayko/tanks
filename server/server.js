const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');

const {Player, Tank} = require("./player.js")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let status = "waiting";

app.set("port", 3000);
app.use("/public", express.static(path.dirname(__dirname) + '/public'));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    fs.createReadStream(__dirname + "/index.html").pipe(res);
})

app.post("/checkData", (req, res) => {
    let {playerName, key} = req.body;
    if (key === id && Object.keys(players).length+1 <= 5 && playerName.trim() !== "" && !Object.values(players).some(p => p.name === playerName)) {
        //
        res.redirect(`/game${key}?name=${encodeURIComponent(playerName)}`);
    } else {
        res.redirect("/");
    }
})

app.get("/game:id", (req, res) => {
    if (req.params.id !== id) res.redirect(`/`);
    fs.createReadStream(__dirname + "/game.html").pipe(res);
})

io.on("connection", (socket) => {
    socket.on("new player", (playerName) => {
        players[socket.id] = new Player(playerName, "not ready")
    })

    socket.on("ready", () => {
        players[socket.id].status = "ready";
    })
    // socket.on("movement", (data) => {
    // })
    socket.on("disconnect", () => {
        try {
            delete players[socket.id];
        } catch (e) {}
    })

    socket.on("status", (data) => {status = data})
})

io.sockets.on("status", (data) => {status = data})

function generateId() {
    let letters = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuioasdfghjklzxcvbnm0123456789";
    let length = 20;
    let id = "";
    for (let i = 0; i < length; i++) {
        let index = Math.floor(Math.random() * letters.length)
        id += letters[index];
    }
    return id;
}

let players = {};
const id = generateId();

server.listen(3000, () => console.log("Сервер запущен - http://localhost:3000"));

console.log(id);

function gameLoop() {
    io.sockets.emit('state', {status, players});
}

setInterval(() => {
    if (players!=={} && io) {
        gameLoop();
    }
}, 1000/60)