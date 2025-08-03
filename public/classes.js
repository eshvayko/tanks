class Player {
    constructor(data) {
        this.name = data.name;
        this.posX = data.posX;
        this.posY = data.posY;
        this.angle = data.angle;
        this.turretAngle = data.turretAngle;
        this.tank = data.tank;
        this.currentSpeed = data.currentSpeed; // Текущая скорость (в клетках/сек)
        this.acceleration = data.acceleration; // Текущее ускорение
        this.targetSpeed = data.targetSpeed;  // Целевая скорость
        this.oldPos = data.oldPos;
        this.status = data.status;
        this.damageDone = data.damageDone;
        this.damageBlocked = data.damageBlocked;
    }

    drawInfoForOtherPlayers(translateX, translateY, time, bash=false) { // эта инфа будет рисоваться только для остальных игроков
        if (!bash) {
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

            if (this.tank.hitTime > 0) {
                cx.fillStyle = "#ff6600";
                let text = `-${this.tank.getDamage}`
                cx.fillRect(1.4*scale, -1.4*scale, 1.1*scale, scale/2);
                cx.fillStyle = "white";
                cx.fillText(text, 1.5*scale, -1.03*scale)
            }
            cx.restore();
        }
    }

    drawInfoForPlayer(time) { // а эта только для тебя
        cx.fillStyle = "black";
        cx.fillRect(innerWidth/2-scale*7.5, innerHeight*0.95, scale*15, scale)
        let ratio = this.tank.hp/this.tank.maxHp;
        cx.fillStyle = getColorByRatio(ratio);
        cx.fillRect(innerWidth/2-scale*7.5+1, innerHeight*0.95+1, scale*15*ratio-2, scale-2)
        cx.font = `bold ${scale/1.6}px monospace`;
        cx.fillStyle = "gray";
        let text = `${this.tank.hp}/${this.tank.maxHp}`;
        cx.fillText(text, innerWidth/2-scale*0.19*text.length, innerHeight*0.974)

        text = `${this.currentSpeed < 0 ? Math.floor(this.currentSpeed * 3 * 3.6) : Math.ceil(this.currentSpeed * 3 * 3.6)}км/ч`
        cx.font = `bold ${scale/2}px monospace`; cx.fillStyle = "black"; cx.strokeStyle = "lightgray";
        cx.strokeText(text, innerWidth/2-scale*10, innerHeight*0.974)
        cx.font = `${scale/2}px monospace`
        cx.fillText(text, innerWidth/2-scale*10, innerHeight*0.974)

        cx.font = `bold ${scale/2}px monospace`;
        cx.fillStyle = this.tank.currentRecharge === 0 ? "black" : "red";
        cx.strokeText(`${roundToSigns(this.tank.currentRecharge, 1, false)} c`, innerWidth/2+scale*8, innerHeight*0.974)
        cx.font = `${scale/2}px monospace`
        cx.fillText(`${roundToSigns(this.tank.currentRecharge, 1, false)} c`, innerWidth/2+scale*8, innerHeight*0.974)

        if (this.tank.hitTime > 0) {
            let damageRatio = this.tank.getDamage / this.tank.maxHp;
            cx.fillStyle = "#ff6600";
            let text = `-${this.tank.getDamage}`;
            cx.font = `${scale/2}px monospace`;
            cx.fillRect(innerWidth/2-scale*7.5+scale*15*ratio+1, innerHeight*0.95+1, scale*15*damageRatio-2, scale-2)
            cx.fillStyle = "white"
            cx.fillText(text, (innerWidth/2-scale*7.5)+scale*15*ratio + scale*15*damageRatio/2 - 0.15*scale*text.length, innerHeight*0.973)
        }
    }

    draw(time, info, bash=false) {
        let translateX, translateY;
        if (bash) {
            cx.fillStyle = "#00aa00";
            cx.save();
            if (viewport.y === 0) translateY = this.posY*scale;
            else if (viewport.y === map.length-viewport.height) translateY = (viewport.height - (map.length - this.posY))*scale
            else translateY = innerHeight / 2 - scale/2;
            if (viewport.x === 0) translateX = this.posX*scale;
            else if (viewport.x === map[0].length-viewport.width) translateX = (viewport.width - (map[0].length - this.posX))*scale
            else translateX = innerWidth / 2 - scale;

            if (this.name !== yourPlayer.name) {translateX = (this.posX - viewport.x) * scale; translateY = (this.posY - viewport.y) * scale;}
            cx.translate(translateX + scale, translateY + 0.5*scale);
            cx.rotate(this.angle*Math.PI/180);
            cx.fillRect(-1*scale, -0.5*scale, scale*2, scale)
            cx.beginPath();
            cx.arc(0, 0, scale/3, 0, 7);
            cx.fill();
            cx.rotate(this.turretAngle*Math.PI/180)
            cx.fillRect(-weaponSize / 2, -weaponSize / 2, scale*1.8, weaponSize);
        } else {
            cx.save();
            if (viewport.y === 0) translateY = this.posY*scale;
            else if (viewport.y === map.length-viewport.height) translateY = (viewport.height - (map.length - this.posY))*scale
            else translateY = innerHeight / 2 - scale/2;
            if (viewport.x === 0) translateX = this.posX*scale;
            else if (viewport.x === map[0].length-viewport.width) translateX = (viewport.width - (map[0].length - this.posX))*scale
            else translateX = innerWidth / 2 - scale;

            if (this.name !== yourPlayer.name) {translateX = (this.posX - viewport.x) * scale; translateY = (this.posY - viewport.y) * scale;}
            cx.translate(translateX + scale, translateY + 0.5*scale);
            cx.fillStyle = "green";
            cx.rotate(this.angle*Math.PI/180);
            cx.drawImage(document.querySelector("#tank"), 0, 0, 750, 530, -1*scale, -0.5*scale, scale*2, scale)
            cx.fillStyle = "#005500";
            cx.rotate(this.turretAngle*Math.PI/180)
            cx.drawImage(document.querySelector("#turret"), 0, 0, 740, 290, -scale*0.39, -scale*0.39, scale*2, scale*0.78)
        }
        if (this.name !== yourPlayer.name) {cx.restore(); this.drawInfoForOtherPlayers(translateX, translateY, time, bash);}
        else {
            cx.fillStyle = "red";
            cx.fillRect(-weaponSize / 2+scale*1.7, 0, scale*20, 1);
            cx.restore();
            this.drawInfoForPlayer();
        }
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
            if (this.currentSpeed === 0) this.acceleration = 0;
        }
        // console.log(`цель:${this.targetSpeed}\ncurrentSpeed до: ${this.currentSpeed}\nчто прибавляем: acceleration: ${this.acceleration} ${roundToSigns(this.acceleration * time / 1000, 6)}\n currentSpeed после: ${this.currentSpeed+roundToSigns(this.acceleration * time / 1000, 6)}`);
        // Обновляем скорость с учетом ускорения
        let oldSpeed = this.currentSpeed;
        this.currentSpeed += roundToSigns(this.acceleration * time / 1000, 6);

        if (Math.sign(oldSpeed) !== Math.sign(this.currentSpeed) && Math.sign(oldSpeed) !== 0 && Math.sign(this.currentSpeed) !== 0) this.currentSpeed = 0;
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
        if (move.right && !isBlock()) this.angle = (this.angle + this.tank.rotationSpeed * time/1000) % 360;
        else if (move.left && !isBlock()) this.angle = (this.angle - this.tank.rotationSpeed * time/1000) % 360;
        // Перемещение
        const moveDist = this.currentSpeed * time/1000;
        this.posX += moveDist * Math.cos(this.angle * Math.PI/180);
        this.posY += moveDist * Math.sin(this.angle * Math.PI/180);

        this.updateTurretAngle(time);
        if (checkCollision(this)) this.stop();
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
        if (this.turretAngle > this.tank.maxRotateTurret) this.turretAngle = this.tank.maxRotateTurret;
        if (this.turretAngle < -this.tank.maxRotateTurret) this.turretAngle = -this.tank.maxRotateTurret;
        mouse.x -= viewport.x;
        mouse.y -= viewport.y;
    }

    stop() {
        this.currentSpeed = 0;
        this.acceleration = 0;
        this.posX = this.oldPos.x;
        this.posY = this.oldPos.y;
        this.angle = this.oldPos.angle;
    }

    hit(tank) {
        let armor = this.tank.armor / 400;
        armor -= tank.penetration / 2000;
        if (armor < 0) armor = 0;
        let struck = Math.random();
        if (struck > armor) {
            if (JSON.stringify(this.tank) === JSON.stringify(yourPlayer.tank)) console.log("в нас попали!");
            let coeff = (Math.floor(Math.random() * 50) + 75) / 100;
            let damage = Math.round(tank.damage * coeff);
            this.tank.hp -= damage; this.tank.getDamage = damage; this.tank.hitTime = 1;
            if (this.tank.hp <= 0) {
                if (JSON.stringify(tank) === JSON.stringify(yourPlayer.tank)) console.log("танк уничтожен")
                this.tank.getDamage = damage+this.tank.hp;
                this.tank.hp = 0;
                convertPlayers.splice(convertPlayers.findIndex(p => p.name === this.name), 1)
            } else {
                if (JSON.stringify(tank) === JSON.stringify(yourPlayer.tank)) console.log("есть пробитие")
            }
        } else {
            if (JSON.stringify(tank) === JSON.stringify(yourPlayer.tank)) console.log("броня не пробита")
        }
    }
}

class Missile {
    constructor(num, x, y, angle, owner, timeHit=0) {
        this.num = num;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.timeHit = timeHit;
    }

    draw(hit, time=null) {
        console.log("рисование снаряда")
        const screenX = (this.x - viewport.x) * scale;
        const screenY = (this.y - viewport.y) * scale;
        if (hit) this.timeHit = 0.5;
        if (this.timeHit > 0) {
            this.timeHit -= time/1000;
            if (this.timeHit <= 0) {this.timeHit = 0; this.delete()}
            cx.fillStyle = "orange";
            cx.beginPath();
            cx.arc(screenX+scale/4, screenY+weaponSize/2, 5, 0, 7)
            cx.fill();
        } else {
            cx.save();
            cx.translate(screenX, screenY);
            cx.rotate(this.angle * Math.PI / 180);
            cx.fillStyle = "blue";
            cx.fillRect(-scale / 4, -weaponSize / 2, scale / 2, weaponSize);
            cx.restore();
        }
    }

    update(time) {
        let hit = false
        if (this.timeHit === 0) {
            this.x += (missileSpeed/(3.6*3)*Math.cos(this.angle*Math.PI/180))*time/1000;
            this.y += (missileSpeed/(3.6*3)*Math.sin(this.angle*Math.PI/180))*time/1000;
            let collision = checkCollision(this, 0.5, 1/6)

            if (collision) {
                hit = true;
                if (collision[0] instanceof Player) {
                    collision[0].hit(this.owner.tank);
                }
            }
        }
        this.draw(hit, time);
    }

    delete() {
        let index = convertMissiles.findIndex(m => m !== undefined && m.num === this.num);
        convertMissiles.splice(index, 1);
    }
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

function isInBush(pl) {
    let corners = getCorners(pl);
    for (let corner of corners) {
        if (map[Math.floor(corner.y)][Math.floor(corner.x)] === "*") return true;
    }
    return false;
}

function checkDot(dotX, dotY, centerX, centerY, angle) {
    let x1 = dotX - centerX;
    let y1 = dotY - centerY;

    let thetaRad = -angle * Math.PI / 180;

    let x2 = x1 * Math.cos(thetaRad) - y1 * Math.sin(thetaRad);
    let y2 = x1 * Math.sin(thetaRad) + y1 * Math.cos(thetaRad);

    return Math.abs(x2) <= 1 && Math.abs(y2) <= 0.5;
}

function roundToSigns(a, s=0, strOrNum=true){
    return strOrNum ? Number(a.toFixed(s)) : a.toFixed(s);
}

function isBlock() {
    return move.blockUp || move.blockRight || move.blockLeft || move.blockDown;
}

function checkCollision(obj, length=2, width=1) {
    let corners = getCorners(obj, length, width);
    for (let corner of corners) {
        if (corner.y < 0 || corner.y > map.length || corner.x < 0 || corner.x > map[0].length || map[Math.floor(corner.y)][Math.floor(corner.x)] === "#") {
            return [corner];
        }
    }
    for (let pl of convertPlayers) {
        if (pl.name === yourPlayer.name) continue;
        let corners = getCorners(obj, length, width);
        let plConrers = getCorners(pl, length, width);
        for (let corner of corners) {
            if (checkDot(corner.x, corner.y, pl.posX+1, pl.posY+0.5, pl.angle)) {
                return [pl, corner];
            }
        }
        if (obj instanceof Player){
            for (let corner of plConrers) {
                if (checkDot(corner.x, corner.y, yourPlayer.posX+1, yourPlayer.posY+0.5, yourPlayer.angle)) {
                    pl.stop();
                    return [pl, corner];
                }
            }
        }
    }
    return false;
}

function getCorners(obj, length=2, width=1){
    const centerX = obj.posX+1 || obj.x+length/2;
    const centerY = obj.posY+0.5 || obj.y+width/2;
    const angleRad = obj.angle * Math.PI / 180;

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