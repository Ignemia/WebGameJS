/* todo:    1. create canvas -> setup size (relative) ✓
            2. setup styles
            3. coordinate system ([0,0] is in the center of screen) -> from pixel input to coordinate input mapping ✓
            4. draw only visible
            5. Textures -> Sprites -> Shading
            ...
            final: optimizations for JIT
*/

import {DrawSettings, Point, Shape2D, Vector} from "./geometry/geometry.comp";
import $ from 'jquery';
import {Physics} from "../physics/physics.comp";
import PhysicsObject = Physics.PhysicsObject;

export const mainCanvas = generateCanvas();

function generateCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    $(canvas)
        .attr("width", (window.innerWidth * (window.devicePixelRatio || 1)) + "px")
        .attr("height", (window.innerHeight * (window.devicePixelRatio || 1)) + "px")

    return canvas;
}

export function drawLine(from: Point, to: Point, ctx: CanvasRenderingContext2D, drawSettings?: DrawSettings) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.closePath();
    ctx.strokeStyle = drawSettings?.stroke?.color?.hexCode ?? "#000";
    ctx.stroke();
}

export function drawCoordinateSystem() {
    const center = new Point([0, 0]);
    const ctx = mainCanvas.getContext('2d') as CanvasRenderingContext2D;
    drawLine(new Point([-center.x, 0]), new Point([center.x, 0]), ctx);
    drawLine(new Point([0, center.y]), new Point([0, -center.y]), ctx);
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // console.log("cleared");
}

function drawObjects(objects: PhysicsObject[]): void {
    for (const o of objects) {
        if(o.geometry.offCanvas) continue;
        o.geometry.draw();
    }
}

export function redraw(objects: PhysicsObject[]) {
    drawObjects(objects);
}