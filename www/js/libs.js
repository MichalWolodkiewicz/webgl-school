const LIBS = {
    degToRad: function (angle) {
        return (angle * Math.PI / 180);
    },

    get_projection: function (angle, a, zMin, zMax) {
        var tan = Math.tan(LIBS.degToRad(0.5 * angle)),
            A = -(zMax + zMin) / (zMax - zMin),
            B = (-2 * zMax * zMin) / (zMax - zMin);

        return [
            0.5 / tan, 0, 0, 0,
            0, 0.5 * a / tan, 0, 0,
            0, 0, A, -1,
            0, 0, B, 0
        ];
    },

    get_I4: function () {
        return [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
    },

    set_I4: function (m) {
        m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0,
            m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0,
            m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0,
            m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
    },

    rotateX: function (m, angle) {
        m[5] = Math.cos(angle);
        m[6] = Math.sin(angle);
        m[9] = -Math.sin(angle);
        m[10] = Math.cos(angle);
    },

    rotateY: function (m, angle) {
        m[0] = Math.cos(angle);
        m[2] = -Math.sin(angle);
        m[8] = Math.sin(angle);
        m[10] = Math.cos(angle);
    },

    rotateZ: function (m, angle) {
        m[0] = Math.cos(angle);
        m[1] = Math.sin(angle);
        m[4] = -Math.sin(angle);
        m[5] = Math.cos(angle);
    },

    translateX: function (m, t) {
        m[12] = t;
    },

    translateY: function (m, t) {
        m[13] = t;
    },

    translateZ: function (m, t) {
        m[14] = t;
    },

    setScaleToMatrix: function (matrix, scale) {
        matrix[0] = scale;
        matrix[5] = scale;
        matrix[10] = scale;
    }

};