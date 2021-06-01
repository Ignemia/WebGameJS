import queryString from 'query-string';

export default class Debugger {
    static #level: number = Number(queryString.parse(location.search).debugLevel) ?? 0; // 10 - all, 0 - none
    static #errorLevel: number = Number(queryString.parse(location.search).debugErrorLevel) ?? 0; // ^^^
    static #modules = (queryString.parse(location.search).debugModules as string ?? "").split(",");

    constructor() {
        Debugger.FORMATED(1, "debugger", `Debugger launched with settings:\r\n%cLevel: ${Debugger.#level}\r\nErrorLevel: ${Debugger.#errorLevel}\r\nModules: [ ${Debugger.#modules.join(", ")} ]`, "font-weight: 600; color: #f00;");
    }

    static LOG(message: any, level = 10, module = "none") {
        if (level <= Debugger.#level && Debugger.#modules.includes(module)) {
            console.log(message);
        }
    }

    static ERROR(message: any, level = 10, module:string) {
        if (level <= Debugger.#errorLevel && Debugger.#modules.includes(module)) {
            console.error(message);
        }
    }

    static setDebuggerLevel(level: number) {
        Debugger.#level = level;
        console.log(Debugger);
    }

    static setDebuggerErrorLevel(level: number) {
        Debugger.#errorLevel = level;
    }

    static FORMATED(level: number, module: string, ...args: any[]) {
        if (level <= Debugger.#level && Debugger.#modules.includes(module)) {
            console.log(args[0], args[1]);
        }
    }
}
new Debugger();