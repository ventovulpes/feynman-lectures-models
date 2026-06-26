/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const mPlanetElement = document.getElementById("mass_planet");
const velocityMultiplierElement = document.getElementById("velocityMultiplier");
const drawPathsElement = document.getElementById("drawPaths");
const drawLastPathElement = document.getElementById("drawLastPath");

const WIDTH = 800;
const HEIGHT = 800;
const DPR = window.devicePixelRatio || 1;

let velocityMultiplier = velocityMultiplierElement.value;
const PLANET_POSITION = {x: WIDTH / 2, y: HEIGHT / 2}
const PLANET_RADIUS = 50;
let planetMass = 10**mPlanetElement.value;
const satelliteMass = 1;
const SATELLITE_SIZE = {
    width: 5,
    length: 20
}
const STARTING_POS = {x: PLANET_POSITION.x, y: PLANET_POSITION.y - PLANET_RADIUS};
const DESTRUCTION_OFFSET = 0.1;
const MIN_DISTANCE_TO_SAVE_TO_PATH = 5;
let doDrawPaths = true;
let doDrawLastPath = true;

canvas.width = WIDTH * DPR;
canvas.height = HEIGHT * DPR;
ctx.scale(DPR, DPR);

const pointer = {x: STARTING_POS.x, y: STARTING_POS.y}

const satellites = [];

function createSatellite(position, velocity) {
    return {
        position: {...position},
        velocity: {...velocity},
        path: [STARTING_POS]
    }
}

function distance(a, b) {
    return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function updateSatellitePosition(satellite, timeElapsed) {
    const secsElapsed = timeElapsed / 1000;

    const G = 6.67 * 10**-11;
    const gravitationForce = G * ((satelliteMass * planetMass) / distance(satellite.position, PLANET_POSITION));
    const forceAngle = Math.atan2(PLANET_POSITION.y - satellite.position.y, PLANET_POSITION.x - satellite.position.x);

    satellite.velocity.x += secsElapsed * gravitationForce * Math.cos(forceAngle);
    satellite.velocity.y += secsElapsed * gravitationForce * Math.sin(forceAngle);

    satellite.position.x += secsElapsed * satellite.velocity.x;
    satellite.position.y += secsElapsed * satellite.velocity.y;

    savePositionToPath(satellite);
}

function savePositionToPath(satellite) {
    if (distance(satellite.position, satellite.path.at(-1)) < MIN_DISTANCE_TO_SAVE_TO_PATH) return;
    satellite.path.push({x: satellite.position.x, y: satellite.position.y});
}

function clearSatellites() {
    satellites.length = 0;
}

let lastTime = 0;

function frame(time) {
    const timeElapsed = time - lastTime;
    lastTime = time;

    Draw.background(ctx, WIDTH, HEIGHT);
    Draw.circle(ctx, WIDTH / 2, HEIGHT / 2, PLANET_RADIUS, "white");
    Draw.arrow(ctx, STARTING_POS, pointer);
    
    const toDestroy = []

    satellites.forEach(({position, velocity, path}, index) => {
        updateSatellitePosition(satellites[index], timeElapsed);
        const angle = Math.atan2(velocity.y, velocity.x);
        const isLast = index == satellites.length - 1;

        if (position.x < -SATELLITE_SIZE.length || position.x > WIDTH + SATELLITE_SIZE.length ||
            position.y < -SATELLITE_SIZE.length || position.y > HEIGHT + SATELLITE_SIZE.length) {
            toDestroy.push(index);
        } else if (distance(position, PLANET_POSITION) < PLANET_RADIUS - DESTRUCTION_OFFSET) {
            toDestroy.push(index);
        }

        let color = "white";
        if (isLast) {
            color = "cyan";
        }
        if (doDrawPaths || (doDrawLastPath && isLast)) {
            Draw.path(ctx, path, 1, color);
        }
        Draw.triangle(ctx, position, angle, SATELLITE_SIZE, color);
    });
    toDestroy.forEach((i) => {
        satellites.splice(i, 1);
    });
    toDestroy.length = 0;

    window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);

canvas.addEventListener("pointermove", (e) => {
    pointer.x = e.offsetX;
    pointer.y = e.offsetY;
});

canvas.addEventListener("pointerdown", (e) => {
    const velocity = {
        x: (e.offsetX - STARTING_POS.x) * velocityMultiplier,
        y: (e.offsetY - STARTING_POS.y) * velocityMultiplier
    };

    satellites.push(createSatellite(STARTING_POS, velocity));
});

document.addEventListener("input", () => {
    velocityMultiplier = velocityMultiplierElement.value;
    planetMass = 10**mPlanetElement.value;
    doDrawPaths = drawPathsElement.checked;
    if (doDrawPaths) {
        drawLastPathElement.disabled = true;
        drawLastPathElement.checked = true;
    } else {
        drawLastPathElement.disabled = false;
    }
    doDrawLastPath = drawLastPathElement.checked;
})