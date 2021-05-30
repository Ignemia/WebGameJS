import {Color} from '../color/color.comp';

export default class Point {
    x: number = 0;
    y: number = 0;
    z?: number;
}
export type DrawSettings = {
    fillColor: any;
    fillOpacity: number;
    drawEdgePoints: boolean;
    drawHitbox: boolean;
    invisible: boolean;
    scale: number;
    blur: number;
    stroke: {
        color: any;
        strength: number;
        opacity: number
    }
};

abstract class Shape2D {
    #drawSettings: DrawSettings = {
        fillColor: Color,
        fillOpacity: 1,
        stroke: {
            color: Color,
            strength: 1,
            opacity: 1
        },
        drawHitbox: false,
        drawEdgePoints: false,
        invisible: false,
        scale: 1,
        blur: 0
    }

    constructor() {
    }

    abstract includesPoint(pt1: Point): boolean;

    abstract draw(): void;

    abstract overlaps(shape: Shape2D): boolean;

    abstract squareEdges(): Array<Point>;
}


export class Triangle extends Shape2D {

}

export class Rectangle extends Shape2D {

}

export class Square extends Shape2D {

}

export class Circle extends Shape2D {

}

export class Ellipse extends Shape2D {

}

export class Polygon extends Shape2D {

}