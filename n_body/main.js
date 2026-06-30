/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 800;
const DPR = window.devicePixelRatio || 1;

canvas.width = WIDTH * DPR;
canvas.height = HEIGHT * DPR;

let cameraX = 0;
let cameraY = 0;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

const STARTING_MASS = 10**6;
const G = 1;
const MERGE_DISTANCE = 0;
const MASS_MULT_FOR_RADIUS = 0.0001;
const VELOCITY_MULT = 0.2;
const CAMERA_SMOOTH_FACTOR = 10**-3;
const CAMERA_ARROW_MULT = 1;

const GRID_INTERVAL = 100;
const GRID_OPACITY = 0.2;

let bodies = [];
let toSpawnPosition = null;
let pointerPosition = null;
let deltaCameraPosition = {x: 0, y: 0}
const CENTER_OF_MASS = -1;
let selectionIndex = CENTER_OF_MASS;

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function getMagnitude(vector) {
    return Math.sqrt(vector.x**2 + vector.y**2);
}

function getRadius(mass) {
    return Math.sqrt((mass * MASS_MULT_FOR_RADIUS) / Math.PI);
}

function getCenterOfMass() {
    const totalMass = bodies.reduce((acc, body) => acc + body.mass, 0);
    if (totalMass === 0) {
        return {x: 0, y: 0};
    }

    return {
        x: bodies.reduce((acc, body) => acc + body.position.x * body.mass, 0) / totalMass,
        y: bodies.reduce((acc, body) => acc + body.position.y * body.mass, 0) / totalMass
    }
}

function updateBodyPositions(timeElapsed) {
    const secsElapsed = timeElapsed / 1000;

    const updatedBodies = [];
    const hasCollision = new Set();

    bodies.forEach((self, selfIndex) => {
        let totalAcceleration = {x: 0, y: 0};

        // total forces from other bodies
        bodies.forEach((other, otherIndex) => {
            if (selfIndex === otherIndex || hasCollision.has(selfIndex)) return;

            // do not apply force if body has collided
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

    // detect collisions
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

    // combine collisions into groups to be merged
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
    // merge groups into one body
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

        group.slice(1).forEach(index => {
            if (selectionIndex >= index) {
                selectionIndex--;
                if (selectionIndex < CENTER_OF_MASS) {
                    selectionIndex = CENTER_OF_MASS;
                }
            }
            toDelete.add(index);
        });

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

function spawnBody(position, velocityHead) {
    bodies.push({
        position: position,
        velocity: {
            x: (velocityHead.x - position.x) * VELOCITY_MULT,
            y: (velocityHead.y - position.y) * VELOCITY_MULT
        },
        mass: STARTING_MASS
    });

    toSpawnPosition = null;
}

function deleteSelectedBody() {
    if (selectionIndex === CENTER_OF_MASS) return;
    bodies.splice(selectionIndex, 1);

    if (selectionIndex >= bodies.length) {
        if (bodies.length === 0) {
            selectionIndex = CENTER_OF_MASS;
        } else {
            selectionIndex = 0;
        }
    }
}

function getWorldCoords(screenX, screenY) {
    return {
        x: screenX + cameraX - WIDTH / 2,
        y: screenY + cameraY - HEIGHT / 2
    }
}

function moveCamera(timeElapsed, targetPosition) {
    deltaCameraPosition = {
        x: targetPosition.x - cameraX,
        y: targetPosition.y - cameraY
    }

    cameraX += deltaCameraPosition.x * CAMERA_SMOOTH_FACTOR * timeElapsed;
    cameraY += deltaCameraPosition.y * CAMERA_SMOOTH_FACTOR * timeElapsed;
    
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.translate(WIDTH / 2 - cameraX, HEIGHT / 2 - cameraY);
}

function drawCameraMoveArrow() {
    if (getMagnitude(deltaCameraPosition) < 0.01) return;
    
    const origin = {x: 50, y: HEIGHT - 50};

    Draw.arrow(ctx, origin, {
        x: origin.x + deltaCameraPosition.x * CAMERA_ARROW_MULT,
        y: origin.y + deltaCameraPosition.y * CAMERA_ARROW_MULT
    });
}

function drawGrid() {
    const topLeft = getWorldCoords(0, 0);
    const bottomRight = getWorldCoords(WIDTH, HEIGHT);
    const startingPosition = {
        x: Math.floor(topLeft.x / GRID_INTERVAL) * GRID_INTERVAL,
        y: Math.floor(topLeft.y / GRID_INTERVAL) * GRID_INTERVAL
    }

    // vertical lines
    for (let i = 0; i <= Math.ceil((bottomRight.x - topLeft.x) / GRID_INTERVAL); i++) {
        const start = {x: startingPosition.x + i * GRID_INTERVAL, y: topLeft.y};
        const end = {x: startingPosition.x + i * GRID_INTERVAL, y: bottomRight.y};
        Draw.line(ctx, start, end, 1, `rgba(255, 255, 255, ${GRID_OPACITY})`);
    }
    // horizontal lines
    for (let i = 0; i <= Math.ceil((bottomRight.y - topLeft.y) / GRID_INTERVAL); i++) {
        const start = {x: topLeft.x, y: startingPosition.y + i * GRID_INTERVAL};
        const end = {x: bottomRight.x, y: startingPosition.y + i * GRID_INTERVAL};
        Draw.line(ctx, start, end, 1, `rgba(255, 255, 255, ${GRID_OPACITY})`);
    }
}

let lastTime = 0;

function frame(time) {
    const timeElapsed = time - lastTime;
    lastTime = time;

    updateBodyPositions(timeElapsed);
    mergeBodiesIfClose();

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    Draw.background(ctx, WIDTH, HEIGHT, "black");
    if (selectionIndex === CENTER_OF_MASS) {
        Draw.text(ctx, "following center of mass", {x: WIDTH / 2, y: HEIGHT - 20}, 18, "Helvetica", "white", "center");
    }

    const targetPosition = selectionIndex === CENTER_OF_MASS ? getCenterOfMass() : bodies[selectionIndex].position;
    drawCameraMoveArrow();
    moveCamera(timeElapsed, targetPosition);

    drawGrid();

    bodies.forEach((body, index) => {
        if (index === selectionIndex) {
            Draw.outlineCircle(ctx, body.position.x, body.position.y, getRadius(body.mass), 2, "white", "red");
        } else {
            Draw.circle(ctx, body.position.x, body.position.y, getRadius(body.mass), "white");
        }
    });

    if (toSpawnPosition !== null && pointerPosition !== null) {
        Draw.arrow(ctx, toSpawnPosition, pointerPosition);
    }

    window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);

canvas.addEventListener("pointerdown", () => {
    if (toSpawnPosition !== null) {
        spawnBody(toSpawnPosition, pointerPosition);
    } else {
        toSpawnPosition = pointerPosition;
    }
});

canvas.addEventListener("pointermove", (event) => {
    pointerPosition = getWorldCoords(event.offsetX, event.offsetY);
});

window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft") {
        selectionIndex--;
    } else if (event.code === "ArrowRight") {
        selectionIndex++;
    } else if (event.code === "Backspace") {
        deleteSelectedBody();
    }

    if (selectionIndex >= bodies.length) {
        selectionIndex = CENTER_OF_MASS;
    } else if (selectionIndex < CENTER_OF_MASS) {
        selectionIndex = bodies.length - 1;
    }
});