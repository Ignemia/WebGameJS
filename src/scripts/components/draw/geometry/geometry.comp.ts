import {Color} from '../color/color.comp';
import _ from "lodash";

// todo:    Predicting future
//          This step comes after application of transformation and physics
//          Create a clone of each object average frametime in the future without drawing and test these objects for overlaps
//          If the two objects interact/overlap apply physics for interaction

function getAngle(points: [Point, Point, Point]): number {
    const v = new Vector(points[1], points[0]);
    const u = new Vector(points[1], points[2]);

    return Math.acos(Vector.dotProduct(u, v) / (v.magnitude * u.magnitude));
}

function findOverlap(shape1: Shape2D, shape2: Shape2D) {
    enum modes {
        SAME_RECT = "rectangle:rectangle",
        SAME_CIRCLE = "circle:circle",
        SAME_POLYGON = "polygon:polygon",
        SAME_TRIANGLE = "triangle:triangle",
        RECT_C = "rectangle:circle",
        RECT_POL = "rectangle:polygon",
        RECT_TR = "rectangle:triangle",
        C_POL = "circle:polygon",
        C_TR = "circle:triangle",
        POL_TR = "polygon:triangle"
    }

    const mode = ((s1, s2) => {
        const hasRect = s1 instanceof Rectangle || s2 instanceof Rectangle;
        const hasCircle = s1 instanceof Circle || s2 instanceof Circle;
        const hasTriangle = s1 instanceof Triangle || s2 instanceof Triangle;
        // const hasPolygon = s1 instanceof Poly
        if ((s1.shapeName === s2.shapeName) || /* because Square is just a Rectangle */(s1 instanceof Rectangle && s2 instanceof Rectangle)) {
            if (hasTriangle) return modes.SAME_TRIANGLE;
            if (hasRect) return modes.SAME_RECT;
            if (hasCircle) return modes.SAME_CIRCLE;
            return modes.SAME_POLYGON;
        }
        if (hasRect && hasCircle) return modes.RECT_C;
        if (hasRect && hasTriangle) return modes.RECT_TR;
        if (hasCircle && hasTriangle) return modes.C_TR;
        return modes.POL_TR;
    })(shape1, shape2);

    console.log(mode);

    switch (mode) {
        case modes.SAME_RECT:
        default: {
            if (shape1 instanceof Rectangle && shape2 instanceof Rectangle) {
                const s1FunctionDesc = shape1.sideFunctionDescriptors;
                const s2FunctionDesc = shape2.sideFunctionDescriptors;
                const crossSections: Point[] = [];
                s1FunctionDesc.forEach((d1) => {
                    s2FunctionDesc.forEach((d2) => {
                        const crossSection = getCrosssectionPoint(d1, d2);
                        if (shape1.boundingRectangle.includesPoints(crossSection) && shape2.boundingRectangle.includesPoints(crossSection)) {
                            crossSections.push(crossSection);
                        }
                    })
                })
                for (const cs of crossSections) {
                    cs.setDrawSettings({fillColor: Color.PRESETS.RED});
                    cs.draw(shape1.getCanvas());
                }
                return crossSections.length > 0;
            }
            return false;
        }
        case modes.SAME_CIRCLE: {
            if (shape1 instanceof Circle && shape2 instanceof Circle) {
                return (new Vector(shape1.centerOfGravity, shape2.centerOfGravity)).magnitude >= shape1.radius + shape2.radius
            }
            return false;
        }
        case modes.SAME_TRIANGLE: {
            if (shape1 instanceof Triangle && shape2 instanceof Triangle) {
                const crossSections: Point[] = [];
                shape1.sideFunctionDescriptors.forEach((d1) => {
                    shape2.sideFunctionDescriptors.forEach((d2) => {
                        const crossSection = getCrosssectionPoint(d1, d2);
                        if (shape1.boundingRectangle.includesPoints(crossSection) && shape2.boundingRectangle.includesPoints(crossSection)) {
                            crossSections.push(crossSection);
                        }
                    })
                })
                for (const cs of crossSections) {
                    cs.setDrawSettings({fillColor: Color.PRESETS.RED});
                    cs.draw(shape1.getCanvas());
                }
                return crossSections.length > 0;
            }
            return false;
        }
        case modes.C_TR: {
            const tr = shape1 instanceof Triangle ? shape1 : shape2;
            const c = shape1 instanceof Circle ? shape1 : shape2;
            if (tr instanceof Triangle && c instanceof Circle) {
                tr.vectors.forEach((e) => {
                })
                return false;
            }
            return false;

        }
        case modes.RECT_C: {
            const rect = shape1 instanceof Rectangle ? shape1 : shape2;
            const c = shape1 instanceof Circle ? shape1 : shape2;
            if (rect instanceof Rectangle && c instanceof Circle) {

            }
            return false;
        }
        case modes.RECT_TR: {
            const tr = shape1 instanceof Triangle ? shape1 : shape2;
            const rect = shape1 instanceof Rectangle ? shape1 : shape2;
            if (tr instanceof Triangle && rect instanceof Rectangle) {

            }
            return false;
        }
    }
}

export function drawLineByEquation({a, b, canvas}: { a: number, b: number, canvas: HTMLCanvasElement }, x?: number) {
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

export function getCrosssectionPoint(v1: LinearFunctionDescriptors, v2: LinearFunctionDescriptors, xp?: number): Point {
    const x = (v1.b - v2.b) / (v2.a - v1.a) || xp;
    return new Point([x, (v1.a * x + v1.b)]);
}

export type LinearFunctionDescriptors = {
    a: number;
    b: number;
    x: number;
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

export class BoundaryRectangle {
    top: number;
    bottom: number;
    left: number;
    right: number;

    constructor({top, bottom, left, right}: { top: number, bottom: number, left: number, right: number }) {
        this.top = top;
        this.bottom = bottom;
        this.left = left;
        this.right = right;
    }

    includesPoints(pt: Point) {
        return ((pt.originalCoordinates.y <= this.top && pt.originalCoordinates.y >= this.bottom)
            &&
            (pt.originalCoordinates.x <= this.right && pt.originalCoordinates.x >= this.left));
    }

    update({top, left, right, bottom}: { top?: number, bottom?: number, left?: number, right?: number }) {
        this.top = !top ? this.top : top;
        this.right = !right ? this.right : right;
        this.left = !left ? this.left : left;
        this.bottom = !bottom ? this.bottom : bottom;
    }
}

export abstract class Shape2D {
    public shapeName = "Shape2D";
    public readonly boundingRectangle = new BoundaryRectangle({top: 0, left: 0, bottom: 0, right: 0});
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
        this.boundingRectangle.update({left: minx, right: maxx, top: maxy, bottom: miny});
        return {left: minx, right: maxx, top: maxy, bottom: miny};
    }

    getCanvas() {
        return this.canvas;
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

    overlaps(shape: Shape2D): boolean {
        return findOverlap(this, shape);
    };

    abstract get centerOfGravity(): Point;

    abstract get circumference(): number;

    abstract get area(): number;

    protected abstract getRotationPoints(): Point[];

    abstract move({x, y, z}: { x: number, y: number, z?: number }): void;

    abstract includesPoint(pt1: Point): boolean;

    abstract drawEdgePoints(): void;

    abstract drawShape(): void;

}

export class Vector {
    private _scale = 1;
    unit;
    normalVector;

    constructor(private pt1: Point, private pt2: Point) {
        this.unit = this.unitForm;
        this.normalVector = this.normal;
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
        return {
            a: -1 * this.deltaY / this.deltaX,
            b: (this.pt1.originalCoordinates.x * this.pt2.originalCoordinates.y - this.pt2.originalCoordinates.x * this.pt1.originalCoordinates.y) / this.deltaX,
            x: this.pt1.x
        };
    }

    get middlePoint() {
        return new Point([this.pt1.originalCoordinates.x + this.deltaX / 2, this.pt1.originalCoordinates.y + this.deltaY / 2]);
    }

    private get unitForm(): Point {
        return new Point([this.pt2.x + (this.deltaX / this.magnitude), this.pt2.y + (this.deltaY / this.magnitude)]);
    }

    private get normal(): Point {
        return new Point([this.pt2.x + (this.deltaY / this.magnitude), this.pt2.y - (this.deltaX / this.magnitude)])
    }

    static dotProduct(v1: Vector, v2: Vector): number {
        return (v1.deltaX * v2.deltaX) + (v1.deltaY * v2.deltaY);
    }

    scale(newScale: number) {
        this._scale = newScale;
        // return new Vector(this.pt2, new Point([this.pt2.originalCoordinates.x]))
    }

    rotateVector(amount: number, reverse = false): Point {
        const pt2 = reverse ? this.pt2 : this.pt1;

        const xMovement = Math.cos(amount) * this.deltaX - Math.sin(amount) * this.deltaY;
        const yMovement = Math.cos(amount) * this.deltaY + Math.sin(amount) * this.deltaX;

        return new Point([pt2.originalCoordinates.x + xMovement, pt2.originalCoordinates.y + yMovement]);
    }

    update(point1: Point, point2: Point) {
        this.pt1 = point1;
        this.pt2 = point2;
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

        ctx.arc(Math.floor(this.x), Math.floor(this.y), 3, 0, 2 * Math.PI, false);
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
    vectors: [Vector, Vector, Vector];
    shapeName = "Triangle";

    constructor(points: [Point, Point, Point], protected centroid: Point, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, canvas, drawSettings);
        this.points = points;
        this._rot_pts = this.points;
        this.vectors = [
            new Vector(this._rot_pts[0], this._rot_pts[1]),
            new Vector(this._rot_pts[1], this._rot_pts[2]),
            new Vector(this._rot_pts[2], this._rot_pts[0])
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
        this.vectors = [
            new Vector(pts[0], pts[1]),
            new Vector(pts[1], pts[2]),
            new Vector(pts[2], pts[0])
        ]
        return pts as [Point, Point, Point];
    }

    get sideFunctionDescriptors(): LinearFunctionDescriptors[] {
        return [
            (this.vectors[0]).equationDescription,
            (this.vectors[1]).equationDescription,
            (this.vectors[2]).equationDescription
        ]
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
    shapeName = "Rectangle";
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
        this._rot_pts = this.points;
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

    get sideFunctionDescriptors(): LinearFunctionDescriptors[] {
        return [
            (new Vector(this._rot_pts[0], this._rot_pts[1])).equationDescription,
            (new Vector(this._rot_pts[1], this._rot_pts[2])).equationDescription,
            (new Vector(this._rot_pts[2], this._rot_pts[3])).equationDescription,
            (new Vector(this._rot_pts[3], this._rot_pts[0])).equationDescription,
        ]
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

    get pts() {
        return this._rot_pts;
    }

    drawShape(): void {
        // for (let i = 0; i < 4; i++) {
        //     this._rot_pts[i].draw(this.canvas);
        // }

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
        if (this.triangles[0].includesPoint(pt1)) return true;
        return this.triangles[1].includesPoint(pt1);
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
    shapeName = "Square";

    constructor(centroid: Point, private readonly side: number, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
        super(centroid, {horizontal: side, vertical: side}, canvas, drawSettings);
    }
}

export class Circle extends Shape2D {
    shapeName = "Circle";

    constructor(centroid: Point, public readonly radius: number, protected readonly canvas: HTMLCanvasElement, drawSettings?: DrawSettings) {
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