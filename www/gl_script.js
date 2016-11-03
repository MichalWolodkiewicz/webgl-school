var GL;
var logBox;
var circles;
var canvas;
var theta = 0;

function addColor(colors, circleVertexes) {
    for (var c = 0; c < colors.length; ++c) {
        circleVertexes.push(colors[c]);
    }
}

var colorGenerator = {
    colors: [[0, 0, 0], [255, 255, 255]],
    actualColorIndex: 0,
    generate: function () {
        if (++this.actualColorIndex == this.colors.length) {
            this.actualColorIndex = 0;
        }
        return this.colors[this.actualColorIndex];
    }
};

function createCircles(dimension, angleStep) {
    var circles = [];
    var partSize = 2 / dimension;
    for (var i = -1 + partSize / 2; i < 1; i += partSize) {
        for (var j = 1 - partSize / 2; j > -1; j -= partSize) {
            var circleObject = {};
            circleObject.vertexes = getCircleVertexes(i, j, partSize / 2, angleStep);
            circleObject.faces = getCircleFaces(circleObject.vertexes);
            circleObject.colors = getVertexesColors(circleObject.vertexes.length);
            circleObject.vertex_buffer = GL.createBuffer();
            circleObject.faces_buffer = GL.createBuffer();
            circleObject.colors_buffer = GL.createBuffer();
            circleObject.size = partSize;
            GL.bindBuffer(GL.ARRAY_BUFFER, circleObject.vertex_buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(circleObject.vertexes), GL.STATIC_DRAW);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, circleObject.faces_buffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(circleObject.faces), GL.STATIC_DRAW);
            GL.bindBuffer(GL.ARRAY_BUFFER, circleObject.colors_buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Uint8Array(circleObject.colors), GL.STATIC_DRAW);
            circles.push(circleObject);
        }
    }
    return circles;
}

function getTextureCoords(circle) {
    var textureCoords = [];
    //var coords = [[0,0],[1,0],[0,1]];
    for (var i = 0; i < circle.vertexes.length; i+=3) {
        textureCoords.push(circle.vertexes[i]);
        textureCoords.push(circle.vertexes[i+1]);
    }
    return textureCoords;
}

function createTexture(image, circle) {
    var texture = {};
    texture.buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, texture.buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(getTextureCoords(circle)), GL.STATIC_DRAW);

    // Create a texture.
    texture.texture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, texture.texture);

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);

    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
    GL.bindTexture(GL.TEXTURE_2D, null);
    return texture;
}

function setTextures(image) {
    for (var i = 0; i < circles.length; i++) {
        circles[i].texture = createTexture(image, circles[i]);
    }
}

function getVertexesColors(numberOfVertexes) {
    var c = [];
    for (var i = 0; i < numberOfVertexes; i += 3) {
        addColor(colorGenerator.generate(), c);
    }
    return c;
}

function getCircleFaces(vertexes) {
    var faces = [0];
    for (var i = 3; i < vertexes.length; i += 3) {
        faces.push(i / 3);
    }
    return faces;
}

function getCircleVertexes(cx, cy, radius, angleStep) {
    var vertexes = [];
    vertexes.push(cx);
    vertexes.push(cy);
    vertexes.push(0);
    for (var i = 0; i <= 360; i += angleStep) {
        vertexes.push(cx + (radius * Math.cos(i / 180 * Math.PI)));
        vertexes.push(cy + (radius * Math.sin(i / 180 * Math.PI)));
        vertexes.push(0);
    }
    return vertexes;
}

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
    canvas = document.getElementById('glCanvas');
    initMouseEvent();
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
    var _MmatrixY = GL.getUniformLocation(program, "MmatrixY");
    var _Vmatrix = GL.getUniformLocation(program, "Vmatrix");
    var _Pmatrix = GL.getUniformLocation(program, "Pmatrix");
    var _position = GL.getAttribLocation(program, 'position');
    var _texCoords = GL.getAttribLocation(program, 'a_tex_coords');
    var _color = GL.getAttribLocation(program, 'color');
    GL.useProgram(program);
    circles = createCircles(1, 90);
    var PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
    var MOVEMATRIX_Y = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -3);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.clearColor(1.0, 0.0, 0.0, 0.0);
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearDepth(1.0);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(_position);
    GL.enableVertexAttribArray(_color);
    GL.enableVertexAttribArray(_texCoords);
    var animate = function () {
        if (!drag) {
            dX *= amortization;
            theta += dX;
        }
        LIBS.set_I4(MOVEMATRIX_Y);
        LIBS.rotateY(MOVEMATRIX_Y, theta);
        for (var i = 0; i < circles.length; ++i) {
            GL.bindBuffer(GL.ARRAY_BUFFER, circles[i].vertex_buffer);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, circles[i].faces_buffer);
            GL.vertexAttribPointer(_position, 3, GL.FLOAT, false, 0, 0);

            GL.bindBuffer(GL.ARRAY_BUFFER, circles[i].colors_buffer);
            GL.vertexAttribPointer(_color, 3, GL.UNSIGNED_BYTE, true, 0, 0);

            GL.bindBuffer(GL.ARRAY_BUFFER, circles[i].texture.buffer);
            GL.vertexAttribPointer(_texCoords, 3, GL.UNSIGNED_BYTE, true, 0, 0);
            GL.activeTexture(circles[i].texture.texture);
            GL.bindTexture(GL.TEXTURE_2D, circles[i].texture.texture);
            GL.uniform1i(GL.getUniformLocation(program, "u_image"), 0);

            GL.uniformMatrix4fv(_MmatrixY, false, MOVEMATRIX_Y);
            GL.drawElements(GL.TRIANGLE_FAN, circles[i].faces.length, GL.UNSIGNED_SHORT, 0);
        }
        GL.flush();
        window.requestAnimationFrame(animate);
    };
    var image = new Image();
    image.src = "http://localhost:63342/webGLAcademy/www/img/smile.png";
    image.onload = function () {
        setTextures(image);
        animate();
    }
    return true;
}

var vertex_shader_src = "\n\
    attribute vec3 position;\n\
    attribute vec2 a_tex_coords;\n\
    varying vec2 tex_coords;\n\
    uniform mat4 Pmatrix;\n\
    uniform mat4 Vmatrix;\n\
    uniform mat4 MmatrixY;\n\
    void main(void) {\
        gl_Position = Pmatrix*Vmatrix*MmatrixY*vec4(position, 1.);\
        tex_coords = a_tex_coords;\
    }";

var fragment_shader_src = "\
    precision mediump float;\n\
    varying vec2 tex_coords;\n\
    uniform sampler2D u_image;\n\
    void main(void) {\
        gl_FragColor = texture2D(u_image, tex_coords);\
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

// mouse events variables
var drag = false;
var old_x, old_y;
var amortization = 0.95;
var dX = 0.0;

var mouseDown = function (e) {
    drag = true;
    old_x = e.pageX;
    e.preventDefault();
    return false;
};

var mouseUp = function (e) {
    drag = false;
};

var mouseMove = function (e) {
    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width;
    theta += dX;
    old_x = e.pageX;
    e.preventDefault();
};

function initMouseEvent() {
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mouseout", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);
}

