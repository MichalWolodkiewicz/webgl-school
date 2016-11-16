var GL;
var logBox;
var canvas;
var shader_ptr = {};
var scaleRatio = 0.27;
var image;
var program;

var perspective = {
    angle: 60,
    aspect: 1,
    zMin: 0.1,
    zMax: 100
};

var translation = {
    x: 0,
    y: -1.01,
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
        z: 4.4
    },
    rotation: {
        x: 0,
        y: 0,
        z: 0
    }
};

var lighting = {
    _sourceAmbientColor: [1.0, 1.0, 1.0],
    _sourceDiffuseColor: [1.0, 2.0, 4.0],
    _sourceSpecularColor: [1.0, 1.0, 1.0],
    _sourceDirection: [0.0, 0.0, -1.0],
    _matAmbientColor: [0.3, 0.3, 0.3],
    _matDiffuseColor: [1.0, 1.0, 1.0],
    _matSpecularColor: [1.0, 1.0, 1.0],
    _lightWorldPosition: [0.0, 0.0, 0.0],
    _matShininess: 10.0
};

var CAMERA_MATRIX = LIBS.get_I4();

function setAllLightingUniforms() {
    refreshVector3LightingUniform("_sourceAmbientColor");
    refreshVector3LightingUniform("_sourceDiffuseColor");
    refreshVector3LightingUniform("_sourceSpecularColor");
    refreshVector3LightingUniform("_sourceDirection");
    refreshVector3LightingUniform("_matAmbientColor");
    refreshVector3LightingUniform("_matDiffuseColor");
    refreshVector3LightingUniform("_matSpecularColor");
    refreshNumberLightingUniform("_matShininess");
    refreshNumberLightingUniform("_lightWorldPosition");
}

function initShaderVariablesPointer(program) {
    shader_ptr._u_matrix = GL.getUniformLocation(program, "u_matrix");
    shader_ptr._u_world = GL.getUniformLocation(program, "u_world");
    shader_ptr._u_worldInverse = GL.getUniformLocation(program, "u_worldInverse");
    shader_ptr._position = GL.getAttribLocation(program, 'position');
    shader_ptr._normal = GL.getAttribLocation(program, 'a_normal');
    shader_ptr._texCoords = GL.getAttribLocation(program, 'a_tex_coords');
    shader_ptr._u_image = GL.getUniformLocation(program, "u_image");
    shader_ptr._kernel = GL.getUniformLocation(program, "u_kernel[0]");
    shader_ptr._kernelWeight = GL.getUniformLocation(program, "u_kernelWeight");
    shader_ptr._textureSize = GL.getUniformLocation(program, "u_textureSize");
    shader_ptr._sourceAmbientColor = GL.getUniformLocation(program, "u_source_ambient_color");
    shader_ptr._sourceDiffuseColor = GL.getUniformLocation(program, "u_source_diffuse_color");
    shader_ptr._sourceSpecularColor = GL.getUniformLocation(program, "u_source_specular_color");
    shader_ptr._sourceDirection = GL.getUniformLocation(program, "u_source_direction");
    shader_ptr._matAmbientColor = GL.getUniformLocation(program, "u_mat_ambient_color");
    shader_ptr._matDiffuseColor = GL.getUniformLocation(program, "u_mat_diffuse_color");
    shader_ptr._matSpecularColor = GL.getUniformLocation(program, "u_mat_specular_color");
    shader_ptr._matShininess = GL.getUniformLocation(program, "u_mat_shininess");
    shader_ptr._lightWorldPosition = GL.getUniformLocation(program, "u_lightWorldPosition");
}

function initLogger() {
    logBox = document.getElementById('log-box');
}

function initWebGL() {
    initPropertiesUI();
    initLogger();
    canvas = document.getElementById('glCanvas');
    perspective.aspect = canvas.width / canvas.height;
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
    program = glUtils.createProgram(GL, 'shader-lighting-point-vs', 'shader-lighting-point-fs');
    GL.useProgram(program);
    initShaderVariablesPointer(program);
    setAllLightingUniforms();
    DRAGON.init(GL);
    GL.viewport(0.0, 0.0, canvas.width, canvas.height);
    GL.enableVertexAttribArray(shader_ptr._position);
    GL.enableVertexAttribArray(shader_ptr._texCoords);
    GL.enableVertexAttribArray(shader_ptr._normal);
    var now = null;
    var animate = function () {
        now = new Date().getTime();
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, DRAGON.texture);
        var worldMatrix = getWorldMatrix();
        var worldInverseMatrix = LIBS.inverse(worldMatrix);
        var projectionMatrix = getProjectionMatrix(worldMatrix);
        GL.uniformMatrix4fv(shader_ptr._u_matrix, false, projectionMatrix);
        GL.uniformMatrix4fv(shader_ptr._u_world, false, worldMatrix);
        GL.uniformMatrix4fv(shader_ptr._u_worldInverse, false, worldInverseMatrix);
        GL.bindBuffer(GL.ARRAY_BUFFER, DRAGON.vertexBuffer);
        GL.vertexAttribPointer(shader_ptr._position, 3, GL.FLOAT, false, 32, 0);
        GL.vertexAttribPointer(shader_ptr._texCoords, 2, GL.FLOAT, false, 32, 24);
        GL.vertexAttribPointer(shader_ptr._normal, 3, GL.FLOAT, false, 32, 12);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, DRAGON.indicesBuffer);
        GL.drawElements(GL.TRIANGLES, DRAGON_DATA.indices.length, GL.UNSIGNED_INT, 0);
        GL.flush();
        console.log(GL.getUniform(program, shader_ptr._lightWorldPosition));
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

function getWorldMatrix() {
    var worldMatrix = LIBS.translate(LIBS.get_I4(), translation.x, translation.y, translation.z);
    worldMatrix = LIBS.xRotate(worldMatrix, rotation.x);
    worldMatrix = LIBS.yRotate(worldMatrix, rotation.y);
    worldMatrix = LIBS.zRotate(worldMatrix, rotation.z);
    return LIBS.scale(worldMatrix, scaleRatio, scaleRatio, scaleRatio);
}
function getProjectionMatrix(worldMatrix) {
    var matrix = LIBS.m4Perspective(LIBS.degToRad(perspective.angle), perspective.aspect, perspective.zMin, perspective.zMax);
    matrix = LIBS.multiply(matrix, getViewMatrix());
    return LIBS.multiply(matrix, worldMatrix);
}

function getViewMatrix() {
    LIBS.set_I4(CAMERA_MATRIX);
    CAMERA_MATRIX = LIBS.xRotate(CAMERA_MATRIX, camera.rotation.x);
    CAMERA_MATRIX = LIBS.yRotate(CAMERA_MATRIX, camera.rotation.y);
    CAMERA_MATRIX = LIBS.zRotate(CAMERA_MATRIX, camera.rotation.z);
    CAMERA_MATRIX = LIBS.translate(CAMERA_MATRIX, camera.translation.x, camera.translation.y, camera.translation.z);
    return LIBS.inverse(CAMERA_MATRIX);
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

function onVectorLightingVectorPropertyChange(coordinateIndex, propertyPrefix) {
    lighting[propertyPrefix][coordinateIndex] = parseFloat(document.getElementById(propertyPrefix + '_' + coordinateIndex).value)
    refreshVector3LightingUniform(propertyPrefix);
}

function onNumberLightingVectorPropertyChange(propertyPrefix) {
    lighting[propertyPrefix] = parseFloat(document.getElementById(propertyPrefix).value)
    refreshNumberLightingUniform(propertyPrefix);
}

function refreshVector3LightingUniform(uniformName) {
    GL.uniform3fv(shader_ptr[uniformName], lighting[uniformName]);
}

function refreshNumberLightingUniform(uniformName) {
    GL.uniform1f(shader_ptr[uniformName], lighting[uniformName]);
}

function initPropertiesUI() {
    $('.properties-title').each(function (order, obj) {
        $(this).siblings().first().toggle();
    });
    $('.properties-title').each(function (order, obj) {
        $(this).on('click', function () {
            $(this).siblings().first().toggle('1000');
        });
    });
    initLightingUI();
}

function initLightingUI() {
    addLightingVectorPropertyUI('source ambient color', '_sourceAmbientColor');
    addLightingVectorPropertyUI('source diffuse color', '_sourceDiffuseColor');
    addLightingVectorPropertyUI('source specular color', '_sourceSpecularColor');
    addLightingVectorPropertyUI('source direction', '_sourceDirection');
    addLightingVectorPropertyUI('material ambient color', '_matAmbientColor');
    addLightingVectorPropertyUI('material diffuse color', '_matDiffuseColor');
    addLightingVectorPropertyUI('material specular color', '_matSpecularColor');
    addLightingVectorPropertyUI('light point position', '_lightWorldPosition');
    addLightingNumberPropertyUI('material shininess', '_matShininess');
}

function addLightingVectorPropertyUI(label, propertyName) {
    var html = label + '<br/>';
    html += '<input type="number" id="' + propertyName + '_0" onchange="onVectorLightingVectorPropertyChange(0,&quot;' + propertyName + '&quot;)" value="' + lighting[propertyName][0] + '" step="0.1"/>';
    html += '<input type="number" id="' + propertyName + '_1" onchange="onVectorLightingVectorPropertyChange(1,&quot;' + propertyName + '&quot;)" value="' + lighting[propertyName][1] + '" step="0.1"/>';
    html += '<input type="number" id="' + propertyName + '_2"' +
        ' onchange="onVectorLightingVectorPropertyChange(2,&quot;' + propertyName + '&quot;)" value="' + lighting[propertyName][2] + '" step="0.1"/><br/>';
    $('#lighting-box-properties').append(html);
}

function addLightingNumberPropertyUI(label, propertyName) {
    var html = label + '<br/>';
    html += '<input type="number" id="' + propertyName + '" onchange="onNumberLightingVectorPropertyChange(&quot;' + propertyName + '&quot;)" value="' + lighting[propertyName] + '" step="0.1"/>';
    $('#lighting-box-properties').append(html);
}