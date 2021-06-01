import UpdateLoop from './components/update-loop/update-loop.comp';
import $ from 'jquery';
import "./components/draw/draw.comp";
import {Color} from "./components/draw/color/color.comp";
import Debugger from "./components/debbugger/debugger.comp";

import "../styles/app.scss";

class App {
    debugger = new Debugger();
    private bgColor = new Color({r:255,g:255,b:255});

    #updateLoop: UpdateLoop = new UpdateLoop(() => {

    });

    constructor() {
        const cv = document.createElement('button');
        cv.innerText = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        $(cv).on('click', () => {
            this.#updateLoop.end = true;
        });
        document.body.appendChild(cv);

        this.#updateLoop.run();
    }

    #draw() {

    }

    addToUpdateLoop(input: (...params: any[]) => any) {
        this.#updateLoop.add(input);
    }
}

// (window as any)['app' as any] = new App();