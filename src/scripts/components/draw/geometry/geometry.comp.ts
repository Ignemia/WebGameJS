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
    fillColor?: Color;
    fillOpacity?: number;
    drawEdgePoints?: boolean;
    drawCentroid?: boolean;
    drawHitbox?: boolean;
    invisible?: boolean;
    drawBoundingBox?: boolean;
    scale?: number;
    blur?: number;
    stroke?: {
        color?: Color;
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
            a: (this.pt1.originalCoordinates.y - this.pt2.originalCoordinates.y) /
                (this.pt1.originalCoordinates.x - this.pt2.originalCoordinates.x),
            b: 0
        };
        otp.b = this.pt1.originalCoordinates.y - otp.a * this.pt1.originalCoordinates.x;
        return otp;
    }

    get middlePoint() {
        return new Point([this.pt1.originalCoordinates.x + this.deltaX / 2, this.pt1.originalCoordinates.y + this.deltaY / 2]);
    }

    static dotProduct(v1: Vector, v2: Vector): number {
        return (v1.deltaX * v2.deltaX) + (v1.deltaY * v2.deltaY);
    }

    rotateVector(amount: number, reverse = false): Point {
        const pt2 = reverse ? this.pt2 : this.pt1;

        const xMovement = Math.cos(amount) * this.deltaX - Math.sin(amount) * this.deltaY;
        const yMovement = Math.cos(amount) * this.deltaY + Math.sin(amount) * this.deltaX;

        return new Point([pt2.originalCoordinates.x + xMovement, pt2.originalCoordinates.y + yMovement]);
    }


    draw(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.moveTo(Math.round(this.pt1.x), Math.round(this.pt1.y));
        ctx.lineTo(Math.round(this.pt2.x), Math.round(this.pt2.y));
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
    ctx.moveTo(Math.round(leftPoint.x), Math.round(leftPoint.y));
    ctx.lineTo(Math.round(rightPoint.x), Math.round(rightPoint.y));
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

    get offCanvas(): boolean {
        if (Math.round(this.boudingEdges.right) <= -1 * Math.round(this.canvas.width / 2)) return true;
        if (Math.round(this.boudingEdges.left) >= Math.round(this.canvas.width / 2)) return true;
        if (Math.round(this.boudingEdges.top) <= -1 * Math.round(this.canvas.height / 2)) return true;

        return Math.round(this.boudingEdges.bottom) >= Math.round(this.canvas.height / 2);
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

    get boudingEdges(): { left: number; right: number; top: number; bottom: number; } {
        const xVals = this._rot_pts.map(e => e.originalCoordinates.x);
        const yVals = this._rot_pts.map(e => e.originalCoordinates.y);
        const minx = _.min(xVals) as number;
        const maxx = _.max(xVals) as number;
        const miny = _.min(yVals) as number;
        const maxy = _.max(yVals) as number;
        return {left: minx, right: maxx, top: maxy, bottom: miny};
    }

    addSpeed(speedToAdd: { x?: number, y?: number, z?: number }) {
        this.speed.changed.y += speedToAdd.y ?? 0;
        this.speed.changed.x += speedToAdd.x ?? 0;
        this.speed.changed.z += speedToAdd.z ?? 0;
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
        this._rot_pts = this.getRotationPoints();
        this.square_edges = this.squareEdges();

        this.drawShape();
        this.context.fillStyle = this.drawSettings.fillColor?.hexCode ?? Color.PRESETS.BLACK.hexCode;
        this.context.fill();

        if (!this.drawSettings.stroke?.color?.isNull()) {
            this.context.strokeStyle = this.drawSettings.stroke?.color?.hexCode ?? Color.PRESETS.BLACK.hexCode;
            this.context.stroke();
        }

        if (this.drawSettings.drawBoundingBox) {
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

        this.context.moveTo(Math.round(this.square_edges[0].x), Math.round(this.square_edges[0].y));
        this.context.lineTo(Math.round(this.square_edges[1].x), Math.round(this.square_edges[1].y));
        this.context.lineTo(Math.round(this.square_edges[2].x), Math.round(this.square_edges[2].y));
        this.context.lineTo(Math.round(this.square_edges[3].x), Math.round(this.square_edges[3].y));

        this.context.closePath();

        this.context.strokeStyle = "#333";
        this.context.stroke();
    }

    squareEdges(): Array<Point> {
        return [
            new Point([this.boudingEdges.left, this.boudingEdges.top]),
            new Point([this.boudingEdges.right, this.boudingEdges.top]),
            new Point([this.boudingEdges.right, this.boudingEdges.bottom]),
            new Point([this.boudingEdges.left, this.boudingEdges.bottom]),
        ]

    }

    abstract get centerOfGravity(): Point;

    abstract get circumference(): number;

    abstract get area(): number;

    protected abstract getRotationPoints(): Point[];

    abstract move({x, y, z}: { x: number, y: number, z?: number }): void;

    abstract includesPoint(pt1: Point): boolean;

    abstract drawEdgePoints(): void;

    abstract drawShape(): void;

    abstract overlaps(shape: Shape2D): boolean;
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

    translate({x, y, z}: { x: number, y: number, z?: number }): Point {
        this.#x += x;
        this.#y += y;
        if (this.#z && z) this.#z += z;
        return this;
    }

    get originalCoordinates() {
        return {x: this.#x, y: this.#y, z: this.#z};
    }

    set x(newX: number) {
        this.#x = newX;
    }

    get x(): number {
        return (window.innerWidth / 2) + this.#x;
    }

    set y(newY: number) {
        this.#y = newY;
    }

    get y(): number {
        return (window.innerHeight / 2) - this.#y;
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

        ctx.arc(Math.round(this.x), Math.round(this.y), 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = this.#drawSettings.fillColor.hexCode;
        ctx.fill();
        if (!this.#drawSettings.stroke.color.isNull()) {
            ctx.strokeStyle = this.#drawSettings.stroke.color.hexCode;
            ctx.stroke();
        }

        ctx.closePath();
    }

    setDrawSettings(drawSettings: DrawSettings): Point {
        for (const key in drawSettings) {
            if (this.#drawSettings.hasOwnProperty(key) && drawSettings.hasOwnProperty(key)) {
                (this.#drawSettings as any)[key] = (drawSettings as any)[key];
            }
        }
        return this;
    }

}

export class Triangle extends Shape2D {
    points: Point[] = [];
    private vectors: [Vector, Vector, Vector];

    constructor(points: [Point, Point, Point], protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
        this.points = points;
        this._rot_pts = this.points;
        this.vectors = [
            new Vector(this.points[0], this.points[1]),
            new Vector(this.points[1], this.points[2]),
            new Vector(this.points[2], this.points[0])
        ]
    }

    protected getRotationPoints(): [Point, Point, Point] {
        const pts = [];

        const pt1Vec = new Vector(this.centroid, this.points[0]);
        const pt2Vec = new Vector(this.centroid, this.points[1]);
        const pt3Vec = new Vector(this.centroid, this.points[2]);

        pts[0] = pt1Vec.rotateVector(this.rotation.default + this.rotation.added);
        pts[1] = pt2Vec.rotateVector(this.rotation.default + this.rotation.added);
        pts[2] = pt3Vec.rotateVector(this.rotation.default + this.rotation.added);
        return pts as [Point, Point, Point];
    }

    get circumference() {
        return (this.vectors[0].magnitude
            + this.vectors[1].magnitude
            + this.vectors[2].magnitude
        );
    }

    get area() {
        const p = this.circumference / 2;
        const heron: number = p * (
            (p - this.vectors[0].magnitude) *
            (p - this.vectors[1].magnitude) *
            (p - this.vectors[2].magnitude)
        )
        return Math.sqrt(heron);
    }

    get centerOfGravity() {
        const lineDescriptions = [
            (new Vector(this.points[2], this.vectors[0].middlePoint)).equationDescription,
            (new Vector(this.points[1], this.vectors[2].middlePoint)).equationDescription
        ];
        return getCrosssectionPoint(lineDescriptions[0], lineDescriptions[1]);
    }

    drawShape(): void {
        this.context.beginPath();
        this.context.moveTo(Math.round(this._rot_pts[0].x), Math.round(this._rot_pts[0].y));
        this.context.lineTo(Math.round(this._rot_pts[1].x), Math.round(this._rot_pts[1].y));
        this.context.lineTo(Math.round(this._rot_pts[2].x), Math.round(this._rot_pts[2].y));
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

        if (oAngles[0] < angles[0]) return false;


        oAngles[1] = getAngle([this.points[1], this.points[2], this.points[0]]);
        angles[1] = getAngle([this.points[1], this.points[2], pt1]);

        if (oAngles[1] < angles[1]) return false;

        oAngles[2] = getAngle([this.points[2], this.points[0], this.points[1]]);
        angles[2] = getAngle([this.points[2], this.points[0], pt1]);

        return (oAngles[0] >= angles[0]) && (oAngles[1] >= angles[1]) && (oAngles[2] >= angles[2]);
    }

    overlaps(shape: Shape2D): boolean {
        throw new Error('Method not implemented.');
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

export class Rectangle extends Shape2D {
    private triangles: [Triangle, Triangle];
    private points: [Point, Point, Point, Point];

    constructor(centroid: Point, private readonly sides: { horizontal: number, vertical: number }, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
        const sdHalfX = sides.horizontal / 2;
        const sdHalfY = sides.vertical / 2;
        const centerOriginal = this.centroid.originalCoordinates;
        this.points = [
            new Point([centerOriginal.x - sdHalfX, centerOriginal.y + sdHalfY]),
            new Point([centerOriginal.x + sdHalfX, centerOriginal.y + sdHalfY]),
            new Point([centerOriginal.x + sdHalfX, centerOriginal.y - sdHalfY]),
            new Point([centerOriginal.x - sdHalfX, centerOriginal.y - sdHalfY])
        ]
        this.triangles = [
            new Triangle([this.points[0], this.points[1], this.points[2]], this.centroid, this.canvas, drawSettings),
            new Triangle([this.points[2], this.points[3], this.points[0]], this.centroid, this.canvas, drawSettings)
        ]
    }

    protected getRotationPoints(): [Point, Point, Point, Point] {
        const otp = [];

        for (const pt of this.points) {
            const vec = new Vector(this.centroid, pt);
            otp.push(vec.rotateVector(this.rotation.default + this.rotation.added));
        }

        return otp as [Point, Point, Point, Point];
    }

    get circumference() {
        return 2 * (this.sides.vertical + this.sides.horizontal);
    }

    get area() {
        return this.sides.vertical * this.sides.horizontal;
    }

    get centerOfGravity() {
        return this.centroid;
    }

    drawShape(): void {
        for (let i = 0; i < 4; i++) {
            this._rot_pts[i].draw(this.canvas);
        }

        this.context.beginPath();
        this.context.moveTo(Math.round(this._rot_pts[0].x), Math.round(this._rot_pts[0].y));
        for (let i = 1; i <= 3; i++) {
            this.context.lineTo(Math.round(this._rot_pts[i].x), Math.round(this._rot_pts[i].y));
        }
        this.context.closePath();
    }

    drawEdgePoints() {
        for (const p of this.points) {
            p.draw(this.canvas);
        }
    }

    includesPoint(pt1: Point): boolean {
        return this.triangles[0].includesPoint(pt1) || this.triangles[1].includesPoint(pt1);
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    move({x, y, z}: { x: number; y: number; z?: number }): void {
        this.centroid.translate({x, y, z});
        this.points = this.points.map(e => e.translate({x, y, z})) as [Point, Point, Point, Point];
        this.triangles = [
            new Triangle([this.points[0], this.points[1], this.points[2]], this.centroid, this.canvas, this.drawSettings),
            new Triangle([this.points[2], this.points[3], this.points[0]], this.centroid, this.canvas, this.drawSettings)
        ]
    }
}

export class Square extends Rectangle {
    constructor(centroid: Point, private readonly side: number, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, {horizontal: side, vertical: side}, canvas, drawSettings);
    }
}

export class Circle extends Shape2D {
    constructor(centroid: Point, private readonly radius: number, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
    }

    protected getRotationPoints(): [] {
        return [];
    }

    override rotate(amount: number) {
        return;
    }

    override rotateAnimationApply(pastTime: number) {
        return;
    }

    override get boudingEdges(): { left: number; right: number; top: number; bottom: number; } {
        return {
            left: this.centroid.originalCoordinates.x - this.radius,
            right: this.centroid.originalCoordinates.x + this.radius,
            top: this.centroid.originalCoordinates.y + this.radius,
            bottom: this.centroid.originalCoordinates.y - this.radius
        };
    }

    get circumference() {
        return Math.PI * 2 * this.radius;
    }

    get area() {
        return Math.PI * (Math.pow(this.radius, 2));

    }

    get centerOfGravity() {
        return this.centroid;
    }

    drawShape(): void {
        this.context.beginPath();
        this.context.arc(Math.round(this.centroid.x), Math.round(this.centroid.y), this.radius, 0, 2 * Math.PI);
        this.context.closePath();
    }

    drawEdgePoints() {
        return;
    }

    includesPoint(pt1: Point): boolean {
        return (new Vector(this.centroid, pt1)).magnitude <= this.radius;
    }

    overlaps(shape: Shape2D): boolean {
        return false;
    }

    move({x, y, z}: { x: number; y: number; z?: number }): void {
        this.centroid.translate({x, y, z});
    }
}

/*
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