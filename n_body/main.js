/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 800;
const DPR = window.devicePixelRatio || 1;

canvas.width = WIDTH * DPR;
canvas.height = HEIGHT * DPR;
ctx.scale(DPR, DPR);

const STARTING_MASS = 10**5;
const G = 10;
const MERGE_DISTANCE = 0;
const MASS_MULT_FOR_RADIUS = 0.001;
const CAMERA_MARGIN = 50;

let bodies = [];

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function getRadius(mass) {
    return Math.sqrt((mass * MASS_MULT_FOR_RADIUS) / Math.PI);
}

function updateBodyPositions(timeElapsed) {
    const secsElapsed = timeElapsed / 1000;

    const updatedBodies = [];
    const hasCollision = new Set();

    bodies.forEach((self, selfIndex) => {
        let totalAcceleration = {x: 0, y: 0};

        bodies.forEach((other, otherIndex) => {
            if (selfIndex === otherIndex || hasCollision.has(selfIndex)) return;

            if (distance(self.position, other.position) <= getRadius(self.mass) + getRadius(other.mass)) {
                hasCollision.add(selfIndex);
                hasCollision.add(otherIndex);
            }

            const gravitationAcceleration = G * (other.mass / distance(self.position, other.position)**2);
            const forceAngle = Math.atan2(other.position.y - self.position.y, other.position.x - self.position.x);

            totalAcceleration = {
                x: totalAcceleration.x + gravitationAcceleration * Math.cos(forceAngle),
                y: totalAcceleration.y + gravitationAcceleration * Math.sin(forceAngle)
            }
        });

        const newVelocity = {
            x: self.velocity.x + secsElapsed * totalAcceleration.x,
            y: self.velocity.y + secsElapsed * totalAcceleration.y
        }

        if (hasCollision.has(selfIndex)) {
            updatedBodies.push({...bodies[selfIndex]});
        } else {
            updatedBodies.push({
                ...bodies[selfIndex],
                position: {
                    x: self.position.x + secsElapsed * newVelocity.x,
                    y: self.position.y + secsElapsed * newVelocity.y
                },
                velocity: newVelocity
            });
        }
    });

    bodies = updatedBodies;
}

function mergeBodiesIfClose() {
    const collidedBodies = new Map();

    bodies.forEach((self, selfIndex) => {
        bodies.forEach((other, otherIndex) => {
            if (selfIndex === otherIndex) return;
 
            if (distance(self.position, other.position) <= getRadius(self.mass) + getRadius(other.mass)) {
                if (!collidedBodies.has(selfIndex)) {
                    collidedBodies.set(selfIndex, [otherIndex]);
                } else {
                    collidedBodies.get(selfIndex).push(otherIndex);
                }
            }
        });
    });

    const visited = new Set();
    const groups = [];
    for (const index of collidedBodies.keys()) {
        if (visited.has(index)) continue;
        const toVisit = [index];
        const group = [];

        while (toVisit.length > 0) {
            const cur = toVisit.pop();
            if (visited.has(cur)) continue;

            visited.add(cur);
            group.push(cur);

            const collided = collidedBodies.get(cur) ?? [];
            collided.forEach(col => toVisit.push(col));
        }

        groups.push(group);
    }

    let toDelete = new Set();

    for (const group of groups) {
        const totalMass = group.reduce((acc, cur) => acc + bodies[cur].mass, 0);
        const updatedPosition = {
            x: group.reduce((acc, cur) => acc + bodies[cur].position.x * bodies[cur].mass, 0) / totalMass,
            y: group.reduce((acc, cur) => acc + bodies[cur].position.y * bodies[cur].mass, 0) / totalMass
        };
        const updatedVelocity = {
            x: group.reduce((acc, cur) => acc + bodies[cur].velocity.x * bodies[cur].mass, 0) / totalMass,
            y: group.reduce((acc, cur) => acc + bodies[cur].velocity.y * bodies[cur].mass, 0) / totalMass
        };

        group.slice(1).forEach(index => toDelete.add(index));

        const body = bodies[group[0]];
        body.mass = totalMass;
        body.position = updatedPosition;
        body.velocity = updatedVelocity;
    }

    let newBodies = [];
    for (let i = 0; i < bodies.length; i++) {
        if (toDelete.has(i)) continue;
        newBodies.push(bodies[i]);
    }
    bodies = newBodies;
}

function spawnBody(position) {
    bodies.push({
        position: position,
        velocity: {x: 0, y: 0},
        mass: STARTING_MASS
    });
}

function moveCamera() {
    const left = -CAMERA_MARGIN + bodies.reduce((min, body) => Math.min(min, body.position.x), Infinity);
    const right = -CAMERA_MARGIN + bodies.reduce((max, body) => Math.max(max, body.position.x), -Infinity);
    const top = -CAMERA_MARGIN + bodies.reduce((min, body) => Math.min(min, body.position.y), Infinity);
    const bottom = -CAMERA_MARGIN + bodies.reduce((max, body) => Math.max(max, body.position.y), -Infinity);

    const scale = Math.max(1, Math.min(1 / (right - left), 1 / (bottom - top))) * DPR;

    ctx.setTransform(scale, 0, 0, scale, left * scale, top * scale);
}

let lastTime = 0;

function frame(time) {
    const timeElapsed = time - lastTime;
    lastTime = time;

    updateBodyPositions(timeElapsed);
    mergeBodiesIfClose();

    Draw.background(ctx, WIDTH, HEIGHT, "black");
    bodies.forEach(body => {
        Draw.circle(ctx, body.position.x, body.position.y, getRadius(body.mass), "white");
    });

    window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);

canvas.addEventListener("pointerdown", (event) => {
    spawnBody({x: event.offsetX, y: event.offsetY});
});