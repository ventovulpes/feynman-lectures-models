/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 600;
const BOUNDS = { left: 0, center: WIDTH / 2, right: WIDTH };
const POINT_RADIUS = 6;
const MARGIN_WIDTH = 20;

const thetaAElement = document.getElementById("theta_a");
const thetaBElement = document.getElementById("theta_b");

let n_a = document.getElementById("n_a").value;
let n_b = document.getElementById("n_b").value;
let drawingSpeedMultiplier = document.getElementById("drawSpeed").value;
let numRays = document.getElementById("numRays").value;
const RAY_ANGLE_SPAN = 180;
const MAX_DRAWING_SPEED = 2;

let speedA = drawingSpeedMultiplier / n_a;
let speedB = drawingSpeedMultiplier / n_b;

const pointA = { x: WIDTH / 4, y: HEIGHT / 2 };
const pointB = { x: WIDTH * 3 / 4, y: HEIGHT / 2 };
const mouse = { x: 0, y: 0 };
var objectBeingDragged = null;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let startTime = null;
let drawStartTime = null;
let hasStartedDrawing = false;
let fastestRayAngle = null;

let rayData = [];

function animate(timestamp) {
    if (!startTime) {
        startTime = timestamp
    }

    drawRefraction(timestamp);

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function drawRefraction(timestamp) {
    if (objectBeingDragged == pointA) {
        if (pointA.x != mouse.x || pointA.y != mouse.y) {
            // if point A has been moved
            pointA.x = clamp(mouse.x, MARGIN_WIDTH, BOUNDS.center - MARGIN_WIDTH);
            pointA.y = clamp(mouse.y, MARGIN_WIDTH, HEIGHT - MARGIN_WIDTH);
            hasStartedDrawing = false;
        }
    } else if (objectBeingDragged == pointB) {
        if (pointB.x != mouse.x || pointB.y != mouse.y) {
            // if point B has been moved
            pointB.x = clamp(mouse.x, BOUNDS.center + MARGIN_WIDTH, BOUNDS.right - MARGIN_WIDTH);
            pointB.y = clamp(mouse.y, MARGIN_WIDTH, HEIGHT - MARGIN_WIDTH);
            hasStartedDrawing = false;
        }
    }
    if (!hasStartedDrawing) {
        // reset ray drawing
        drawStartTime = timestamp;
        fastestRayAngle = null;
        hasStartedDrawing = true;
        rayData = [];
    }

    // draw background
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // draw refractive surface
    ctx.beginPath();
    ctx.fillStyle = "rgb(240, 253, 255)";
    ctx.fillRect(BOUNDS.center, 0, WIDTH / 2, HEIGHT);

    // draw rays
    const timeElapsed = timestamp - drawStartTime;
    const a = { x: pointA.x, y: pointA.y, speed: speedA };
    const b = { x: pointB.x, y: pointB.y, speed: speedB };

    if (fastestRayAngle == null) {
        let anglesWhichReachedB = [];

        // draw all if no ray has reached point B yet
        for (let i = -RAY_ANGLE_SPAN / 2; i <= RAY_ANGLE_SPAN / 2 + 1; i += (RAY_ANGLE_SPAN / numRays)) {
            if (calculateRay(a, b, i, BOUNDS, timeElapsed)) {
                anglesWhichReachedB.push(i);
                rayData.push({ angle: i, time: timeElapsed * drawingSpeedMultiplier });
            }
        }

        // take the middle ray which has reached point B
        if (anglesWhichReachedB) {
            fastestRayAngle = anglesWhichReachedB[Math.floor(anglesWhichReachedB.length / 2)];
        }
    } else {
        for (let i = -RAY_ANGLE_SPAN / 2; i <= RAY_ANGLE_SPAN / 2 + 1; i += (RAY_ANGLE_SPAN / numRays)) {
            // calculate without drawing to get time for graph
            if (calculateRay(a, b, i, BOUNDS, timeElapsed, drawRays=false)) {
                if (!rayData.some(d => d.angle === i)) {
                    rayData.push({ angle: i, time: timeElapsed * drawingSpeedMultiplier });
                }
            }
        }

        // if a ray has reached point B, only draw that ray
        calculateRay(a, b, fastestRayAngle, BOUNDS, timeElapsed);
    }

    // draw line dividing surfaces
    drawLine(ctx, {x: BOUNDS.center, y: 0}, {x: BOUNDS.center, y: HEIGHT});

    // draw start and end points
    drawPoint(ctx, pointA);
    drawPoint(ctx, pointB);

    drawGraph(rayData);
}

canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
})

canvas.addEventListener("mousedown", (e) => {
    if (mouseIsInsideCircle(pointA, POINT_RADIUS) && objectBeingDragged != pointA) {
        objectBeingDragged = pointA;
    } else if (mouseIsInsideCircle(pointB, POINT_RADIUS) && objectBeingDragged != pointB) {
        objectBeingDragged = pointB;
    } else {
        objectBeingDragged = null;
    }
})

document.addEventListener("input", () => {
    n_a = document.getElementById("n_a").value;
    n_b = document.getElementById("n_b").value;
    drawingSpeedMultiplier = document.getElementById("drawSpeed").value;
    numRays = document.getElementById("numRays").value;

    if (drawingSpeedMultiplier > MAX_DRAWING_SPEED) {
        document.getElementById("drawSpeed").value = MAX_DRAWING_SPEED;
        drawingSpeedMultiplier = MAX_DRAWING_SPEED;
    }

    speedA = drawingSpeedMultiplier / n_a;
    speedB = drawingSpeedMultiplier / n_b;

    hasStartedDrawing = false;
});

function mouseIsInsideCircle(center, radius) {
    if (Math.abs(center.x - mouse.x) <= radius &&
        Math.abs(center.y - mouse.y) <= radius) {
        return true;
    }
    return false;
}

function clamp(value, a, b) {
    return Math.max(a, Math.min(value, b))
}

/**
* Calculates two rays at a certain point in time, each passing through a specific point and having a certain speed
* @param {{x: number, y: number, speed: number}} a - The point on the left side
* @param {{x: number, y: number, speed: number}} b - The point on the right side
* @param {number} angle - The angle at which the ray passes through *a*
* @param {{center: number, right: number}} center - The boundaries for the left and right sides
* @param {number} time - Time elapsed for drawing
* @param {boolean} drawRays - If the two rays should be drawn
* @returns {boolean} If the second ray has reached the second point
*/
function calculateRay(a, b, angle, bounds, time, drawRays = true) {
    var hasReachedPointB = false;

    a.angleRad = -angle * (Math.PI / 180);
    a.slope = Math.sin(a.angleRad) / Math.cos(a.angleRad);

    a.start = {
        x: a.x,
        y: a.y
    }
    a.end = {
        x: a.start.x + (time * a.speed * Math.cos(a.angleRad)),
        y: a.start.y + (time * a.speed * Math.sin(a.angleRad))
    };

    // start drawing ray B once ray A has reached center
    if (a.end.x >= bounds.center) {
        // clamp ray A to not extend beyond center
        a.end = {
            x: bounds.center,
            y: a.y + a.slope * (bounds.center - a.x)
        };

        // calculate how much time has passed since ray A reached center
        const timeB = time - (bounds.center - a.x) / (a.speed * Math.cos(a.angleRad));
        b.intercept = a.end.y;
        b.slope = (b.y - b.intercept) / (b.x - bounds.center);
        b.angleRad = Math.atan(b.slope);

        b.start = {
            x: bounds.center,
            y: b.intercept
        };
        b.end = {
            x: b.start.x + (timeB * b.speed * Math.cos(b.angleRad)),
            y: b.start.y + (timeB * b.speed * Math.sin(b.angleRad))
        };

        if (b.end.x >= b.x) {
            hasReachedPointB = true;
            thetaAElement.textContent = angle.toFixed(3);
            thetaBElement.textContent = (-b.angleRad * (180 / Math.PI)).toFixed(3);
        }

        if (b.end.x >= BOUNDS.right) {
            b.end = {
                x: BOUNDS.right,
                y: b.start.y + b.slope * (BOUNDS.right - b.start.x)
            };
        }

        if (drawRays) {
            // draw ray B
            drawLine(ctx, b.start, b.end, GREEN, 3);
        }
    }
    if (drawRays) {
        // draw ray A
        drawLine(ctx, a.start, a.end, GREEN, 3);
    }

    return hasReachedPointB;
}