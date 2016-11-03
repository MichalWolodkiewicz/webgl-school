var glUtils = {
    getShaderNameByType: function (GL, type) {
        return type == GL.VERTEX_SHADER ? 'vertex' : 'fragment';
    },

    createProgram: function (GL, v_shader_name, f_shader_name) {
        var vertexShader = this.createShader(GL, v_shader_name, GL.VERTEX_SHADER);
        var fragmentShader = this.createShader(GL, f_shader_name, GL.FRAGMENT_SHADER);
        var program = GL.createProgram();
        GL.attachShader(program, vertexShader);
        GL.attachShader(program, fragmentShader);
        GL.linkProgram(program);
        return program;
    },

    createShader: function (GL, sourceId, type) {
        var shaderScript = document.getElementById(sourceId);
        var theSource = "";
        var currentChild = shaderScript.firstChild;
        while (currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        var shader = GL.createShader(type);
        GL.shaderSource(shader, theSource);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            logError('ERROR IN ' + this.getShaderNameByType(GL, type) + ' ' + GL.getShaderInfoLog(shader));
            return false;
        }
        logNormal(this.getShaderNameByType(GL, type) + 'compiled');
        return shader;
    }
};