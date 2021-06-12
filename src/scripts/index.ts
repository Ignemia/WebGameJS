import UpdateLoop from './components/update-loop/update-loop.comp';
import {clearCanvas, mainCanvas, redraw} from "./components/draw/draw.comp";
import Debugger from "./components/debbugger/debugger.comp";

import "../styles/app.scss";
import {Circle, Point, Rectangle, Square, Triangle} from "./components/draw/geometry/geometry.comp";
import {Physics} from "./components/physics/physics.comp";
import PhysicsObject = Physics.PhysicsObject;
import applyGravity = Physics.applyGravity;
import Material = Physics.Material;
import {Color} from "./components/draw/color/color.comp";

// cm / px
export const SCALE = 2;

class App {
    debugger = new Debugger();
    #updateLoop: UpdateLoop = new UpdateLoop(() => {});

    #objects = [] as PhysicsObject[];

    #canvas = mainCanvas;

    public readonly GROUND = new Physics.PhysicsObject(new Rectangle(new Point([0, -window.innerHeight / 2+25]), {
        horizontal: window.innerWidth,
        vertical: 50
    }, this.#canvas, {fillColor: Color.PRESETS.GREEN}), {material: Material.PRESETS.GROUND, static: true})

    constructor() {
        document.body.appendChild(this.#canvas);

        this.#setup();

        this.addToUpdateLoop(this.#applyPhysics);
        this.addToUpdateLoop(this.#objectsUpdate);
        this.addToUpdateLoop(this.#draw);

        this.#updateLoop.run();
    }

    #setup() {
        this.#objects.push(
           this.GROUND,
            new PhysicsObject(new Square(new Point([0, 0]), 100, this.#canvas)),
            new PhysicsObject(new Rectangle(new Point([-100, 0]), {horizontal: 100, vertical: 150}, this.#canvas, {fillColor: Color.PRESETS.PINK})),
           //  new Physics.PhysicsObject(new Circle(new Point([0,0,]), 50, this.#canvas,{fillColor: Color.PRESETS.CYAN})),
           //  new Physics.PhysicsObject(new Triangle([
           //      new Point([0, 100]),
           //      new Point([35,-75]),
           //      new Point([-35,-75])
           //  ], new Point([0,0]), this.#canvas, {fillColor: Color.PRESETS.PINK})),



        )
        // this.#objects[1].geometry.defaultRotation = 89;
        this.#objects[1].geometry.rotationSpeed = 100;
        this.#objects[2].geometry.rotationSpeed = -100;
        this.#objects[1].geometry.movementDefaultSpeed = {x: 0, y: 1300, z: 0}
        this.#objects[2].geometry.movementDefaultSpeed = {x: 0, y: 1200, z: 0}
    }

    #applyPhysics = () => {
        for (const ob of this.#objects) {
            if(ob.options.static) continue;
            applyGravity(ob, this.#updateLoop.stats.lastFrameTime / 1000);
        }
    }

    #objectsUpdate = () => {
        this.#objects.forEach((o) => {
            if (o.options.static) return;
            o.geometry.rotateAnimationApply(this.#updateLoop.stats.lastFrameTime / 1000);
            o.geometry.translationAnimationApply(this.#updateLoop.stats.lastFrameTime / 1000);
        })
    }

    #draw = () => {
        clearCanvas(this.#canvas);
        redraw(this.#objects);
        this.#objects[2].geometry.overlaps(this.#objects[1].geometry);
    }

    addToUpdateLoop(input: (...params: any[]) => any) {
        this.#updateLoop.add(input);
    }
}

const app = new App();
(window as any)['app'] = app;