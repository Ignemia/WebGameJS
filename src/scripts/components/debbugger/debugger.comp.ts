export default class Debugger {
    static #level: number = 10; // 10 - all, 0 - none
    static #errorLevel: number = 10; // ^^^
    static LOG(message: any, level = 10) {
        if (level <= Debugger.#level) {
            console.log(message);
        }
    }
    static ERROR(message: any, level = 10){
        if(level <= Debugger.#errorLevel) {
            console.error(message);
        }
    }
    static setDebuggerLevel(level: number) {
        Debugger.#level = level;
        console.log(Debugger);
    }
    static setDebuggerErrorLevel(level:number) {
        Debugger.#errorLevel = level;
    }
}