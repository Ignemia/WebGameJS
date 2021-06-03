import UpdateLoop from './components/update-loop/update-loop.comp';
import {clearCanvas, drawCoordinateSystem, mainCanvas, redraw} from "./components/draw/draw.comp";
import {Color} from "./components/draw/color/color.comp";
import Debugger from "./components/debbugger/debugger.comp";

import "../styles/app.scss";
import {Point, Shape2D, Triangle} from "./components/draw/geometry/geometry.comp";

class App {
    debugger = new Debugger();
    private bgColor = new Color({r: 255, g: 255, b: 255});

    #updateLoop: UpdateLoop = new UpdateLoop(() => {});

    #objects = [] as Shape2D[];

    #canvas = mainCanvas;

    constructor() {
        document.body.appendChild(this.#canvas);

        this.#setup();

        this.addToUpdateLoop(this.#objectsUpdate);
        this.addToUpdateLoop(this.#draw);

        this.#updateLoop.run();
    }

    #setup() {
        for (let i = 0; i <= 100; i++) {
            const centerCoordinates = [
                Math.random() * (this.#canvas.width-300) - (this.#canvas.width / 2-150),
                Math.random() * (this.#canvas.height-300) - (this.#canvas.height / 2-150)
            ];
            const center = new Point(centerCoordinates);
            const mag = Math.random() * 50 + 50;
            const pt1 = new Point([centerCoordinates[0], centerCoordinates[1] + mag]);
            const pt2 = new Point([centerCoordinates[0] + (3 / 4) * mag, centerCoordinates[1] - mag / 2]);
            const pt3 = new Point([centerCoordinates[0] - (3 / 4) * mag, centerCoordinates[1] - mag / 2]);

            const tr = new Triangle([pt1, pt2, pt3], center, this.#canvas, {fillColor: Color.getRandom()});
            tr.defaultRotation = Math.random() * 180;
            tr.rotationSpeed = Math.random() * 30;

            tr.movementDefaultSpeed = {
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50
            }

            this.#objects.push(tr);
        }
    }

    #objectsUpdate = () => {
        this.#objects = this.#objects.filter((o)=>{
            if(o.offCanvas) return false;

            o.rotateAnimationApply(this.#updateLoop.stats.lastFrameTime / 1000);
            o.translationAnimationApply(this.#updateLoop.stats.lastFrameTime / 1000);
            return true;
        })
    }

    #draw = () => {
        clearCanvas(this.#canvas);
        redraw(this.#objects);
    }

    addToUpdateLoop(input: (...params: any[]) => any) {
        this.#updateLoop.add(input);
    }
}

(window as any)['app' as any] = new App();