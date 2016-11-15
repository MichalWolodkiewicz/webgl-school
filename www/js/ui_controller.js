var GL;
var logBox;
var canvas;
var shader_ptr = {};
var scaleRatio = 1.0;
var image;

var perspective = {
    angle: 60,
    aspect: 1,
    zMin: 0.1,
    zMax: 100
};

var translation = {
    x: 0,
    y: 0,
    z: 0
};

var rotation = {
    x: 0,
    y: 0,
    z: 0
};

var camera = {
    translation: {
        x: 0,
        y: 0,
        z: 2
    },
    rotation: {
        x: 0,
        y: 0,
        z: 0
    }
};

var CAMERA_MATRIX = LIBS.get_I4();

function initShaderVariablesPointer(program) {
    shader_ptr._u_matrix = GL.getUniformLocation(program, "u_matrix");
    shader_ptr._position = GL.getAttribLocation(program, 'position');
    shader_ptr._normal = GL.getAttribLocation(program, 'a_normal');
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
        var EXT = GL.getExtension("OES_element_index_uint") ||
            GL.getExtension("MOZ_OES_element_index_uint") ||
            GL.getExtension("WEBKIT_OES_element_index_uint");
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
    GL.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to red, fully opaque
    GL.clearDepth(1.0);                 // Clear everything
    GL.enable(GL.DEPTH_TEST);           // Enable depth testing
    GL.depthFunc(GL.LEQUAL);
    GL.enable(GL.CULL_FACE);
    var program = glUtils.createProgram(GL, 'shader-vs', 'shader-lighting-fs');
    GL.useProgram(program);
    initShaderVariablesPointer(program);
    DRAGON.init(GL);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(shader_ptr._position);
    GL.enableVertexAttribArray(shader_ptr._texCoords);
    GL.enableVertexAttribArray(shader_ptr._normal);
    changeConvultionKernel('normal');
    var now = null;
    var animate = function () {
        now = new Date().getTime();
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, DRAGON.texture);
        GL.uniformMatrix4fv(shader_ptr._u_matrix, false, getModelMatrix());
        GL.bindBuffer(GL.ARRAY_BUFFER, DRAGON.vertexBuffer);
        GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 32, 0);
        GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 32, 24);
        GL.vertexAttribPointer(shader_ptr._normal, 3, GL.FLOAT, false, 32, 12);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, DRAGON.indicesBuffer);
        GL.drawElements(GL.TRIANGLES, DRAGON_DATA.indices.length, GL.UNSIGNED_INT, 0);
        GL.flush();
        setTimeout(function () {
            window.requestAnimationFrame(animate);
        }, 1000 / 20);
    };
    image = new Image();
    image.src = "img/dragon_texture.png";
    image.onload = function () {
        DRAGON.setTexture(GL, image);
        animate();
    }
    return true;
}

function getModelMatrix() {
    var matrix = LIBS.m4Perspective(LIBS.degToRad(perspective.angle), perspective.aspect, perspective.zMin, perspective.zMax);
    matrix = LIBS.multiply(matrix, getCameraMatrix());
    matrix = LIBS.translate(matrix, translation.x, translation.y, translation.z);
    matrix = LIBS.xRotate(matrix, rotation.x);
    matrix = LIBS.yRotate(matrix, rotation.y);
    matrix = LIBS.zRotate(matrix, rotation.z);
    matrix = LIBS.scale(matrix, scaleRatio, scaleRatio, scaleRatio);
    return matrix;
}

function getCameraMatrix() {
    LIBS.set_I4(CAMERA_MATRIX);
    CAMERA_MATRIX = LIBS.xRotate(CAMERA_MATRIX, camera.rotation.x);
    CAMERA_MATRIX = LIBS.yRotate(CAMERA_MATRIX, camera.rotation.y);
    CAMERA_MATRIX = LIBS.zRotate(CAMERA_MATRIX, camera.rotation.z);
    CAMERA_MATRIX = LIBS.translate(CAMERA_MATRIX, camera.translation.x, camera.translation.y, camera.translation.z);
    return LIBS.inverse(CAMERA_MATRIX);
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
    var value = parseInt(document.getElementById('cameraRotation_' + coordinate).value);
    if (coordinate == 'x') {
        camera.rotation.x = LIBS.degToRad(value);
    } else if (coordinate == 'y') {
        camera.rotation.y = LIBS.degToRad(value);
    } else if (coordinate == 'z') {
        camera.rotation.z = LIBS.degToRad(value);
    }
    document.getElementById('cameraRotationLabel_' + coordinate).innerHTML = value;
}

function onCameraTranslationChange(coordinate) {
    var value = parseInt(document.getElementById('cameraTranslation_' + coordinate).value) / 10.0;
    if (coordinate == 'x') {
        camera.translation.x = value;
    } else if (coordinate == 'y') {
        camera.translation.y = value;
    } else if (coordinate == 'z') {
        camera.translation.z = value;
    }
    document.getElementById('cameraTranslationLabel_' + coordinate).innerHTML = value;
}

function onPerspectiveZMinChange() {
    perspective.zMin = parseInt(document.getElementById('perspectiveZMin').value) / 10.0;
    document.getElementById('perspectiveZMinValueLabel').innerHTML = perspective.zMin;
}

function onPerspectiveZMaxChange() {
    perspective.zMax = parseInt(document.getElementById('perspectiveZMax').value);
    document.getElementById('perspectiveZMaxValueLabel').innerHTML = perspective.zMax;
}