/* todo:    1. create canvas -> setup size (relative)
            2. setup styles
            3. coordinate system ([-1,-1], [1,1]) -> from pixel input to coordinate input mapping
            4. draw only visible
            5. Textures -> Sprites -> Shading
            ...
            final: optimizations for JIT
*/

import {Color} from "./color/color.comp";
import Point, {DrawSettings, Triangle} from "./geometry/geometry.comp";
import $ from 'jquery';

export const mainCanvas = generateCanvas();
document.body.appendChild(mainCanvas);
drawCoordinateSystem();

function generateCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    $(canvas)
        .attr("width", (window.innerWidth * (window.devicePixelRatio || 1)) + "px")
        .attr("height", (window.innerHeight * (window.devicePixelRatio || 1)) + "px")

    return canvas;
}

function drawLine(from: Point, to: Point, ctx: CanvasRenderingContext2D, drawSettings?: DrawSettings) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.closePath();
    ctx.strokeStyle = drawSettings?.stroke?.color.hexCode ?? "#000";
    ctx.stroke();
}

function drawCoordinateSystem() {
    const center = new Point([0, 0]);
    const ctx = mainCanvas.getContext('2d') as CanvasRenderingContext2D;
    drawLine(new Point([-center.x, 0]), new Point([center.x, 0]), ctx);
    drawLine(new Point([0, center.y]), new Point([0, -center.y]), ctx);
}


const tr = new Triangle(
    [
        new Point([0, 125]),
        new Point([100, -75]),
        new Point([-100, -75])
    ], new Point([0, 0]), mainCanvas, {
        fillColor: Color.PRESETS.PINK,
        // drawEdgePoints: true,
        // drawCentroid: true,
        stroke: {color: Color.PRESETS.BLACK}
    });
tr.draw();