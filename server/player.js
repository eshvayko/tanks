let players = {};

class Player {
    constructor(name, status, tank, posX=null, posY=null) {
        this.name = name;
        this.status = status;
        this.tank = tank;
        this.posX = posX;
        this.posY = posY;
    }
}

class Tank {
    constructor(angle, turretAngle) {}
}

module.exports = {Player, Tank};