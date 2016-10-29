var GL;
var logBox;
var triangle_buffer;
var faces_buffer;

function addColor(colors, circleVertexes) {
    for (var c = 0; c < colors.length; ++c) {
        circleVertexes.push(colors[c]);
    }
}

var colorGenerator = {
    colors: [[0, 0, 0], [1, 1, 1]],
    actualColorIndex: 0,
    generate: function () {
        if (++this.actualColorIndex == this.colors.length) {
            this.actualColorIndex = 0;
        }
        return this.colors[this.actualColorIndex];
    }
};

function calculateCircleVertexes(angleStep) {
    var circleVertexes = [0, 0, 0, 1, 0, 0];
    var radiansConverter = 180 / Math.PI;
    for (var i = 0; i <= 360; i += angleStep) {
        console.log([i, Math.cos(i/180*Math.PI), Math.sin(i/180*Math.PI)]);
        circleVertexes.push(Math.cos(i/180*Math.PI));
        circleVertexes.push(Math.sin(i/180*Math.PI));
        circleVertexes.push(0);
        addColor(colorGenerator.generate(), circleVertexes);
    }
    return circleVertexes;
}

function calculateCircleFaces() {
    var circleFaces = [];
    for (var i = 6; i < circle_vertex.length-6; i += 6) {
        circleFaces.push(0);
        circleFaces.push(i / 6);
        circleFaces.push(i / 6 + 1);
    }
    return circleFaces;
}

const circle_vertex = calculateCircleVertexes(10);

var triangle_faces = calculateCircleFaces();

var vertex_number = triangle_faces.length;

function logError(message) {
    var logRow = '<p style="color: #ef1214;">' + message + '</p>';
    logBox.innerHTML = logBox.innerHTML + logRow;
}

function logNormal(message) {
    var logRow = '<p>' + message + '</p>';
    console.log('log normal');
    logBox.innerHTML = logBox.innerHTML + logRow;
}

function initLogger() {
    logBox = document.getElementById('log-box');
}

function initWebGL() {
    initLogger();
    var canvas = document.getElementById('glCanvas');
    try {
        GL = canvas.getContext('webgl', {antialias: true}) || canvas.getContext('web-gl-academy-context', {antialias: true});
    } catch (e) {
        logError(e);
        return false;
    }
    if (GL === null) {
        logError('GL context is null');
        return false;
    } else {
        logNormal('web gl context initialized properly.');
    }
    var vertex_shader = get_shader(vertex_shader_src, GL.VERTEX_SHADER);
    var fragment_shader = get_shader(fragment_shader_src, GL.FRAGMENT_SHADER);
    var program = createProgram(vertex_shader, fragment_shader);
    var _Pmatrix = GL.getUniformLocation(program, "Pmatrix");
    var _Mmatrix = GL.getUniformLocation(program, "Mmatrix");
    var _Vmatrix = GL.getUniformLocation(program, "Vmatrix");
    var _position = GL.getAttribLocation(program, 'position');
    var _color = GL.getAttribLocation(program, 'color');
    GL.enableVertexAttribArray(_position);
    GL.enableVertexAttribArray(_color);
    GL.useProgram(program);
    triangle_buffer = GL.createBuffer();
    faces_buffer = GL.createBuffer();
    bindTriangleBuffers();
    var PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
    var MOVEMATRIX = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -5);
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearDepth(1.0);
    var time_old = 0;
    var animate = function (time) {
        var dAngle = 0.005 * (time - time_old);
        LIBS.rotateY(MOVEMATRIX, dAngle);
        time_old = time;
        GL.viewport(0.0, 0.0, canvas.width, canvas.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
        GL.bindBuffer(GL.ARRAY_BUFFER, triangle_buffer);
        GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 4 * (3 + 3), 0);
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buffer);
        GL.drawElements(GL.TRIANGLES, vertex_number, GL.UNSIGNED_SHORT, 0);
        GL.flush();
        window.requestAnimationFrame(animate);
    };
    animate(0);
    return true;
}

var vertex_shader_src = "\n\
    attribute vec3 position;\n\
    attribute vec3 color;\n\
    uniform mat4 Pmatrix;\n\
    uniform mat4 Vmatrix;\n\
    varying vec3 vColor;\n\
    uniform mat4 Mmatrix;\n\
    void main(void) {\
        gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\
        vColor = color;\
    }";

var fragment_shader_src = "\
    precision mediump float;\n\
    varying vec3 vColor;\n\
    void main(void) {\
        gl_FragColor = vec4(vColor, 1.);\
    }";

function getShaderNameByType(type) {
    return type == GL.VERTEX_SHADER ? 'vertex' : 'fragment';
}

function createProgram(v_shader, f_shader) {
    var program = GL.createProgram();
    GL.attachShader(program, v_shader);
    GL.attachShader(program, f_shader);
    GL.linkProgram(program);
    return program;
}

function bindTriangleBuffers() {
    GL.bindBuffer(GL.ARRAY_BUFFER, triangle_buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(circle_vertex), GL.STATIC_DRAW);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces_buffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_faces), GL.STATIC_DRAW);
}

var get_shader = function (source, type) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
        logError('ERROR IN ' + getShaderNameByType(type) + ' ' + GL.getShaderInfoLog(shader));
        return false;
    }
    logNormal(getShaderNameByType(type) + 'compiled');
    return shader;
}

