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

    createShader: function (GL, elementId, type) {
        var theSource = this.readShaderFromHTML(elementId);
        var shader = GL.createShader(type);
        GL.shaderSource(shader, theSource);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            console.error('ERROR IN ' + this.getShaderNameByType(GL, type) + ' ' + GL.getShaderInfoLog(shader));
            return false;
        }
        console.log(elementId + ' compiled');
        return shader;
    },

    readShaderFromHTML: function (elementId) {
        var shaderScript = document.getElementById(elementId);
        var theSource = "";
        var currentChild = shaderScript.firstChild;
        while (currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        return theSource;
    },

    computeKernelWeight: function (kernel) {
        var weight = kernel.reduce(function (prev, curr) {
            return prev + curr;
        });
        return weight <= 0 ? 1 : weight;
    }
};