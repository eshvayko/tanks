const socket = io();

const canvas = document.querySelector('canvas');
const cx = canvas.getContext("2d");

const innerWidth = window.innerWidth;
const innerHeight = window.innerHeight;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scale = innerHeight / 30;

let mouse = {x: null, y: null};
let missileSpeed = 500;
let weaponSize = scale / 6;

let move = {
    forward: false,
    right: false,
    back: false,
    left: false,
    blockUp: false,
    blockDown: false,
    blockRight: false,
    blockLeft: false
}

let viewport = {
    x: 0,
    y: 0,
    width: innerWidth / scale,
    height: innerHeight / scale
}

function drawMap() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === "#") {
                cx.fillStyle = "black";
            } else if (map[y][x] === "*") {
                cx.fillStyle = "#00aa00";
            } else cx.fillStyle = "lightgray";
            cx.fillRect(scale*(x-viewport.x), scale*(y-viewport.y), scale + 1, scale + 1)
        }
    }
}

function correctViewport(player=yourPlayer) {
    let viewportX = player.posX - (viewport.width / 2 - 1);
    let viewportY = player.posY - (viewport.height / 2 - 0.5);
    if (viewportX < 0) viewportX = 0;
    else if (viewportX > map[0].length-viewport.width) viewportX = map[0].length-viewport.width;
    if (viewportY < 0) viewportY = 0;
    else if (viewportY > map.length-viewport.height) viewportY = map.length-viewport.height;

    viewport.x = viewportX;
    viewport.y = viewportY;
}

function updateMissiles(time) {
    convertMissiles.forEach((missile) => {
        if (missile.owner.name === playerName) missile.update(time);
    })
    socket.emit("update missiles", convertMissiles);
}

function drawMissiles() {
    for (let missile of oldMissiles) {
        const screenX = (missile.x - viewport.x) * scale;
        const screenY = (missile.y - viewport.y) * scale;
        cx.save();
        cx.translate(screenX, screenY);
        cx.rotate(missile.angle * Math.PI / 180);
        cx.fillStyle = "blue";
        cx.fillRect(-scale / 4, -weaponSize / 2, scale / 2, weaponSize);
        cx.restore();
    }
}

socket.on("recharge", ({name}) => {
    const player = convertPlayers.find(p => p.name === name);
    if (player) player.currentRecharge = player.recharge;
})

socket.on("звук", (data) => {
    if (data.sound === "попадание" && (yourPlayer.name === data.name)) {(new Audio("/sounds/попадание.mp3")).play(); console.log("попадание в меня")}
    else if (data.sound === "танк уничтожен" && (yourPlayer.name === data.name || yourPlayer.name === data.name2)) {(new Audio("/sounds/уничтожен.mp3")).play(); console.log("танк уничтожен")}
    else if (data.sound === 'есть пробитие' && yourPlayer.name === data.name) {(new Audio("/sounds/есть пробиьие.mp3")).play(); console.log("есть пробитие")}
    else if (data.sound === "броня не пробита" && yourPlayer.name === data.name) {(new Audio("/sounds/броня не пробитв.mp3")).play(); console.log("броня не пробита")}
})

socket.on("hit", ({name, name2, damage, newHp, isDestroyed, damageDone, damageBlocked}) => {
    const player = convertPlayers.find(p => p.name === name);
    const player2 = convertPlayers.find(p => p.name === name2);
    if (player) {
        player.tank.hp = newHp; // Сразу устанавливаем актуальное HP
        if (damage !== 0) {player.tank.getDamage = damage; player.tank.hitTime = 1;}
        player2.damageDone = damageDone;
        player.damageBlocked = damageBlocked;

        if (isDestroyed) {
            convertPlayers.splice(convertPlayers.indexOf(player), 1);
            if (name === yourPlayer.name) {
                window.addEventListener("click", (event) => {
                    if (event.button === 0) {
                        const rect = canvas.getBoundingClientRect();
                        const mouseX = event.clientX - rect.left;

                        if (mouseX < innerWidth/2) {
                            currentPlayer = convertPlayers[(convertPlayers.findIndex(p => p.name === currentPlayer.name)+1)%convertPlayers.length];
                        } else if (mouseX > innerWidth/2) {
                            let index = convertPlayers.findIndex(p => p.name === currentPlayer.name)-1;
                            if (index < 0) index = convertPlayers.length-1;
                            currentPlayer = convertPlayers[index];
                        }
                    }
                })
            }
        }
    }
});

socket.on("state", (state) => {
    if (state.status === "playing") {
        if (convertPlayers.length <= 1) state.status = "game over";
        let time = 1000/60;
        cx.clearRect(0, 0, canvas.width, canvas.height);
        if (yourPlayer.tank.hp > 0) yourPlayer.update(time);
        correctViewport(currentPlayer);
        drawMap();
        drawMissiles();
        for (let pl of convertPlayers) {
            if (!isInBush(pl) || Math.hypot(pl.posX - yourPlayer.posX, pl.posY - yourPlayer.posY) < 10 || pl.name === yourPlayer.name || pl.name === currentPlayer.name) pl.draw(time)
            else pl.draw(time, true);
        }
        if (yourPlayer.tank.hp > 0) yourPlayer.drawInfoForPlayer(time);
        // updateMissiles(time); todo ну хз
        socket.emit("movement", {
            posX: yourPlayer.posX,
            posY: yourPlayer.posY,
            angle: yourPlayer.angle,
            turretAngle: yourPlayer.turretAngle,
            currentSpeed: yourPlayer.currentSpeed,
            acceleration: yourPlayer.acceleration,
            targetSpeed: yourPlayer.targetSpeed,
            oldPos: yourPlayer.oldPos,
            damageDone: yourPlayer.damageDone,
            damageBlocked: yourPlayer.damageBlocked,
            tank: {
                hp: yourPlayer.tank.hp,
                currentRecharge: yourPlayer.tank.currentRecharge,
            }
        });
    }
})