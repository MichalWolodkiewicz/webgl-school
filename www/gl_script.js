var GL;
var logBox;
var squares;
var canvas;
var theta = 0;
var shader_ptr = {};

function initShaderVariablesPointer(program) {
    shader_ptr._MmatrixY = GL.getUniformLocation(program, "MmatrixY");
    shader_ptr._Vmatrix = GL.getUniformLocation(program, "Vmatrix");
    shader_ptr._Pmatrix = GL.getUniformLocation(program, "Pmatrix");
    shader_ptr._position = GL.getAttribLocation(program, 'position');
    shader_ptr._texCoords = GL.getAttribLocation(program, 'a_tex_coords');
    shader_ptr._u_image = GL.getUniformLocation(program, "u_image");
}

function createSquares(dimension) {
    var squares = [];
    var partSize = 2 / dimension;
    var offset = 0.1 * partSize;
    partSize -= offset;
    for (var i = -1 + partSize / 2; i < 1; i += (partSize+offset)) {
        for (var j = 1 - partSize / 2; j > -1; j -= (partSize+offset)) {
            var squareObject = {};
            squareObject.vertexes = getSquareVertexes(i, j, partSize);
            squareObject.faces = getSquareFaces();
            squareObject.vertex_buffer = GL.createBuffer();
            squareObject.faces_buffer = GL.createBuffer();
            squareObject.size = partSize;
            GL.bindBuffer(GL.ARRAY_BUFFER, squareObject.vertex_buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(squareObject.vertexes), GL.STATIC_DRAW);
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, squareObject.faces_buffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareObject.faces), GL.STATIC_DRAW);
            squares.push(squareObject);
        }
    }
    return squares;
}

function getTextureCoords() {
    var textureCoordinates = [
        // Front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];
    return textureCoordinates;
}

function createTexture(image) {
    var texture = {};
    texture.buffer = GL.createBuffer();
    GL.bindBuffer(GL.ARRAY_BUFFER, texture.buffer);
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(getTextureCoords()), GL.STATIC_DRAW);
    texture.texture = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, texture.texture);
    GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.bindTexture(GL.TEXTURE_2D, null);
    return texture;
}

function setTextures(image) {
    for (var i = 0; i < squares.length; i++) {
        squares[i].texture = createTexture(image, squares[i]);
    }
}

function getSquareFaces() {
    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23    // left
    ];
    return cubeVertexIndices;
}

function getSquareVertexes(leftX, topY,size) {
    var rightX = leftX + size;
    var bottomY = topY - size;
    var vertices = [
        // Front face
        leftX, bottomY, size/2,
        rightX, bottomY, size/2,
        rightX, topY, size/2,
        leftX, topY, size/2,

        // Back face
        leftX, bottomY, -size/2,
        leftX, topY, -size/2,
        rightX, topY, -size/2,
        rightX, bottomY, -size/2,

        // Top face
        leftX, topY, -size/2,
        leftX, topY, size/2,
        rightX, topY, size/2,
        rightX, topY, -size/2,

        // Bottom face
        leftX, bottomY, -size/2,
        rightX, bottomY, -size/2,
        rightX, bottomY, size/2,
        leftX, bottomY, size/2,

        // Right face
        rightX, bottomY, -size/2,
        rightX, topY, -size/2,
        rightX, topY, size/2,
        rightX, bottomY, size/2,

        // Left face
        leftX, bottomY, -size/2,
        leftX, bottomY, size/2,
        leftX, topY, size/2,
        leftX, topY, -size/2
    ];
    return vertices;
}

function logError(message) {
    var logRow = '<p style="color: #ef1214;">' + message + '</p>';
    logBox.innerHTML = logBox.innerHTML + logRow;
}

function logNormal(message) {
    var logRow = '<p>' + message + '</p>';
    logBox.innerHTML = logBox.innerHTML + logRow;
}

function initLogger() {
    logBox = document.getElementById('log-box');
}

function initWebGL() {
    initLogger();
    canvas = document.getElementById('glCanvas');
    initMouseEvents();
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
    GL.clearColor(1.0, 0.0, 0.0, 1.0);  // Clear to red, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);
    var program = glUtils.createProgram(GL, 'shader-vs', 'shader-fs');
    GL.useProgram(program);
    initShaderVariablesPointer(program);
    squares = createSquares(4);
    var PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
    var MOVEMATRIX_Y = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -3);
    GL.uniformMatrix4fv(shader_ptr._Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(shader_ptr._Vmatrix, false, VIEWMATRIX);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(shader_ptr._position);
    GL.enableVertexAttribArray(shader_ptr._texCoords);
    var animate = function () {
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        if (!drag) {
            dX *= amortization;
            theta += dX;
        }
        LIBS.set_I4(MOVEMATRIX_Y);
        LIBS.rotateY(MOVEMATRIX_Y, theta);
        for (var i = 0; i < squares.length; ++i) {
            GL.bindBuffer(GL.ARRAY_BUFFER, squares[i].vertex_buffer);
            GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 0, 0);

            GL.bindBuffer(GL.ARRAY_BUFFER, squares[i].texture.buffer);
            GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 0, 0);

            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, squares[i].texture.texture);
            GL.uniform1i(shader_ptr._u_image, 0);

            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, squares[i].faces_buffer);
            GL.uniformMatrix4fv(shader_ptr._MmatrixY, false, MOVEMATRIX_Y);
            GL.drawElements(GL.TRIANGLES, squares[i].faces.length, GL.UNSIGNED_SHORT, 0);
        }
        GL.flush();
        window.requestAnimationFrame(animate);
    };
    var image = new Image();
    image.src = "img/smile.jpg";
    image.onload = function () {
        setTextures(image);
        animate();
    }
    return true;
}

// mouse events variables
var drag = false;
var old_x;
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

function initMouseEvents() {
    canvas.addEventListener("mousedown", mouseDown, false);
    canvas.addEventListener("mouseup", mouseUp, false);
    canvas.addEventListener("mouseout", mouseUp, false);
    canvas.addEventListener("mousemove", mouseMove, false);
}

