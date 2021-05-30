import UpdateLoop from './components/update-loop/update-loop.comp';
import $ from 'jquery';
import Debugger from "./components/debbugger/debugger.comp";

class App {
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