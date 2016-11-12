var GL;
var logBox;
var canvas;
var shader_ptr = {};
var scaleRatio = 1.0;
var image;

var perspective = {
    angle: 60,
    aspect : 1,
    zMin: 0.1,
    zMax: 2000
};

var translation = {
    x:0,
    y:0,
    z:0
};

var rotation = {
    x:0,
    y:0,
    z:0
};

function initShaderVariablesPointer(program) {
    shader_ptr._u_matrix = GL.getUniformLocation(program, "u_matrix");
    shader_ptr._position = GL.getAttribLocation(program, 'position');
    shader_ptr._texCoords = GL.getAttribLocation(program, 'a_tex_coords');
    shader_ptr._u_image = GL.getUniformLocation(program, "u_image");
    shader_ptr._kernel = GL.getUniformLocation(program, "u_kernel[0]");
    shader_ptr._kernelWeight = GL.getUniformLocation(program, "u_kernelWeight");
    shader_ptr._textureSize = GL.getUniformLocation(program, "u_textureSize");
}

function initLogger() {
    logBox = document.getElementById('log-box');
}

function initWebGL() {
    initLogger();
    canvas = document.getElementById('glCanvas');
    perspective.aspect = canvas.width / canvas.height;
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
    GL.enable(GL.CULL_FACE);
    var program = glUtils.createProgram(GL, 'shader-vs', 'shader-convultion-fs');
    GL.useProgram(program);
    initShaderVariablesPointer(program);
    CUBE.createCube(GL, 2);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(shader_ptr._position);
    GL.enableVertexAttribArray(shader_ptr._texCoords);
    changeConvultionKernel('normal');
    var lastUpdate = 0;
    var updateTime = 1000 / 25;
    var now = null;
    var animate = function () {
        now = new Date().getTime();
        if (now - lastUpdate > updateTime) {
            lastUpdate = now;
            GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            var matrix = getCubeMatrix();
            for (var i = 0; i < CUBE.cubes.length; ++i) {
                drawSmallCube(CUBE.cubes[i], matrix);
            }
            GL.flush();
        }
        window.requestAnimationFrame(animate);
    };
    image = new Image();
    image.src = "img/dev.png";
    image.onload = function () {
        CUBE.setTextures(GL, image);
        animate();
    }
    return true;
}

function drawSmallCube(cube, cubeMatrix) {
    GL.bindBuffer(GL.ARRAY_BUFFER, cube.vertex_buffer);
    GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 0, 0);

    GL.bindBuffer(GL.ARRAY_BUFFER, cube.texture.buffer);
    GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 0, 0);

    GL.activeTexture(GL.TEXTURE0);
    GL.bindTexture(GL.TEXTURE_2D, cube.texture.texture);
    GL.uniform1i(shader_ptr._u_image, 0);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, cube.faces_buffer);
    GL.uniformMatrix4fv(shader_ptr._u_matrix, false, cubeMatrix);
    GL.uniform2f(shader_ptr._textureSize, cube.size, cube.size);
    GL.drawElements(GL.TRIANGLES, cube.faces.length, GL.UNSIGNED_SHORT, 0);
}

function getCubeMatrix() {
    var matrix = LIBS.m4Perspective(LIBS.degToRad(perspective.angle), perspective.aspect, perspective.zMin, perspective.zMax);
    matrix = LIBS.translate(matrix, translation.x, translation.y, translation.z);
    matrix = LIBS.xRotate(matrix, rotation.x);
    matrix = LIBS.yRotate(matrix, rotation.y);
    matrix = LIBS.zRotate(matrix, rotation.z);
    matrix = LIBS.scale(matrix, scaleRatio, scaleRatio, scaleRatio);
    return matrix;
}

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
    var value = parseInt(document.getElementById('translation_' + coordinate).value) / 100.0;
    translation[coordinate] = value;
}

function onScaleInputChange() {
    var value = parseInt(document.getElementById('scaleInput').value);
    scaleRatio = value / 100.0;
}

function onSquaresNumberInputChange() {
    var numberOfCubes = parseInt(document.getElementById('cubeDimension').value);
    CUBE.createCube(GL, numberOfCubes);
    CUBE.setTextures(GL, image);
    document.getElementById('cubeDimensionLabel').innerHTML = numberOfCubes;
}

function onRotationInputChange(coordinate) {
    var value = parseInt(document.getElementById('rotation_' + coordinate).value);
    rotation[coordinate] = LIBS.degToRad(value);
}

function onProjectionAngleChange() {
    var value = parseInt(document.getElementById('projectionAngle').value);
    perspective.angle = value;
    document.getElementById('projectionAngleValueLabel').innerHTML = value;
}

function onCameraAngleChange(coordinate) {
    var value = parseInt(document.getElementById('cameraRotation_'+coordinate).value);
    if (coordinate == 'x') {
        LIBS.rotateX(VIEWMATRIX, LIBS.degToRad(value));
    } else if (coordinate == 'y') {
        LIBS.rotateY(VIEWMATRIX, LIBS.degToRad(value));
    } else if (coordinate == 'z') {
        LIBS.rotateZ(VIEWMATRIX, LIBS.degToRad(value));
    }
    GL.uniformMatrix4fv(shader_ptr._Vmatrix, false, VIEWMATRIX);
    document.getElementById('cameraRotationLabel_'+coordinate).innerHTML = value;
}

function onPerspectiveZMinChange() {
    perspective.zMin = parseInt(document.getElementById('perspectiveZMin').value)/10.0;
    document.getElementById('perspectiveZMinValueLabel').innerHTML = perspective.zMin;
}

function onPerspectiveZMaxChange() {
    perspective.zMax = parseInt(document.getElementById('perspectiveZMax').value);
    document.getElementById('perspectiveZMaxValueLabel').innerHTML = perspective.zMax;
}