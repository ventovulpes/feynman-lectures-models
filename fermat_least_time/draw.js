const GREEN = "rgb(78, 197, 87)";

function drawPoint(ctx, position, color = "black", radius = POINT_RADIUS) {
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLine(ctx, start, end, color = "black", width = 2) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color
    ctx.stroke();
}