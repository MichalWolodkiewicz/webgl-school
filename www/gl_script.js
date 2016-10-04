var GL;
var logBox;

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
    var _position = GL.getAttribLocation(program, 'position');
    var _color = GL.getAttribLocation(program, 'color');
    GL.enableVertexAttribArray(_position);
    GL.enableVertexAttribArray(_color);
    GL.useProgram(program);
    var triangle_vertex = [
        -1, -1,
        0,0,1,
        1, -1,
        1,1,0,
        1, 1,
        1,0,0];
    var triangle_buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, triangle_buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle_vertex), GL.STATIC_DRAW);
    var triangle_faces = [0,1,2];
    var triangle_buffer = GL.createBuffer();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, triangle_buffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_faces), GL.STATIC_DRAW);
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    var animate=function() {
        GL.viewport(0.0, 0.0, canvas.width, canvas.height);
        GL.clear(GL.COLOR_BUFFER_BIT);
        GL.bindBuffer(GL.ARRAY_BUFFER, triangle_buffer);
        GL.vertexAttribPointer(_position, 2, GL.FLOAT, false,4*5,0) ;
        GL.vertexAttribPointer(_color, 3, GL.FLOAT, false,4*5,2*4) ;
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, triangle_buffer);
        GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
        GL.flush();
        window.requestAnimationFrame(animate);
    };

    animate();
    return true;
}

var vertex_shader_src = "\n\
    attribute vec2 position;\n\
    attribute vec3 color;\n\
    varying vec3 vColor;\n\
    void main(void) {\
        gl_Position = vec4(position, 0., 1.);\
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
