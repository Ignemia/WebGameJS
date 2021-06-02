import UpdateLoop from './components/update-loop/update-loop.comp';
import {drawCoordinateSystem, mainCanvas, redraw} from "./components/draw/draw.comp";
import {Color} from "./components/draw/color/color.comp";
import Debugger from "./components/debbugger/debugger.comp";

import "../styles/app.scss";
import {Point, Shape2D, Triangle} from "./components/draw/geometry/geometry.comp";

class App {
    debugger = new Debugger();
    private bgColor = new Color({r: 255, g: 255, b: 255});

    #updateLoop: UpdateLoop = new UpdateLoop(() => {

    });

    #objects = [] as Shape2D[];

    #canvas = mainCanvas;

    constructor() {
        document.body.appendChild(this.#canvas);

        this.#setup();

        this.addToUpdateLoop(this.#draw);

        this.#updateLoop.run();
    }

    #setup = () => {
        for (let i = 0; i <= 100; i++) {
            const centerCoordinates = [
                Math.random() * this.#canvas.width - this.#canvas.width / 2,
                Math.random() * this.#canvas.height - this.#canvas.height / 2
            ];
            const center = new Point(centerCoordinates);
            const mag = Math.random() * 50 + 50;
            const pt1 = new Point([centerCoordinates[0], centerCoordinates[1] + mag]);
            const pt2 = new Point([centerCoordinates[0] + (3 / 4) * mag, centerCoordinates[1] - mag / 2]);
            const pt3 = new Point([centerCoordinates[0] - (3 / 4) * mag, centerCoordinates[1] - mag / 2]);

            const tr = new Triangle([pt1, pt2, pt3], center, this.#canvas, {fillColor: Color.getRandom(), /*drawCentroid: true, drawEdgePoints:true*/});
            tr.defaultRotation = Math.random()*180;
            tr.rotationSpeed = Math.random()*180;

            this.#objects.push(tr);
        }
    }

    #draw = () => {
        redraw(this.#objects);
        for(const obj of this.#objects) {
            obj.rotateAnimationApply(this.#updateLoop.stats.lastFrameTime/1000);
            // obj.drawSquareEdges();
        }
        // drawCoordinateSystem();
    }

    addToUpdateLoop(input: (...params: any[]) => any) {
        this.#updateLoop.add(input);
    }
}

(window as any)['app' as any] = new App();