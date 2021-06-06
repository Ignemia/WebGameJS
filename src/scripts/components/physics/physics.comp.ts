// todo:    1. Acceleration -> Mass (density) -> Force -> Speed -> Gravity
//          2. Collisions -> Friction -> Heat -> Thermodynamics
//          3. Fluid dynamics
//          4. Buoyancy -> Archimedes Law
//          ...
//          Final: Explosions

import {Point, Rectangle, Shape2D} from "../draw/geometry/geometry.comp";
import {SCALE} from "../../index";
import _ from "lodash";

export namespace Physics {
    export const CONSTANTS = {
        // speed of light = 299 792 458 [ m / s ]
        c: 299792458,

        // average gravitational acceleration in earths gravitational field = 9.81 [ m / s^2^ ]
        g: 9.81,

        // Einsteins' gravitational constant = 6.6743015 × 10^-11^ [ m^3^ / ( kg * s^2^ ) ]
        G: 6.6743015 * (1 / Math.pow(10, 11)),
    }

    /**
     * @description Function returns how much faster or slower should object be moving based on acceleration and time provided
     * @param acceleration acceleration
     * @param timePassed delta T
     */
    export function accelerateByTime(acceleration: number, timePassed: number) {
        return -(acceleration) * 100 * SCALE * timePassed;
    }

    /**
     * @param acceleration in m / s^2^
     * @param mass in kg
     */
    export function getForce(acceleration: number, mass: number) {
        return acceleration * mass;
    }

    export function applyGravity(object: PhysicsObject, time: number) {
        object.geometry.addSpeed({y: accelerateByTime(CONSTANTS.g, time)});
    }


    export type MaterialOptions = {
        density: number;
        elasticity: number;
        ductility: number;
        hardness: number;
    }

    export class Material {
        public readonly density;
        public readonly elasticity;
        public readonly hardness;
        public readonly ductility;

        constructor(options: MaterialOptions) {
            this.density = options.density;
            this.elasticity = options.elasticity;
            this.ductility = options.ductility;
            this.hardness = options.hardness;
        }

        public static readonly PRESETS = {
            RUBBER: new Material({
                density: 132.5,
                elasticity: 0.8,
                ductility: 5.3,
                hardness: 0.5
            }),
            IRON: new Material({
                density: 395.2,
                elasticity: 0.15,
                ductility: 0.6,
                hardness: 4
            }),
            GROUND: new Material({
                density: Infinity,
                elasticity: 0,
                ductility: Infinity,
                hardness: Infinity
            })
        }
    }

    export type PhysicsObjectOptions = {
        material?: Material;
        static?: boolean;
    }

    const defaultPhysicsObjectOptions: PhysicsObjectOptions = Object.freeze({
        material: Material.PRESETS.RUBBER,
        static: false
    })

    export class PhysicsObject {
        public readonly options:PhysicsObjectOptions = _.cloneDeep(defaultPhysicsObjectOptions);

        constructor(public readonly geometry: Shape2D, options: PhysicsObjectOptions = _.cloneDeep(defaultPhysicsObjectOptions)) {
            this.options = options;
        }
    }
}

