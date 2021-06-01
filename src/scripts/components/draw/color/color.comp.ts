import Debugger from "../../debbugger/debugger.comp";

export class Color {
    #rgb = [0, 0, 0];
    #hsv = [0, 0, 0];
    public hexCode = "#000F";
    public opacity = 1

    static PRESETS = {
        NULL: new Color({r: 256, g: 256, b: 256}),
        BLACK: new Color({r: 0, g: 0, b: 0}),
        WHITE: new Color({r: 255, g: 255, b: 255}),
        RED: new Color({r: 255, g: 0, b: 0}),
        GREEN: new Color({r: 0, g: 255, b: 0}),
        BLUE: new Color({r: 0, g: 0, b: 255}),
        LIGHT_GRAY: new Color({r: 191, g: 191, b: 191}),
        GRAY: new Color({r: 127, g: 127, b: 127}),
        DARK_GRAY: new Color({r: 63, g: 63, b: 63}),
        YELLOW: new Color({r: 255, g: 255, b: 0}),
        MAGENTA: new Color({r: 255, g: 0, b: 255}),
        CYAN: new Color({r: 0, g: 255, b: 255}),
        ORANGE: new Color({r: 255, g: 128, b: 0}),
        PURPLE: new Color({r: 127, g: 0, b: 127}),
        GOLD: new Color({r: 255, g: 215, b: 0}),
        PINK: new Color({r: 255, g: 209, b: 220}),
        LIGHT_BLUE: new Color({r: 165, g: 235, b: 255})
    }

    constructor({r, g, b}: { r: number, g: number, b: number }) {
        this.#rgb = [Math.floor(r), Math.floor(g), Math.floor(b)];
        {
            const hexR = Math.floor(r).toString(16),
                hexG = Math.floor(g).toString(16),
                hexB = Math.floor(b).toString(16);
            this.hexCode = `#${"0"
                .repeat(hexR.length < 3 ? (2 - hexR.length) : 0) + hexR}${"0"
                .repeat(hexG.length < 3 ? (2 - hexG.length) : 0) + hexG}${"0"
                .repeat(hexB.length < 3 ? (2 - hexB.length) : 0) + hexB}`;
            Debugger.LOG(this, 6, "color");
        }
    }

    isNull() {
        return this.hexCode === Color.PRESETS.NULL.hexCode;
    }

    static getRandom(): Color {
        return new Color({r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255});
    }

    static Parse(): Color {
        // todo: implement
        return new Color({r: 0, g: 0, b: 0});
    }

    get rgb() {
        return {
            r: this.#rgb[0],
            g: this.#rgb[1],
            b: this.#rgb[2],
        }
    }

    get hsv() {
        return {
            h: this.#hsv[0],
            s: this.#hsv[1],
            v: this.#hsv[2],
        }
    }
}
