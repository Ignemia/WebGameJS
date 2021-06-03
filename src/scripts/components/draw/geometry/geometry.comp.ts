import {Color} from '../color/color.comp';
import _ from "lodash";

export const default_drawSettings = Object.freeze({
    blur: 0,
    drawEdgePoints: false,
    drawHitbox: false,
    drawCentroid: false,
    fillColor: Color.PRESETS.BLACK,
    fillOpacity: 1,
    invisible: false,
    scale: 1,
    stroke: {color: Color.PRESETS.NULL, opacity: 1, strength: 1},
    drawBoundingBox: false
});

function getAngle(points: [Point, Point, Point]): number {
    const v = new Vector(points[1], points[0]);
    const u = new Vector(points[1], points[2]);

    return Math.acos(Vector.dotProduct(u, v) / (v.magnitude * u.magnitude));
}

export type LinearFunctionDescriptors = {
    a: number;
    b: number;
}
export type DrawSettings = {
    fillColor?: any;
    fillOpacity?: number;
    drawEdgePoints?: boolean;
    drawCentroid?: boolean;
    drawHitbox?: boolean;
    invisible?: boolean;
    drawBoundingBox?:boolean;
    scale?: number;
    blur?: number;
    stroke?: {
        color?: any;
        strength?: number;
        opacity?: number
    }
};

export class Vector {
    constructor(private readonly pt1: Point, private readonly pt2: Point) {
    }

    get deltaX(): number {
        return this.pt1.x - this.pt2.x
    }

    get deltaY(): number {
        return this.pt1.y - this.pt2.y
    }

    get magnitude(): number {
        return Math.hypot(this.deltaX, this.deltaY);
    }

    get equationDescription(): LinearFunctionDescriptors {
        const otp = {
            a: (this.pt1.originalCoordinates.y - this.pt2.originalCoordinates.y) / (this.pt1.originalCoordinates.x - this.pt2.originalCoordinates.x),
            b: 0
        };
        otp.b = this.pt1.originalCoordinates.y - otp.a * this.pt1.originalCoordinates.x;
        return otp;
    }

    static dotProduct(v1: Vector, v2: Vector): number {
        return (v1.deltaX * v2.deltaX) + (v1.deltaY * v2.deltaY);
    }

    rotateVector(amount: number, reverse = false): Point {
        const pt2 = reverse ? this.pt2 : this.pt1;

        const xMovement = Math.cos(amount) * this.deltaX - Math.sin(amount) * this.deltaY;
        const yMovement = Math.sin(amount) * this.deltaX + Math.cos(amount) * this.deltaY;

        return new Point([pt2.originalCoordinates.x + xMovement, pt2.originalCoordinates.y + yMovement]);
    }


    draw(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.moveTo(this.pt1.x, this.pt1.y);
        ctx.lineTo(this.pt2.x, this.pt2.y);
        ctx.closePath();
        ctx.strokeStyle = "#000";
        ctx.stroke();

        this.pt1.setDrawSettings({fillColor: Color.PRESETS.RED});
        this.pt1.draw(canvas);
        this.pt2.draw(canvas);
    }

}

export function drawLineByEquation({a, b, canvas}: { a: number, b: number, canvas: HTMLCanvasElement }) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const cw = canvas.width / 2;

    const leftPoint = new Point([-cw, -(a * cw) + b]);
    const rightPoint = new Point([cw, a * cw + b]);

    ctx.beginPath();
    ctx.moveTo(leftPoint.x, leftPoint.y);
    ctx.lineTo(rightPoint.x, rightPoint.y);
    ctx.closePath();

    ctx.strokeStyle = "#000";
    ctx.stroke();
}

export function getCrosssectionPoint(v1: LinearFunctionDescriptors, v2: LinearFunctionDescriptors): Point {
    const x = (v1.b - v2.b) / (v2.a - v1.a);
    return new Point([x, (v1.a * x + v1.b)]);
}

export abstract class Shape2D {
    protected drawSettings: DrawSettings = _.cloneDeep(default_drawSettings);
    protected context: CanvasRenderingContext2D;

    protected rotation = {default: 0, added: 0};
    protected _rotationSpeed = 0;

    protected _rot_pts: Point[] = [];

    protected square_edges: Point[] = [];
    protected speed = {
        default: {
            x: 0,
            y: 0,
            z: 0
        },
        changed: {
            x: 0,
            y: 0,
            z: 0
        }
    }

    protected constructor(protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        for (const key in drawSettings) {
            if (this.drawSettings.hasOwnProperty(key) && drawSettings.hasOwnProperty(key)) {
                (this.drawSettings as any)[key] = (drawSettings as any)[key];
            }
        }
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    set defaultRotation(rotation: number) {
        this.rotation.default = (rotation / 180) * Math.PI;
    }

    set rotationSpeed(speed: number) {
        this._rotationSpeed = speed * Math.PI / 180;
    }

    get rotationSpeed(): number {
        return this._rotationSpeed;
    }

    set movementSpeed({x = 0, y = 0, z = 0}: { x: number, y: number, z?: number }) {
        this.speed.changed = {x, y, z};
    }

    set movementDefaultSpeed({x = 0, y = 0, z = 0}: { x: number, y: number, z?: number }) {
        this.speed.default = {x, y, z};
    }

    get movementSpeed(): { x: number, y: number, z: number } {
        return {
            x: this.speed.default.x + this.speed.changed.x,
            y: this.speed.default.y + this.speed.changed.y,
            z: this.speed.default.z + this.speed.changed.z
        }
    }

    rotateAnimationApply(pastTime: number) {
        this.rotate(pastTime * this.rotationSpeed);
    }

    translationAnimationApply(pastTime: number) {
        this.move({
            x: this.movementSpeed.x * pastTime,
            y: this.movementSpeed.y * pastTime,
            z: this.movementSpeed.z * pastTime
        });
    }

    rotate(amount: number): void {
        this.rotation.added += amount;
    }

    draw(): void {

        if (this.offCanvas) return;

        this._rot_pts = this.getRotationPoints();
        this.square_edges = this.squareEdges();

        this.drawShape();
        this.context.fillStyle = this.drawSettings.fillColor.hexCode;
        this.context.fill();
        if (!this.drawSettings.stroke?.color.isNull()) {
            this.context.strokeStyle = this.drawSettings.stroke?.color.hexCode;
            this.context.stroke();
        }

        if(this.drawSettings.drawBoundingBox) {
            this.drawSquareEdges();
        }

        if (this.drawSettings.drawEdgePoints) {
            this.drawEdgePoints();
        }

        if (this.drawSettings.drawCentroid) {
            this.centroid.setDrawSettings({fillColor: Color.PRESETS.RED});
            this.centroid.draw(this.canvas);
        }
    }

    drawSquareEdges() {
        this.context.beginPath();

        this.context.moveTo(this.square_edges[0].x, this.square_edges[0].y);
        this.context.lineTo(this.square_edges[1].x, this.square_edges[1].y);
        this.context.lineTo(this.square_edges[2].x, this.square_edges[2].y);
        this.context.lineTo(this.square_edges[3].x, this.square_edges[3].y);

        this.context.closePath();

        // console.log(this.square_edges);

        this.context.strokeStyle = "#333";
        this.context.stroke();
    }

    protected abstract getRotationPoints(): Point[];

    abstract get boudingEdges(): { left: number, right: number, top: number, bottom: number }

    abstract get offCanvas(): boolean;

    abstract move({x, y, z}: { x: number, y: number, z?: number }): void;

    abstract includesPoint(pt1: Point): boolean;

    abstract drawEdgePoints(): void;

    abstract drawShape(): void;

    abstract overlaps(shape: Shape2D): boolean;

    squareEdges(): Array<Point> {
        return [
            new Point([this.boudingEdges.left, this.boudingEdges.top]),
            new Point([this.boudingEdges.right, this.boudingEdges.top]),
            new Point([this.boudingEdges.right, this.boudingEdges.bottom]),
            new Point([this.boudingEdges.left, this.boudingEdges.bottom]),
        ]

    }
}


export class Point {

    #drawSettings = _.cloneDeep(default_drawSettings);

    #x: number = 0;
    #y: number = 0;
    #z: number = 1;

    constructor(coordinates: number[]) {
        this.x = coordinates[0];
        this.y = coordinates[1];
        if (coordinates[2]) this.z = coordinates[2];
    }

    translate({x, y, z}: { x: number, y: number, z?: number }) {
        this.#x += x;
        this.#y += y;
        if (this.#z && z) this.#z += z;
    }

    get originalCoordinates() {
        return {x: this.#x, y: this.#y, z: this.#z};
    }

    set x(newX: number) {
        this.#x = newX;
    }

    get x(): number {
        return Math.round((window.innerWidth / 2) + this.#x);
    }

    set y(newY: number) {
        this.#y = newY;
    }

    get y(): number {
        return Math.round((window.innerHeight / 2) - this.#y);
    }

    set z(newZ: number) {
        this.#z = newZ;
    }

    get z(): number {
        return this.#z || 0;
    }

    draw(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.beginPath();

        ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.#drawSettings.fillColor.hexCode;
        ctx.fill();
        if (!this.#drawSettings.stroke.color.isNull()) {
            ctx.strokeStyle = this.#drawSettings.stroke.color.hexCode;
            ctx.stroke();
        }

        ctx.closePath();
    }

    setDrawSettings(drawSettings: DrawSettings) {
        for (const key in drawSettings) {
            if (this.#drawSettings.hasOwnProperty(key) && drawSettings.hasOwnProperty(key)) {
                (this.#drawSettings as any)[key] = (drawSettings as any)[key];
            }
        }
    }
}

export class Triangle extends Shape2D {
    points: Point[] = [];

    constructor(points: [Point, Point, Point], protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
        this.points = points;
        this._rot_pts = this.points;
    }

    get offCanvas(): boolean {
        if (this.boudingEdges.right <= -this.canvas.width / 2) return true;
        if (this.boudingEdges.left >= this.canvas.width / 2) return true;
        if (this.boudingEdges.top <= -this.canvas.height / 2) return true;

        return this.boudingEdges.bottom >= this.canvas.height / 2;
    }

    protected getRotationPoints(): [Point, Point, Point] {
        const pts = [];

        const pt1Vec = new Vector(this.centroid, this.points[0]);
        const pt2Vec = new Vector(this.centroid, this.points[1]);
        const pt3Vec = new Vector(this.centroid, this.points[2]);
        //
        // pt1Vec.draw(this.canvas);
        // pt2Vec.draw(this.canvas);
        // pt3Vec.draw(this.canvas);

        pts[0] = pt1Vec.rotateVector(this.rotation.default + this.rotation.added);
        pts[1] = pt2Vec.rotateVector(this.rotation.default + this.rotation.added);
        pts[2] = pt3Vec.rotateVector(this.rotation.default + this.rotation.added);
        return pts as [Point, Point, Point];
    }

    drawShape(): void {
        this.context.beginPath();
        this.context.moveTo(this._rot_pts[0].x, this._rot_pts[0].y);
        this.context.lineTo(this._rot_pts[1].x, this._rot_pts[1].y);
        this.context.lineTo(this._rot_pts[2].x, this._rot_pts[2].y);
        this.context.closePath();
    }

    drawEdgePoints() {
        for (const p of this.points) {
            p.draw(this.canvas);
        }
    }

    includesPoint(pt1: Point): boolean {
        const angles = [0, 0, 0];
        const oAngles = [0, 0, 0];

        oAngles[0] = getAngle([this.points[0], this.points[1], this.points[2]]);
        angles[0] = getAngle([this.points[0], this.points[1], pt1]);

        if (oAngles[0] < angles[0]) {
            return false;
        }

        oAngles[1] = getAngle([this.points[1], this.points[2], this.points[0]]);
        angles[1] = getAngle([this.points[1], this.points[2], pt1]);

        if (oAngles[1] < angles[1]) {
            return false;
        }

        oAngles[2] = getAngle([this.points[2], this.points[0], this.points[1]]);
        angles[2] = getAngle([this.points[2], this.points[0], pt1]);

        return (oAngles[0] >= angles[0]) && (oAngles[1] >= angles[1]) && (oAngles[2] >= angles[2]);
    }

    overlaps(shape: Shape2D): boolean {
        throw new Error('Method not implemented.');
    }

    get boudingEdges(): { left: number; right: number; top: number; bottom: number; } {
        const xVals = this._rot_pts.map(e => e.originalCoordinates.x);
        const yVals = this._rot_pts.map(e => e.originalCoordinates.y);
        const minx = _.min(xVals) as number;
        const maxx = _.max(xVals) as number;
        const miny = _.min(yVals) as number;
        const maxy = _.max(yVals) as number;
        return {left: minx, right: maxx, top: maxy, bottom: miny};
    }

    move(s: { x: number, y: number, z?: number }) {
        this.centroid.translate(s);
        this.points.forEach((e) => {
            e.translate(s);
        });
        this._rot_pts = this.getRotationPoints();
        this.square_edges = this.squareEdges();
    }
}

/*export class Rectangle extends Shape2D {
    constructor(centroid: Point, drawSettings: DrawSettings) {
        super(centroid, drawSettings);
    }

    draw(): void {
    }

    includesPoint(pt1: Point): boolean {
        return false;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    squareEdges(): Array<Point> {
        return [];
    }

}

export class Square extends Shape2D {
    constructor(centroid: Point, drawSettings: DrawSettings) {
        super(centroid, drawSettings);
    }

    draw(): void {
    }

    includesPoint(pt1: Point): boolean {
        return false;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    squareEdges(): Array<Point> {
        return [];
    }

}

export class Circle extends Shape2D {
    constructor(centroid: Point, drawSettings: DrawSettings) {
        super(centroid, drawSettings);
    }

    draw(): void {
    }

    includesPoint(pt1: Point): boolean {
        return false;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    squareEdges(): Array<Point> {
        return [];
    }

}

export class Ellipse extends Shape2D {
    constructor(centroid: Point, drawSettings: DrawSettings) {
        super(centroid, drawSettings);
    }

    draw(): void {
    }

    includesPoint(pt1: Point): boolean {
        return false;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    squareEdges(): Array<Point> {
        return [];
    }

}

export class Polygon extends Shape2D {
    constructor(centroid: Point, drawSettings: DrawSettings) {
        super(centroid, drawSettings);
    }

    draw(): void {
    }

    includesPoint(pt1: Point): boolean {
        return false;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    squareEdges(): Array<Point> {
        return [];
    }
}*/