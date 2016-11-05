var GL;
var logBox;
var canvas;
var theta = 0;
var shader_ptr = {};
var scaleRatio = 1.0;
var SCALE_MATRIX = LIBS.get_I4();
var TRANSLATION_MATRIX = LIBS.get_I4();
var image;
var ROTATION_X = LIBS.get_I4();
var ROTATION_Y = LIBS.get_I4();
var ROTATION_Z = LIBS.get_I4();

function initShaderVariablesPointer(program) {
    shader_ptr._MmatrixX = GL.getUniformLocation(program, "MmatrixX");
    shader_ptr._MmatrixY = GL.getUniformLocation(program, "MmatrixY");
    shader_ptr._MmatrixZ = GL.getUniformLocation(program, "MmatrixZ");
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
    CUBE.createCube(GL, 2);
    var PROJMATRIX = LIBS.get_projection(40, canvas.width / canvas.height, 1, 100);
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
        for (var i = 0; i < CUBE.cubes.length; ++i) {
            GL.bindBuffer(GL.ARRAY_BUFFER, CUBE.cubes[i].vertex_buffer);
            GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 0, 0);

            GL.bindBuffer(GL.ARRAY_BUFFER, CUBE.cubes[i].texture.buffer);
            GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 0, 0);

            GL.activeTexture(GL.TEXTURE0);
            GL.bindTexture(GL.TEXTURE_2D, CUBE.cubes[i].texture.texture);
            GL.uniform1i(shader_ptr._u_image, 0);

            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE.cubes[i].faces_buffer);
            GL.uniformMatrix4fv(shader_ptr._MmatrixX, false, ROTATION_X);
            GL.uniformMatrix4fv(shader_ptr._MmatrixY, false, ROTATION_Y);
            GL.uniformMatrix4fv(shader_ptr._MmatrixZ, false, ROTATION_Z);
            GL.uniform2f(shader_ptr._textureSize, CUBE.cubes[i].size, CUBE.cubes[i].size);
            GL.drawElements(GL.TRIANGLES, CUBE.cubes[i].faces.length, GL.UNSIGNED_SHORT, 0);
        }
        GL.flush();
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
    CUBE.createCube(numberOfSquares);
    CUBE.setTextures(image);
    document.getElementById('cubeDimensionLabel').innerHTML = numberOfSquares;
}

function onRotationInputChange(coordinate) {
    var value = parseInt(document.getElementById('rotation_' + coordinate).value);
    if (coordinate == 'x') {
        LIBS.rotateX(ROTATION_X, LIBS.degToRad(value));
    } else if (coordinate == 'y') {
        LIBS.rotateY(ROTATION_Y, LIBS.degToRad(value));
    } else if (coordinate == 'z') {
        LIBS.rotateZ(ROTATION_Z, LIBS.degToRad(value));
    }
}