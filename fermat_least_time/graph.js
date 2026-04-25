/** @type {HTMLCanvasElement} */
const graph = document.getElementById("graph");
/** @type {CanvasRenderingContext2D} */
const graphCtx = graph.getContext("2d");

const GRAPH_WIDTH = 800;
const GRAPH_HEIGHT = 600;
const GRAPH_MARGIN = 80;
const GRAPH_MIN_TIME = 3_000;
const GRAPH_MAX_TIME = 6_000;
const GRAPH_POINT_RADIUS = 4;
const GRAPH_MIN_TIME_MARGIN = 30;

graph.width = GRAPH_WIDTH;
graph.height = GRAPH_HEIGHT;

function drawGraph(data) {
    if (!data) {
        return;
    }

    // draw background
    graphCtx.beginPath();
    graphCtx.fillStyle = "white";
    graphCtx.fillRect(0, 0, GRAPH_WIDTH, GRAPH_HEIGHT);

    // draw points
    const maxTime = Math.min(GRAPH_MAX_TIME, Math.max(GRAPH_MIN_TIME, Math.max(...data.map(d => d.time))));
    const minTime = Math.min(...data.map(d => d.time));
    data.forEach(d => {
        const x = (d.angle + (RAY_ANGLE_SPAN / 2)) * ((GRAPH_WIDTH - 2*GRAPH_MARGIN) / RAY_ANGLE_SPAN) + GRAPH_MARGIN;
        const y = GRAPH_HEIGHT - ((d.time - minTime) * ((GRAPH_HEIGHT - 2*GRAPH_MARGIN) / maxTime) + GRAPH_MARGIN + GRAPH_MIN_TIME_MARGIN);
        drawPoint(graphCtx, {x: x, y: y}, GREEN, GRAPH_POINT_RADIUS);
    });

    // draw axes
    drawLine(graphCtx, { x: GRAPH_MARGIN, y: GRAPH_HEIGHT - GRAPH_MARGIN }, { x: GRAPH_WIDTH - GRAPH_MARGIN, y: GRAPH_HEIGHT - GRAPH_MARGIN }, width=4);
    drawLine(graphCtx, { x: GRAPH_MARGIN, y: GRAPH_HEIGHT - GRAPH_MARGIN }, { x: GRAPH_MARGIN, y: 0 }, width=4);

    // draw labels
    graphCtx.font = "16px Helvetica";
    graphCtx.fillStyle = "black";
    graphCtx.textAlign = "center";
    graphCtx.fillText("Angle (°)", GRAPH_WIDTH / 2, GRAPH_HEIGHT - (GRAPH_MARGIN / 2));

    graphCtx.save();
    graphCtx.translate(GRAPH_MARGIN / 2, (GRAPH_HEIGHT - GRAPH_MARGIN) / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.fillText("Time", 0, 0);
    graphCtx.restore();

    const numberSpacing = (GRAPH_WIDTH - (GRAPH_MARGIN * 2)) / RAY_ANGLE_SPAN;
    for (let i = 0; i <= RAY_ANGLE_SPAN; i += 30) {
        graphCtx.fillText(i - (RAY_ANGLE_SPAN / 2), GRAPH_MARGIN + i * numberSpacing, GRAPH_HEIGHT - (0.75 * GRAPH_MARGIN));
    }
}