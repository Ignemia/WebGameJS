import UpdateLoop from './components/update-loop/update-loop.comp';
import {clearCanvas, drawCoordinateSystem, mainCanvas, redraw} from "./components/draw/draw.comp";
import {Color} from "./components/draw/color/color.comp";
import Debugger from "./components/debbugger/debugger.comp";

import "../styles/app.scss";
import {Point, Rectangle, Shape2D, Square, Triangle} from "./components/draw/geometry/geometry.comp";

class App {
    debugger = new Debugger();
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
        for (let i = 0; i <= 10; i++) {
            const centerCoordinates = [
                Math.random() * (this.#canvas.width-300) - (this.#canvas.width / 2-150),
                Math.random() * (this.#canvas.height-300) - (this.#canvas.height / 2-150)
            ];
            const center = new Point(centerCoordinates);
            const mag = Math.random() * 50 + 50;

            const tr = new Square(center, mag, this.#canvas, {fillColor: Color.getRandom()/*, drawBoundingBox:true, drawEdgePoints: true, drawHitbox: true, drawCentroid: true*/});

            tr.defaultRotation = Math.random() * 180;
            tr.rotationSpeed = Math.random() * 80-40;

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