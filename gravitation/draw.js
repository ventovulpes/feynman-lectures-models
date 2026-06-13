function drawBackground(ctx, width, height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
}

function drawCircle(ctx, x, y, radius, color = "white") {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function rotateAroundPoint(point, center, angle) {
    return {
        x: center.x + (point.x - center.x) * Math.cos(angle) + (point.y - center.y) * Math.sin(angle),
        y: center.y + (point.x - center.x) * Math.sin(angle) - (point.y - center.y) * Math.cos(angle)
    }
}

function drawArrow(ctx, start, end, color = "white", lineWidth = 2, arrowHead = {width: 5, length: 10}) {
    ctx.strokeStyle = color;
    ctx.width = lineWidth;
    const angleRad = Math.atan2(end.y - start.y, end.x - start.x);

    // draw line
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x - Math.cos(angleRad) * arrowHead.length, end.y - Math.sin(angleRad) * arrowHead.length);
    ctx.stroke();

    drawTriangle(ctx, end, angleRad, arrowHead, color);
}

function drawTriangle(ctx, point, angleRad, size = {width: 5, length: 20}, color = "white") {
    const a = rotateAroundPoint({x: point.x - size.length, y: point.y - size.width}, point, angleRad);
    const b = rotateAroundPoint({x: point.x - size.length, y: point.y + size.width}, point, angleRad);
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.fill();
}