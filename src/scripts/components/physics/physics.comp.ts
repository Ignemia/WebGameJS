// todo:    1. Acceleration -> Mass (density) -> Force -> Speed -> Gravity
//          2. Collisions -> Friction -> Heat -> Thermodynamics
//          3. Fluid dynamics
//          4. Buoyancy -> Archimedes Law
//          ...
//          Final: Explosions

export const CONSTANTS = {
    // speed of light = 299 792 458 [ m / s ]
    c: 299792458,

    // average gravitational acceleration in earths gravitational field = 9.81 [ m / s^2^ ]
    g: 9.81,

    // Einsteins' gravitational constant = 6.6743015 × 10^-11^ [ m^3^ / ( kg * s^2^ ) ]
    G: 6.6743015*(1/Math.pow(10, 11)),
}