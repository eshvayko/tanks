const socket = io();

const urlParams = new URLSearchParams(window.location.search);
const playerName = urlParams.get('name');

socket.emit("new player", playerName)

let oldPlayers = null, oldStatus = null;

socket.on("state", (state) => {
    let players = state.players;
    if (JSON.stringify(players) !== JSON.stringify(oldPlayers) || oldStatus !== state.status) {
        oldPlayers = players; oldStatus = state.status;
        if (state.status === "waiting") {
            let html = `Подключенные игроки (${Object.keys(players).length}):<br><ol>`;
            for (let socketId in players) {
                html += `<li>${players[socketId].name} (${players[socketId].status === "not ready" ? "не " : ""}готов)</li>`;
            }
            html += "</ol><button>Готов!</button>";
            document.querySelector("#waiting").innerHTML = html;
            if (Object.keys(players).length > 1 && Object.values(players).every(p => p.status === "ready")) {state.status = "playing"}
        } else if (state.status === "playing") {
            // сюда логику иргры
            document.querySelector("#waiting").style.display = "none";
            document.querySelector("canvas").style.display = "block";
            const ctx = document.querySelector("canvas").getContext("2d");
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 300, 300);
        }
        socket.emit("status", state.status);
        const button = document.querySelector("button")
        button.onclick = () => socket.emit("ready");
    }
})

function gameLoop(players) {

}
