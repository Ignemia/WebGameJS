import {mean} from 'lodash';

class Node {
    #next: Node | null = null;
    #previous: Node | null = null;
    #removable: boolean = false;

    public func: () => any = () => {
    };
    public id = Math.floor(Math.random() * Math.pow(2, 50)).toString(36);
    public name: string = "";

    constructor(func: () => any, name?: string, next?: Node, previous?: Node) {
        if (next) {
            this.#next = next;
        }
        if (previous) {
            this.#previous = previous;
        }
        if (name) {
            this.name = name;
            this.#removable = true;
        }
        this.func = func;
    }

    set next(next: Node) {
        this.#next = next;
    }

    get next(): Node {
        if (this.#next) {
            return this.#next;
        }
        return new Node(() => {
        }, "", undefined, this);
    }

    set previous(previous: Node) {
        this.#previous = previous;
    }

    get previous() {
        if (this.#previous) {
            return this.#previous;
        }
        return new Node(() => {
        }, "", this as Node);
    }

    get first() {
        let traversal: Node = this;
        while (!traversal.isFirst()) {
            traversal = traversal.previous as Node;
        }
        return traversal;
    }

    get last() {
        let traversal: Node = this;
        while (!traversal.isLast()) {
            traversal = traversal.next as Node;
        }
        return traversal;
    }

    isFirst() {
        return this.#previous === null;
    }

    isLast() {
        return this.#next === null;
    }

    use() {
        try {
            this.func();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    run(callback: (...props: any[]) => any) {
        let traversal: Node = this.first;
        try {
            do {
                traversal.use();
            } while ((!traversal.isLast()) && (traversal = traversal.next))
        } catch (err) {
            console.error(err);
            return false;
        }
        callback();
        return true;
    }

    append(node: Node) {
        node.previous = this.last;
        this.last.next = node;
    }

    remove() {
        this.previous.next = this.next;
        this.next.previous = this.previous;
    }
}

export default class UpdateLoop {
    #loopdata = {
        start: 0,
        end: 0
    }
    #preloop: Node = new Node(() => {
        this.#loopdata.end = performance.now();
        this.updatePerformaceStats(this.#loopdata.end - this.#loopdata.start);
        this.#loopdata.start = performance.now();
    });
    #mainloop: Node = new Node(() => {
        // console.log("mainloop")
    });
    #finalloop: Node = new Node(() => {
    });
    public end = false;
    public stats = {
        lastFrameTime: 0,
        last60FrameTimes: [] as number[],
        frameTimeAverage: 0,
        updateGenerationtime: Date.now(),
        appTime: performance.now(),
        totalFrames: 0
    };

    constructor(private readonly callback: (...params: any[]) => any) {
        this.#finalloop.append(new Node(callback));
    }

    async run() {
        if (!this.end) {
            this.#preloop.run(async () => {
                this.#mainloop.run(async () => {
                    this.#finalloop.run(async ()=>{
                        window.requestAnimationFrame(this.run.bind(this));
                    })
                })
            });
        } else {
            console.log("ended", this);
        }
    }

    updatePerformaceStats(frametime: number) {
        this.stats.appTime = performance.now();
        this.stats.lastFrameTime = frametime;
        if (this.stats.last60FrameTimes.length >= 60) {
            this.stats.last60FrameTimes.shift();
        }
        this.stats.last60FrameTimes.push(frametime);
        this.stats.frameTimeAverage = mean(this.stats.last60FrameTimes);
        this.stats.totalFrames++;
    }

    add(func: () => any) {
        this.#mainloop.append(new Node(func));
    }
}