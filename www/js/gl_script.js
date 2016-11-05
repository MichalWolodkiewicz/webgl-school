var GL;
var logBox;
var cube;
var canvas;
var theta = 0;
var shader_ptr = {};
var scaleRatio = 1.0;
var SCALE_MATRIX = LIBS.get_I4();
var TRANSLATION_MATRIX = LIBS.get_I4();
var image;

function initShaderVariablesPointer(program) {
    shader_ptr._MmatrixY = GL.getUniformLocation(program, "MmatrixY");
    shader_ptr._Vmatrix = GL.getUniformLocation(program, "Vmatrix");
    shader_ptr._Pmatrix = GL.getUniformLocation(program, "Pmatrix");
    shader_ptr._position = GL.getAttribLocation(program, 'position');
    shader_ptr._texCoords = GL.getAttribLocation(program, 'a_tex_coords');
    shader_ptr._u_image = GL.getUniformLocation(program, "u_image");
    shader_ptr._kernel = GL.getUniformLocation(program, "u_kernel[0]");
    shader_ptr._kernelWeight = GL.getUniformLocation(program, "u_kernelWeight");
    shader_ptr._textureSize = GL.getUniformLocation(program, "u_textureSize");
    shader_ptr._translation = GL.getUniformLocation(program, "u_translation");
    shader_ptr._scale = GL.getUniformLocation(program, "u_scale");
}

function createCube(dimension) {
    var squares = [];
    var partSize = 2 / dimension;
    var offset = 0.1 * partSize;
    partSize -= offset;
    for (var x = -1; x < 1; x += (partSize + offset)) {
        for (var y = 1; y > -1; y -= (partSize + offset)) {
            for (var z = 1; z > -1; z -= (partSize + offset)) {
                console.log(z);
                var squareObject = {};
                squareObject.vertexes = getSquareVertexes(x, y, z, partSize);
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

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
    GL.bindTexture(GL.TEXTURE_2D, null);
    return texture;
}

function setTextures(image) {
    for (var i = 0; i < cube.length; i++) {
        cube[i].texture = createTexture(image, cube[i]);
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

function getSquareVertexes(leftX, topY, frontFaceZ, size) {
    var rightX = leftX + size;
    var bottomY = topY - size;
    var backFaceZ = frontFaceZ - size;
    var vertices = [
        // Front face
        leftX, bottomY, frontFaceZ,
        rightX, bottomY, frontFaceZ,
        rightX, topY, frontFaceZ,
        leftX, topY, frontFaceZ,

        // Back face
        leftX, bottomY, backFaceZ,
        leftX, topY, backFaceZ,
        rightX, topY, backFaceZ,
        rightX, bottomY, backFaceZ,

        // Top face
        leftX, topY, backFaceZ,
        leftX, topY, frontFaceZ,
        rightX, topY, frontFaceZ,
        rightX, topY, backFaceZ,

        // Bottom face
        leftX, bottomY, backFaceZ,
        rightX, bottomY, backFaceZ,
        rightX, bottomY, frontFaceZ,
        leftX, bottomY, frontFaceZ,

        // Right face
        rightX, bottomY, backFaceZ,
        rightX, topY, backFaceZ,
        rightX, topY, frontFaceZ,
        rightX, bottomY, frontFaceZ,

        // Left face
        leftX, bottomY, backFaceZ,
        leftX, bottomY, frontFaceZ,
        leftX, topY, frontFaceZ,
        leftX, topY, backFaceZ
    ];
    return vertices;
}

function initLogger() {
    logBox = document.getElementById('log-box');
}

function initWebGL() {
    initLogger();
    canvas = document.getElementById('glCanvas');
    initMouseEvents();
    initConvultionComboBox();
    try {
        GL = canvas.getContext('webgl', {antialias: true}) || canvas.getContext('web-gl-academy-context', {antialias: true});
    } catch (e) {
        console.error(e);
        return false;
    }
    if (GL === null) {
        console.error('GL context is null');
        return false;
    } else {
        console.log('web gl context initialized properly.');
    }
    GL.clearColor(1.0, 0.0, 0.0, 1.0);  // Clear to red, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);
    var program = glUtils.createProgram(GL, 'shader-vs', 'shader-convultion-fs');
    GL.useProgram(program);
    initShaderVariablesPointer(program);
    cube = createCube(2);
    var PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
    var MOVEMATRIX_Y = LIBS.get_I4();
    var VIEWMATRIX = LIBS.get_I4();
    var TRANSLATION_MATRIX = LIBS.get_I4();
    LIBS.translateZ(VIEWMATRIX, -4);
    GL.uniformMatrix4fv(shader_ptr._Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(shader_ptr._Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(shader_ptr._scale, false, SCALE_MATRIX);
    GL.uniformMatrix4fv(shader_ptr._translation, false, TRANSLATION_MATRIX);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(shader_ptr._position);
    GL.enableVertexAttribArray(shader_ptr._texCoords);
    changeConvultionKernel('normal');
    var animate = function () {
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        if (!drag) {
            dX *= amortization;
            theta += dX;
        }
        LIBS.set_I4(MOVEMATRIX_Y);
        LIBS.rotateY(MOVEMATRIX_Y, theta);
        for (var i = 0; i < cube.length; ++i) {
            GL.bindBuffer(GL.ARRAY_BUFFER, cube[i].vertex_buffer);
            GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 0, 0);

            GL.bindBuffer(GL.ARRAY_BUFFER, cube[i].texture.buffer);
            GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 0, 0);

            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, cube[i].texture.texture);
            GL.uniform1i(shader_ptr._u_image, 0);

            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cube[i].faces_buffer);
            GL.uniformMatrix4fv(shader_ptr._MmatrixY, false, MOVEMATRIX_Y);
            GL.uniform2f(shader_ptr._textureSize, cube[i].size, cube[i].size);
            GL.drawElements(GL.TRIANGLES, cube[i].faces.length, GL.UNSIGNED_SHORT, 0);
        }
        GL.flush();
        window.requestAnimationFrame(animate);
    };
    image = new Image();
    image.src = "img/dev.png";
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

var kernels = {
    normal: [
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
    ],
    gaussianBlur: [
        0.045, 0.122, 0.045,
        0.122, 0.332, 0.122,
        0.045, 0.122, 0.045
    ],
    gaussianBlur2: [
        1, 2, 1,
        2, 4, 2,
        1, 2, 1
    ],
    gaussianBlur3: [
        0, 1, 0,
        1, 1, 1,
        0, 1, 0
    ],
    unsharpen: [
        -1, -1, -1,
        -1, 9, -1,
        -1, -1, -1
    ],
    sharpness: [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ],
    sharpen: [
        -1, -1, -1,
        -1, 16, -1,
        -1, -1, -1
    ],
    edgeDetect: [
        -0.125, -0.125, -0.125,
        -0.125, 1, -0.125,
        -0.125, -0.125, -0.125
    ],
    edgeDetect2: [
        -1, -1, -1,
        -1, 8, -1,
        -1, -1, -1
    ],
    edgeDetect3: [
        -5, 0, 0,
        0, 0, 0,
        0, 0, 5
    ],
    edgeDetect4: [
        -1, -1, -1,
        0, 0, 0,
        1, 1, 1
    ],
    edgeDetect5: [
        -1, -1, -1,
        2, 2, 2,
        -1, -1, -1
    ],
    edgeDetect6: [
        -5, -5, -5,
        -5, 39, -5,
        -5, -5, -5
    ],
    sobelHorizontal: [
        1, 2, 1,
        0, 0, 0,
        -1, -2, -1
    ],
    sobelVertical: [
        1, 0, -1,
        2, 0, -2,
        1, 0, -1
    ],
    previtHorizontal: [
        1, 1, 1,
        0, 0, 0,
        -1, -1, -1
    ],
    previtVertical: [
        1, 0, -1,
        1, 0, -1,
        1, 0, -1
    ],
    boxBlur: [
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111
    ],
    triangleBlur: [
        0.0625, 0.125, 0.0625,
        0.125, 0.25, 0.125,
        0.0625, 0.125, 0.0625
    ],
    emboss: [
        -2, -1, 0,
        -1, 1, 1,
        0, 1, 2
    ]
};

function changeConvultionKernel(value) {
    GL.uniform1fv(shader_ptr._kernel, kernels[value]);
    GL.uniform1f(shader_ptr._kernelWeight, glUtils.computeKernelWeight(kernels[value]));
}
function initConvultionComboBox() {
    var ui = document.getElementById("kernelFilter");
    var select = document.createElement("select")
    for (var name in kernels) {
        var option = document.createElement("option");
        option.value = name;
        if (name == 'normal') {
            option.selected = true;
        }
        option.appendChild(document.createTextNode(name));
        select.appendChild(option);
    }
    select.onchange = function (event) {
        changeConvultionKernel(this.options[this.selectedIndex].value);
    };
    ui.appendChild(select);
}

function onTranslationInputChange(coordinate) {
    var value = parseInt(document.getElementById('translation_' + coordinate).value)/100.0;
    if (coordinate == 'x') {
        LIBS.translateX(TRANSLATION_MATRIX, value);
    } else if (coordinate == 'y') {
        LIBS.translateY(TRANSLATION_MATRIX, value);
    } else if (coordinate == 'z') {
        LIBS.translateZ(TRANSLATION_MATRIX, value);
    }
    GL.uniformMatrix4fv(shader_ptr._translation, false, TRANSLATION_MATRIX);
}

function onScaleInputChange() {
    var value = parseInt(document.getElementById('scaleInput').value);
    scaleRatio = value / 100.0;
    LIBS.setScaleToMatrix(SCALE_MATRIX, scaleRatio);
    GL.uniformMatrix4fv(shader_ptr._scale, false, SCALE_MATRIX);
}

function onSquaresNumberInputChange() {
    var numberOfSquares = parseInt(document.getElementById('cubeDimension').value);
    cube = createCube(numberOfSquares);
    setTextures(image);
    document.getElementById('cubeDimensionLabel').innerHTML = numberOfSquares;
}