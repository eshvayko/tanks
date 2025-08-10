const express = require('express');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const {tanks, checkCollision} = require("./utils.js")

let status = "waiting";

app.set("port", 3000);
app.use("/public", express.static(path.dirname(__dirname) + '/public'));
app.use("/sounds", express.static(path.dirname(__dirname) + '/sounds'));
app.use("/sprites", express.static(path.dirname(__dirname) + '/sprites'));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    fs.createReadStream(__dirname + "/index.html").pipe(res);
})

app.post("/checkData", (req, res) => {
    let playerName = req.body.playerName;
    let tankName = req.body.tank;
    if (Object.keys(players).length+1 <= 5 && playerName.trim() !== "" && !Object.values(players).some(p => p.name === playerName) && playerName.length < 50) {
        res.redirect(`/game?name=${encodeURIComponent(playerName)}&tank=${encodeURIComponent(tankName)}`);
    } else {
        res.redirect("/");
    }
})

app.get("/game", (req, res) => {
    if (JSON.stringify(req.query) === "{}" || req.query.name === "" || Object.values(players).some(pl => pl.name === req.query.name) || status === "playing" || !req.query.tank) res.redirect(`/`);
    fs.createReadStream(__dirname + "/game.html").pipe(res);
})

io.on("connection", (socket) => {
    socket.on("new player", ({playerName, tankName}) => {
        let index = Math.floor(Math.random() * startPositions.length)
        let position = startPositions[index];
        startPositions.splice(index, 1);
        players[socket.id] = {name: playerName, posX: position.x, posY: position.y, angle: position.angle, turretAngle: 0, tank: tanks[tankName](), status: "not ready", currentSpeed: 0, acceleration: 0, targetSpeed: 0, oldPos: {x: 0, y: 0, angle: 0}, damageDone: 0, damageBlocked: 0};
    })

    socket.on("fire", () => {
        const player = players[socket.id];
        // Проверяем, что перезарядка закончилась
        if (player) {
            missiles.push({
                num: missiles.length,
                x: player.posX + 1,
                y: player.posY + 0.5,
                angle: player.angle + player.turretAngle,
                owner: player
            });
            // Сбрасываем перезарядку
            player.tank.currentRecharge = player.tank.recharge;
        }
    })

    socket.on("update missiles", (newMissiles) => {
        missiles = [];
        for (let missile of newMissiles) {
            missiles.push({num: missile.num, x: missile.x, y: missile.y, angle: missile.angle, owner: missile.owner, timeHit: missile.timeHit});
        }
    })

    socket.on("ready", () => {
        players[socket.id].status = "ready";
    })

    socket.on("movement", (data) => {
        if (players[socket.id]) {
            // Обновляем только необходимые поля
            players[socket.id].posX = data.posX;
            players[socket.id].posY = data.posY;
            players[socket.id].angle = data.angle;
            players[socket.id].turretAngle = data.turretAngle;
            players[socket.id].currentSpeed = data.currentSpeed;
            players[socket.id].acceleration = data.acceleration;
            players[socket.id].targetSpeed = data.targetSpeed;
            players[socket.id].oldPos = data.oldPos;
            players[socket.id].damageBlocked = data.damageBlocked;
            players[socket.id].damageDone = data.damageDone;
            players[socket.id].tank.hp = data.tank.hp;
        }
    });

    socket.on("disconnect", () => {
        try {
            if (status === "playing") destroyedPlayers.push(players[socket.id])
            delete players[socket.id];
        } catch (e) {}
    })

    socket.on("game over", () => {
        startPositions = [
            {x: 0.5, y: 1, angle: 0},
            {x: 0.5, y: 75, angle: 0},
            {x: 74.5, y: 1, angle: 180},
            {x: 74.5, y: 75, angle: 180},
            {x: 45, y: 35.5, angle: 0}
        ]
        players = {}; missiles = []; destroyedPlayers = []; info = [];
    })

    socket.on("status", (data) => {status = data})
    socket.on("startPositions", (data) => {startPositions = data})
})

let players = {};
let missiles = [];
let info = [];
let destroyedPlayers = [];

let startPositions = [
    {x: 0.5, y: 1, angle: 0},
    {x: 0.5, y: 75, angle: 0},
    {x: 74.5, y: 1, angle: 180},
    {x: 74.5, y: 75, angle: 180},
    {x: 45, y: 35.5, angle: 0}
];

server.listen(3000, "0.0.0.0", () => console.log("Сервер слушает на всех интерфейсах, порт 3000"));

function cycle() {
    io.sockets.emit('state', {status, players, missiles, info, destroyedPlayers});
}

function updateMissiles(time) {
    for (let missile of missiles) {
        missile.x += (500/(3.6*3)*Math.cos(missile.angle*Math.PI/180))*time/1000;
        missile.y += (500/(3.6*3)*Math.sin(missile.angle*Math.PI/180))*time/1000;
        let collision = checkCollision(missile, 0.5, 1/6, players)

        if (collision) {
            if (collision[0].posX) {
                hit(collision[0], missile.owner);
            }
            missiles.splice(missiles.indexOf(missile), 1);
        }
    }
}

function updateRecharge(time) {
    for (let id in players) {
        if (players[id].tank.currentRecharge > 0) {
            players[id].tank.currentRecharge -= time / 1000;// я хз почему time * 2 ровно в 2 раза медленее обрабатывается перезарядка
            if (players[id].tank.currentRecharge < 0) {
                players[id].tank.currentRecharge = 0;
            }
        }
        if (players[id].tank.hitTime > 0) {
            players[id].tank.hitTime -= time / 1000;
            if (players[id].tank.hitTime < 0) {
                players[id].tank.hitTime = 0;
            }
        }
    }
}

function updateInfo(time) {
    for (let i of info) {
        if (i.time === 0) info.splice(info.indexOf(i), 1);
        i.time = Math.max(0, i.time - time);
    }
}

function hit(target, owner) {
    let ownerTank = owner.tank;
    let thisTank = target.tank;
    let struck = Math.random()
    let armor = Math.max(Math.min(0.5 - (owner.tank.penetration - target.tank.armor - 100) / 400, 1), 0)
    let damage = 0;
    if (struck > armor) {
        io.sockets.emit("звук", {sound: "попадание", name: target.name, name2: undefined})// звук попадание в танк если этот танк твой();
        let coeff = (Math.floor(Math.random() * 50) + 75) / 100;
        damage = Math.round(ownerTank.damage * coeff);
        thisTank.hp -= damage; thisTank.getDamage = damage; thisTank.hitTime = 1;
        if (thisTank.hp <= 0) {
            damage = damage+thisTank.hp
            thisTank.getDamage = damage;
            thisTank.hp = 0;
            info.push({text: `${target.tank.name} (${target.name}) 🔫 ${owner.tank.name} (${owner.name})`, time: 5000})
            destroyedPlayers.push(target);
            io.sockets.emit("звук", {sound: "танк уничтожен", name: target.name, name2: owner.name})// звук танк уничтожен()
        } else {
            io.sockets.emit("звук", {sound: "есть пробитие", name: owner.name, name2: undefined})
        }
        owner.damageDone += damage;
    } else {
        target.damageBlocked += ownerTank.damage;
        io.sockets.emit("звук", {sound: "броня не пробита", name: owner.name, name2: undefined})
        io.sockets.emit("звук", {sound: "непробитие", name: target.name, name2: undefined})
    }
    io.sockets.emit("hit", {
        name: target.name,
        name2: owner.name,
        damage: damage,
        newHp: thisTank.hp,
        isDestroyed: thisTank.hp === 0,
        damageDone: owner.damageDone,
        damageBlocked: target.damageBlocked,
    });
}

let lastUpdate = 0;
setInterval(() => {
    if (io) {
        const now = Date.now();
        const delta = now - lastUpdate;
        lastUpdate = now;

        updateInfo(delta);
        updateRecharge(delta);
        updateMissiles(delta);
        cycle();
    }
}, 1000/60)