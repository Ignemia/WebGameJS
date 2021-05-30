export class Color {
    #rgb = [0, 0, 0];
    #hsv = [0, 0, 0];
    public hexCode = "#000F";
    public opacity = 1

    constructor({r, g, b}: { r: number, g: number, b: number }) {
        // todo: implement
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
