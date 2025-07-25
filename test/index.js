let map = `
...#.....................................................................#...
...#.....................................................................#...
.............................................................................
##.........................................................................##
.............................................................................
.............................................................................
.............................................................................
..........................................##.................................
..........................................##.................................
..........................................##.................................
..........................................##.................................
..........................................##.................................
..........................................##.................................
.............................................................................
.............................................................................
.............................................................................
........###############............###############################...........
.............................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
....#........................................................................
.............................................................................
.............................................................................
......############################################################...........
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
...............#.............................................................
...............#.............................................................
...............#...........################################################..
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
...............#.............................................................
.............................................................................
.....................................#.......................................
.....................................#.......................................
.....................................#.......................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
.............................................................................
##.........................................................................##
.............................................................................
...#.....................................................................#...
...#.....................................................................#...
`.trim().split("\n").map(m => m.split(""));

class Player {
    constructor(name, posX, posY, angle, turretAngle, tank) {
        this.name = name;
        this.posX = posX;
        this.posY = posY;
        this.angle = angle;
        this.turretAngle = turretAngle;
        this.tank = tank;
        this.currentSpeed = 0; // Текущая скорость (в клетках/сек)
        this.acceleration = 0; // Текущее ускорение
        this.targetSpeed = 0;  // Целевая скорость
        this.oldPos = {x: null, y: null, angle: null};
    }

    drawInfoForOtherPlayers(translateX, translateY) { // эта инфа будет рисоваться только для остальных игроков
        cx.save();
        cx.translate(translateX + scale, translateY + 0.5*scale);
        cx.fillStyle = "red";
        cx.font = `bold ${scale/2.06}px monospace`;
        cx.fillText(this.tank.name, -(0.28*this.tank.name.length / 2)*scale, -2*scale);

        cx.font = `${scale/2.5}px monospace`;
        cx.fillText(this.name, -(0.24*this.name.length / 2)*scale, -1.6*scale);

        cx.fillStyle = "black";
        cx.fillRect(-1*scale, -1.4*scale, scale*2, scale/2)
        cx.fillStyle = "red";
        cx.fillRect(-1*scale+1, -1.4*scale+1, this.tank.hp/this.tank.maxHp*(scale*2-2), scale/2-2)
        cx.fillStyle = "white"; cx.font = `${scale/3.09}px monospace`;
        let text = `${this.tank.hp}/${this.tank.maxHp}`;
        cx.fillText(text, -(0.2*text.length/2)*scale, -1.03*scale) // адаптация под длину шрифта

        // cx.fillStyle = "red";
        // cx.font = "18px monospace";
        // cx.fillText(this.name, -(0.213*this.name.length / 2)*scale, -1.2*scale);
        cx.restore();
    }

    drawInfoForPlayer() { // а эта только для тебя
        cx.fillStyle = "black";
        cx.fillRect(innerWidth/2-scale*7.5, innerHeight*0.95, scale*15, scale)
        let ratio = this.tank.hp/this.tank.maxHp;
        cx.fillStyle = getColorByRatio(ratio); // #ff0000 - красный; #ffff00 - желтый; #00ff00 - зеленый
        cx.fillRect(innerWidth/2-scale*7.5+1, innerHeight*0.95+1, scale*15*ratio-2, scale-2)
        cx.font = `bold ${scale/1.6}px monospace`;
        cx.fillStyle = "gray";
        let text = `${this.tank.hp}/${this.tank.maxHp}`;
        cx.fillText(text, innerWidth/2-scale*0.19*text.length, innerHeight*0.974)
        cx.font = `${scale/2}px monospace`; cx.fillStyle = "black"
        cx.fillText(`${Math.ceil(this.currentSpeed * 3 * 3.6)}км/ч`, innerWidth/2-scale*10, innerHeight*0.974)
    }

    draw() {
        cx.save();
        let translateX, translateY;
        if (viewport.y === 0) translateY = this.posY*scale;
        else if (viewport.y === map.length-viewport.height) translateY = (viewport.height - (map.length - this.posY))*scale
        else translateY = innerHeight / 2;
        if (viewport.x === 0) translateX = this.posX*scale;
        else if (viewport.x === map[0].length-viewport.width) translateX = (viewport.width - (map[0].length - this.posX))*scale
        else translateX = innerWidth / 2;

        if (this.name !== "eshvayko") {translateX = (this.posX - viewport.x) * scale; translateY = (this.posY - viewport.y) * scale;}
        cx.translate(translateX + scale, translateY + 0.5*scale);
        cx.fillStyle = "green";
        cx.rotate(this.angle*Math.PI/180);
        cx.fillRect(-1*scale, -0.5*scale, scale*2, scale)
        cx.fillStyle = "#005500";
        cx.beginPath();
        cx.arc(0, 0, scale/3, 0, 7);
        cx.fill();
        cx.rotate(this.turretAngle*Math.PI/180)
        cx.fillStyle = "black"
        cx.fillRect(-weaponSize / 2, -weaponSize / 2, scale*2, weaponSize);
        if (this.name !== "eshvayko") {cx.restore(); this.drawInfoForOtherPlayers(translateX, translateY);}
        else {
            cx.fillStyle = "red";
            cx.fillRect(-weaponSize / 2+scale*2, 0, scale*20, 1);
            cx.restore();
            this.drawInfoForPlayer();
        }

        // let corners = this.getPlayerCorners();
        // corners.forEach(corner => {
        //     const screenX = (corner.x - viewport.x) * scale;
        //     const screenY = (corner.y - viewport.y) * scale;
        //
        //     cx.fillStyle = "red";
        //     cx.beginPath();
        //     cx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        //     cx.fill();
        // });
    }

    getPlayerCorners() {
        const centerX = this.posX+1;
        const centerY = this.posY+0.5;
        const angleRad = this.angle * Math.PI / 180;

        // Размеры танка в мировых единицах
        const length = 2; // 2 клетки (1 клетка = 3 метра)
        const width = 1;  // 1 клетка

        // Половины размеров
        const halfLength = length / 2;
        const halfWidth = width / 2;

        // Углы в локальной системе координат
        const cornersLocal = [
            { x: -halfLength, y: -halfWidth }, // задний левый
            { x:  halfLength, y: -halfWidth }, // передний левый
            { x:  halfLength, y:  halfWidth }, // передний правый
            { x: -halfLength, y:  halfWidth }  // задний правый
        ];

        // Поворачиваем и преобразуем в мировые координаты
        return cornersLocal.map(corner => {
            // Применяем поворот
            const rotatedX = corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad);
            const rotatedY = corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad);

            // Возвращаем абсолютные мировые координаты
            return {
                x: centerX + rotatedX,
                y: centerY + rotatedY
            };
        });
    }

    update(time) {
        if (time > 100) return; // при сворачивании окна
        // Конвертируем скорости танка в клетки/сек (1 клетка = 3 метра)
        const maxForwardSpeed = this.tank.speed / (3.6 * 3);
        const maxBackSpeed = this.tank.backSpeed / (3.6 * 3);
        // Ускорение вперед (10 сек до макс. скорости)
        const accelerationForward = maxForwardSpeed / 10;
        // Ускорение назад (2 сек до макс. скорости)
        const accelerationBack = maxBackSpeed / 2;
        // Замедление (1 сек до остановки)
        const deceleration = maxForwardSpeed;
        // Определяем целевую скорость
        if (move.forward) {
            this.targetSpeed = maxForwardSpeed;
        } else if (move.back) {
            this.targetSpeed = -maxBackSpeed; // Отрицательная скорость для движения назад
        } else {
            this.targetSpeed = 0;
        }
        // Рассчитываем ускорение/замедление
        if (this.targetSpeed > 0) {
            // Движение вперед
            this.acceleration = this.currentSpeed < this.targetSpeed ? accelerationForward : -deceleration;
        } else if (this.targetSpeed < 0) {
            // Движение назад
            this.acceleration = this.currentSpeed > this.targetSpeed ? -accelerationBack : deceleration;
        } else {
            // Торможение
            this.acceleration = this.currentSpeed > 0 ? -deceleration : deceleration;
        }
        // Обновляем скорость с учетом ускорения
        this.currentSpeed += roundToSigns(this.acceleration * time / 1000, 6);
        // Ограничиваем скорость в допустимых пределах
        if (this.targetSpeed > 0) {
            this.currentSpeed = Math.min(Math.max(this.currentSpeed, 0), maxForwardSpeed);
        } else if (this.targetSpeed < 0) {
            this.currentSpeed = Math.max(Math.min(this.currentSpeed, 0), -maxBackSpeed);
        } else {
            // Гарантируем остановку при торможении
            if (Math.abs(this.currentSpeed) < 0.1) this.currentSpeed = 0;
        }
        // Поворот танка
        if (move.right && !isBlock()) this.angle += this.tank.rotationSpeed * time/1000;
        else if (move.left && !isBlock()) this.angle -= this.tank.rotationSpeed * time/1000;
        // Перемещение
        const moveDist = this.currentSpeed * time/1000;
        this.posX += moveDist * Math.cos(this.angle * Math.PI/180);
        this.posY += moveDist * Math.sin(this.angle * Math.PI/180);

        this.updateTurretAngle(time);
        this.checkCollision();
        this.oldPos = {x: this.posX, y: this.posY, angle: this.angle};
    }

    updateTurretAngle(time) {
        mouse.x += viewport.x;
        mouse.y += viewport.y;
        // Вычисляем вектор от танка к курсору
        const dx = mouse.x - (this.posX + 1);
        const dy = mouse.y - (this.posY + 0.5);

        const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        // Вычисляем относительный угол башни (относительно корпуса)
        let targetTurretAngle = targetAngle - this.angle;
        // Нормализуем угол в диапазон [-180, 180]
        targetTurretAngle = ((targetTurretAngle + 180) % 360 + 360) % 360 - 180;
        // Вычисляем разницу между текущим и целевым углом
        let diff = targetTurretAngle - this.turretAngle;
        // Корректируем разницу для кратчайшего пути поворота
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        // Максимальный возможный поворот за этот кадр
        const maxRotation = this.tank.turretRotSpeed * time / 1000;
        // Определяем фактический поворот
        let actualRotation = 0;
        if (Math.abs(diff) <= maxRotation) {
            actualRotation = diff;
        } else {
            actualRotation = Math.sign(diff) * maxRotation;
        }
        // Применяем поворот
        this.turretAngle += actualRotation;
        // Нормализуем угол башни
        this.turretAngle = ((this.turretAngle + 180) % 360 + 360) % 360 - 180;
        mouse.x -= viewport.x;
        mouse.y -= viewport.y;
    }

    checkCollision() {
        let corners = this.getPlayerCorners();
        for (let corner of corners) {
            if (corner.y < 0 || corner.y > map.length || corner.x < 0 || corner.x > map[0].length || map[Math.floor(corner.y)][Math.floor(corner.x)] === "#") {
                this.stop();
                return;
            }
        }
        for (let pl of players) {
            if (pl.name === this.name) continue;
            if (Math.hypot(pl.posX - this.posX, pl.posY - this.posY) <= 1) {
                this.stop(); return;
            }
        }
    }

    stop() {
        this.currentSpeed = 0;
        this.acceleration = 0;
        this.posX = this.oldPos.x;
        this.posY = this.oldPos.y;
        this.angle = this.oldPos.angle;
    }
}

class Tank {
    constructor(name, hp, armor, recharge, penetration, damage, speed, backSpeed, rotationSpeed, turretRotSpeed) {
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.armor = armor;
        this.recharge = recharge;
        this.penetration = penetration;
        this.damage = damage;
        this.speed = speed;
        this.backSpeed = backSpeed;
        this.rotationSpeed = rotationSpeed;
        this.turretRotSpeed = turretRotSpeed;
    }

    shot() {

    }
}

class Missile {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
    }

    draw() {
        cx.save();
        const screenX = (this.x - viewport.x) * scale;
        const screenY = (this.y - viewport.y) * scale;

        cx.translate(screenX, screenY);
        cx.rotate(this.angle * Math.PI / 180);
        cx.fillStyle = "orange";
        cx.fillRect(-scale / 4, -weaponSize / 2, scale / 2, weaponSize);
        cx.restore();
    }

    update(time) {
        this.x += (missileSpeed/(3.6*3)*Math.cos(this.angle*Math.PI/180))*time/1000;
        this.y += (missileSpeed/(3.6*3)*Math.sin(this.angle*Math.PI/180))*time/1000;
        this.draw();
    }
}

const tanks = {
    // потом добавить бабаху
    "ИС-7": new Tank("ИС-7", 2550, 240, 11.4, 268, 460, 42, 15, 34.91, 19.68),
    "STB-1": new Tank("STB-1", 1850, 165, 6.42, 245, 330, 55, 20, 52.57, 43.81),
    "Leopard 1": new Tank("Leopard 1", 1800, 52, 6.23, 255, 360, 65, 23, 59.14, 37.55)
};

const canvas = document.querySelector('canvas');
const cx = canvas.getContext("2d");

const innerWidth = window.innerWidth;
const innerHeight = window.innerHeight;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scale = innerHeight / 30; // 1 scale = 3 метра;

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

function isBlock() {
    return move.blockUp || move.blockRight || move.blockLeft || move.blockDown;
}

function getColorByRatio(ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    let red, green;

    if (r <= 0.5) {
        // От красного к желтому
        red = 255;
        green = Math.round(510 * r); // 255 * 2 * r
    } else {
        // От желтого к зеленому
        red = Math.round(510 - 510 * r); // 255 * 2 * (1 - r)
        green = 255;
    }

    return `rgb(${red}, ${green}, 0)`;
}

let viewport = {
    x: 0,
    y: 0,
    width: innerWidth / scale,
    height: innerHeight / scale
}

function roundToSigns(a, s=0, strOrNum=true){
    return strOrNum ? Number(a.toFixed(s)) : a.toFixed(s);
}

function drawMap() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            if (map[y][x] === "#") {
                cx.fillStyle = "black";
            } else cx.fillStyle = "lightgray";
            cx.fillRect(scale*(x-viewport.x), scale*(y-viewport.y), scale + 1, scale + 1)
        }
    }
}

let missiles = [];

let mouse = {x: null, y: null};
let missileSpeed = 500;
let player = new Player("eshvayko", 0.5, 1, 0, 0, tanks["Leopard 1"])
let player2 = new Player("хз кто", 25, 56, 0, 270, tanks["ИС-7"])
let weaponSize = scale / 6;

let players = [player, player2];

function updateAndDrawMissiles(time) {
    missiles.forEach(m => m.update(time));
}

function correctViewport() {
    let viewportX = player.posX - viewport.width / 2;
    let viewportY = player.posY - viewport.height / 2;
    if (viewportX < 0) viewportX = 0;
    else if (viewportX > map[0].length-viewport.width) viewportX = map[0].length-viewport.width;
    if (viewportY < 0) viewportY = 0;
    else if (viewportY > map.length-viewport.height) viewportY = map.length-viewport.height;

    viewport.x = viewportX;
    viewport.y = viewportY;
}

function runAnimation() {
    let lastTime = null;
    function frame(time) {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        player.update(lastTime === null ? time : time - lastTime);
        correctViewport();
        drawMap();
        updateAndDrawMissiles(lastTime === null ? time : time - lastTime);
        player2.draw();
        player.draw();
        lastTime = time;
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

runAnimation();
window.addEventListener("keydown", (event) => {
    if (event.key === "w") move.forward = true;
    if (event.key === "d") move.right = true;
    if (event.key === "a") move.left = true;
    if (event.key === "s") move.back = true;
});
window.addEventListener("keyup", (event) => {
    if (event.key === "w") move.forward = false;
    if (event.key === "d") move.right = false;
    if (event.key === "a") move.left = false;
    if (event.key === "s") move.back = false;
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
    if (event.button === 0) {
        missiles.push(new Missile(player.posX+1, player.posY+0.5, player.angle+player.turretAngle, player))
    }
})

// todo
//  0. стрельба по клику мыши, там массив снарядов получается => создать класс снарядов, выводить сколько осталось до перезарядки;
//  1. проверка столкновений с игроком;
//  2. попробовать спрайт танка;