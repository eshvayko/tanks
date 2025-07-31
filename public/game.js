const urlParams = new URLSearchParams(window.location.search);
const playerName = urlParams.get('name');
const tankName = urlParams.get('tank');
let yourPlayer, currentPlayer=structuredClone(yourPlayer); // current это тот за которым ты смотришь

socket.emit("new player", {playerName, tankName});

// let players = []; // массив с положениями, танками и др.

let oldPlayers = {}, oldStatus = "waiting", oldMissiles = [];
let convertPlayers = [], convertMissiles = [];

socket.on("state", (state) => {
    let missiles = state.missiles;
    let players = state.players;
    if (JSON.stringify(players) !== JSON.stringify(oldPlayers) || oldStatus !== state.status || JSON.stringify(oldMissiles) !== JSON.stringify(missiles)) {
        oldPlayers = players; oldMissiles = missiles;
        convertingPlayers(players);
        // convertingMissiles(missiles); todo ну хзхз
        oldStatus = state.status;
        // yourPlayer = new Player(Object.values(players)[Object.values(players).findIndex(p => p.name === playerName)]);
        // convertPlayers(serverPlayers, state.startPositions);
        if (state.status === "waiting") {
            let html = `Подключенные игроки (${Object.keys(players).length}):<br><ol>`;
            for (let socketId in players) {
                html += `<li>${players[socketId].name} - ${players[socketId].tank.name} (${players[socketId].status === "not ready" ? "не " : ""}готов)</li>`;
            }
            html += "</ol><button>Готов!</button>";
            document.querySelector("#waiting").innerHTML = html;
            if (Object.keys(players).length > 1 && Object.values(players).every(p => p.status === "ready")) {
                state.status = "start playing"
            }
        }
        else if (state.status === "start playing") {
            document.querySelector("#waiting").style.display = "none";
            document.querySelector("canvas").style.display = "block";

            window.addEventListener("keydown", (event) => {
                if (event.key === "w" || event.key === "ц") move.forward = true;
                if (event.key === "d" || event.key === "в") move.right = true;
                if (event.key === "a" || event.key === "ф") move.left = true;
                if (event.key === "s" || event.key === "ы") move.back = true;
            });
            window.addEventListener("keyup", (event) => {
                if (event.key === "w" || event.key === "ц") move.forward = false;
                if (event.key === "d" || event.key === "в") move.right = false;
                if (event.key === "a" || event.key === "ф") move.left = false;
                if (event.key === "s" || event.key === "ы") move.back = false;
            });
            window.addEventListener('mousemove', (event) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;

                // Переводим координаты мыши в мировые координаты
                mouse.x = mouseX / scale;
                mouse.y = mouseY / scale;
            });
            window.addEventListener("click", (event) => {
                if (yourPlayer.tank.hp > 0 && event.button === 0 && yourPlayer.tank.currentRecharge === 0) {
                    yourPlayer.tank.currentRecharge = yourPlayer.tank.recharge;
                    socket.emit("fire", yourPlayer);
                }
            })
            state.status = "playing";
            // сюда логику иргры (нет)
            // document.querySelector("#waiting").style.display = "none";
            // document.querySelector("canvas").style.display = "block";
            // const ctx = document.querySelector("canvas").getContext("2d");
            // ctx.fillStyle = "black";
            // ctx.fillRect(0, 0, 300, 300);
        }
        else if (state.status === "game over") {
            document.querySelector("canvas").style.display = "none";
            document.querySelector("#gameover").style.display = "block";

            let html = `Бой окончен<br>`
            for (let player of Object.values(players)) {
                html += `${player.name} - Нанес ${player.damageDone}, заблокировал - ${player.damageBlocked}<br>`;
            }
            document.querySelector("#gameover").innerHTML = html;
            state.status = "waiting";
            convertingPlayers([]);
            socket.emit("game over")
        }
        const button = document.querySelector("button")
        button.onclick = () => socket.emit("ready");
        socket.emit("status", state.status);
    }
    // if (state.status === "playing") {
    //     gameLoop();
    // }
})

// function convertingPlayers() {
//     convertPlayers = [];
//     for (let pl of Object.values(oldPlayers)) {
//         if (pl.name === playerName) yourPlayer = new Player(pl);
//         convertPlayers.push(new Player(pl))
//     }
// }
function convertingPlayers(players) {
    const newConvertPlayers = [];

    for (let pl of Object.values(players)) {
        if (pl.tank.hp <= 0) continue;
        if (pl.name === playerName) {
            // Для своего игрока
            if (yourPlayer) {
                // Обновляем только серверные свойства
                yourPlayer.status = pl.status;
                yourPlayer.tank.hp = pl.tank.hp;
                yourPlayer.tank.currentRecharge = pl.tank.currentRecharge;
                yourPlayer.tank.getDamage = pl.tank.getDamage;
                yourPlayer.tank.hitTime = pl.tank.hitTime;
                yourPlayer.damageDone = pl.damageDone;
                yourPlayer.damageBlocked = pl.damageBlocked;
            } else {
                yourPlayer = new Player(pl);
            }
            if (yourPlayer.tank.hp > 0) {newConvertPlayers.push(yourPlayer); currentPlayer = structuredClone(yourPlayer);}
        } else {
            // Для других игроков
            const existing = convertPlayers.find(p => p.name === pl.name);
            if (existing) {
                // Обновляем все свойства
                Object.assign(existing, pl);
                // Обновляем свойства танка
                Object.assign(existing.tank, pl.tank);
                newConvertPlayers.push(existing);
            } else {
                newConvertPlayers.push(new Player(pl));
            }
        }
    }

    convertPlayers = newConvertPlayers;
}

function convertingMissiles(missiles) {
    let newConvertMissiles = [];
    for (let missile of missiles) {
        let existing = convertMissiles.find(m => m.num === missile.num)
        if (existing) {
            Object.assign(existing, missile);
            Object.assign(existing.owner, missile.owner);
            Object.assign(existing.owner.tank, missile.owner.tank);
            newConvertMissiles.push(existing);
        } else {
            newConvertMissiles.push(new Missile(missile.num, missile.x, missile.y, missile.angle, missile.owner, missile.timeHit));
        }
    }
    convertMissiles = newConvertMissiles;
}

// function convertPlayers(serverPlayers, startPositions) {
//     for (let player of players) { // удаление вышедших игроков
//         if (!Object.values(serverPlayers).some(p => p.name === player.name)) {
//             players.splice(players.indexOf(player), 1);
//         }
//     }
//     for (let socketId in serverPlayers) {
//         let currentPLayer = players[players.findIndex(p => p.name === serverPlayers[socketId].name)];
//         if (!currentPLayer) {
//             let index = Math.floor(Math.random() * startPositions.length)
//             let position = startPositions[index];
//             startPositions.splice(index, 1);
//             socket.emit("startPositions", startPositions);
//             players.push(new Player(serverPlayers[socketId].name, position.x, position.y, position.angle, 0, tanks["FV215b 183"]()));
//         }
//     }
//     yourPlayer = players[players.findIndex(p => p.name === playerName)];
// }

// function initGame() {
//     document.querySelector("#waiting").style.display = "none";
//     document.querySelector("canvas").style.display = "block";
//     console.log("инициализация...")
// }
//
// function gameLoop() {
//     ctx.clearRect(0, 0, 300, 300);
//     ctx.fillStyle = "black";
//     ctx.fillRect(0, 0, 300, 300);
// }