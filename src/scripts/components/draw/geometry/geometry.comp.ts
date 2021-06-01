import {Color} from '../color/color.comp';
import _ from "lodash";

class Vector {
    constructor(private readonly pt1:Point, private readonly pt2:Point) {
    }

    get deltaX():number {
        return this.pt1.x-this.pt2.x
    }
    get deltaY():number {
        return this.pt1.y-this.pt2.y
    }
    get magnitude():number {
        return Math.sqrt(Math.pow(this.deltaX,2)+Math.pow(this.deltaY,2));
    }
    static dotProduct(v1:Vector,v2:Vector):number {
        return (v1.deltaX*v2.deltaX)+(v1.deltaY*v2.deltaY);
    }
}

function getAngle(points: Point[]):number {
    if(points.length !== 3) throw new Error("To get angle you need exactly 3 points");

    const v = new Vector(points[1], points[0]);
    const u = new Vector(points[1], points[2]);

    return Math.acos(Vector.dotProduct(u,v)/(v.magnitude*u.magnitude));
}

export default class Point {

    #drawSettings = _.cloneDeep(default_drawSettings);

    #x: number = 0;
    #y: number = 0;
    #z?: number;

    constructor(coordiantes: number[]) {
        this.x = coordiantes[0];
        this.y = coordiantes[1];
        if (!_.isNil(coordiantes[2])) this.z = coordiantes[2];
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

        ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
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

export type DrawSettings = {
    fillColor?: any;
    fillOpacity?: number;
    drawEdgePoints?: boolean;
    drawCentroid?:boolean;
    drawHitbox?: boolean;
    invisible?: boolean;
    scale?: number;
    blur?: number;
    stroke?: {
        color?: any;
        strength?: number;
        opacity?: number
    }
};

export const default_drawSettings = Object.freeze({
    blur: 0,
    drawEdgePoints: false,
    drawHitbox: false,
    drawCentroid: false,
    fillColor: Color.PRESETS.BLACK,
    fillOpacity: 1,
    invisible: false,
    scale: 1,
    stroke: {color: Color.PRESETS.NULL, opacity: 1, strength: 1}
});

abstract class Shape2D {
    protected drawSettings: DrawSettings = _.cloneDeep(default_drawSettings);
    protected context: CanvasRenderingContext2D;

    protected constructor(protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        for (const key in drawSettings) {
            if (this.drawSettings.hasOwnProperty(key) && drawSettings.hasOwnProperty(key)) {
                (this.drawSettings as any)[key] = (drawSettings as any)[key];
            }
        }
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    abstract includesPoint(pt1: Point): boolean;

    draw(): void {
        this.drawShape();
        this.context.fillStyle = this.drawSettings.fillColor.hexCode;
        this.context.fill();
        if(!this.drawSettings.stroke?.color.isNull()) {
            this.context.strokeStyle = this.drawSettings.stroke?.color.hexCode;
            this.context.stroke();
        }

        if (this.drawSettings.drawEdgePoints) {
            this.drawEdgePoints();
        }

        if(this.drawSettings.drawCentroid) {
            this.centroid.setDrawSettings({fillColor: Color.PRESETS.RED});
            this.centroid.draw(this.canvas);
        }
    }

    abstract drawEdgePoints(): void;

    abstract drawShape(): void;

    abstract overlaps(shape: Shape2D): boolean;

    abstract squareEdges(): Array<Point>;

    abstract rotate(rotationSettings: Point): void;
}


export class Triangle extends Shape2D {
    points: Point[] = [];

    constructor(points: [Point, Point, Point], protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
        this.points = points;

    }

    drawShape(): void {
        this.context.beginPath();
        this.context.moveTo(this.points[0].x, this.points[0].y);
        this.context.lineTo(this.points[1].x, this.points[1].y);
        this.context.lineTo(this.points[2].x, this.points[2].y);
        this.context.lineTo(this.points[0].x, this.points[0].y);
        this.context.closePath();
    }

    drawEdgePoints() {
        for (const p of this.points) {
            p.draw(this.canvas);
        }
    }

    // check whether point lays within a planar triangle
    includesPoint(pt1: Point): boolean {
        const angles = [0,0,0];
        const oAngles = [0,0,0];

        oAngles[0] = getAngle([this.points[0], this.points[1], this.points[2]]);
        oAngles[1] = getAngle([this.points[1], this.points[2], this.points[0]]);
        oAngles[2] = getAngle([this.points[2], this.points[0], this.points[1]]);

        // get angle returns angle in radians
        angles[0] = getAngle([this.points[0], this.points[1], pt1]);
        angles[1] = getAngle([this.points[1], this.points[2], pt1]);
        angles[2] = getAngle([this.points[2], this.points[0], pt1]);

        return (oAngles[0] >= angles[0]) && (oAngles[1] >= angles[1]) && (oAngles[2] >= angles[2]);
    }

    overlaps(shape: Shape2D): boolean {
        throw new Error('Method not implemented.');
    }

    squareEdges(): Array<Point> {
        throw new Error('Method not implemented.');
    }

    rotate(rotationSettings: Point): void {
        throw new Error('Method not implemented.');
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