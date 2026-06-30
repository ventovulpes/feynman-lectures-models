const Draw = {
    point(ctx, position, radius = 6, color = "black") {
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    },

    line(ctx, start, end, width = 2, color = "black") {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color
        ctx.stroke();
    },

    background(ctx, width, height, color = "white", start = {x: 0, y: 0}) {
        ctx.fillStyle = color;
        ctx.fillRect(start.x, start.y, width, height);
    },

    circle(ctx, x, y, radius, color = "white") {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    },

    outlineCircle(ctx, x, y, radius, outlineWidth = 1, color = "white", outlineColor = "cyan") {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.fill();
        ctx.stroke();
    },

    arrow(ctx, start, end, lineWidth = 2, arrowHead = {width: 5, length: 10}, color = "white") {
        ctx.strokeStyle = color;
        ctx.width = lineWidth;
        const angleRad = Math.atan2(end.y - start.y, end.x - start.x);

        this.line(ctx, {x: start.x, y: start.y}, {x: end.x - Math.cos(angleRad) * arrowHead.length, y: end.y - Math.sin(angleRad) * arrowHead.length}, lineWidth, color);
        this.triangle(ctx, end, angleRad, arrowHead, color);
    },

    triangle(ctx, point, angleRad, size = {width: 5, length: 20}, color = "white") {
        function rotateAroundPoint(point, center, angle) {
            return {
                x: center.x + (point.x - center.x) * Math.cos(angle) + (point.y - center.y) * Math.sin(angle),
                y: center.y + (point.x - center.x) * Math.sin(angle) - (point.y - center.y) * Math.cos(angle)
            }
        }

        const a = rotateAroundPoint({x: point.x - size.length, y: point.y - size.width}, point, angleRad);
        const b = rotateAroundPoint({x: point.x - size.length, y: point.y + size.width}, point, angleRad);
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.fill();
    },

    path(ctx, path, lineWidth = 1, color = "white") {
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        const {x, y} = path.at(0);
        ctx.moveTo(x, y);
        path.forEach(({x, y}) => {
            ctx.lineTo(x, y);
        });
        ctx.stroke();
    },

    text(ctx, text, position, px, font = "serif", color = "white", align = "center") {
        ctx.font = `${px}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(text, position.x, position.y);
    }
}