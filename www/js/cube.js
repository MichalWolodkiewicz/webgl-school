var CUBE = {
    cubes: [],
    getSquareFaces: function () {
        var cubeVertexIndices = [
            0, 1, 2, 0, 2, 3,    // front
            4, 5, 6, 4, 6, 7,    // back
            8, 9, 10, 8, 10, 11,   // top
            12, 13, 14, 12, 14, 15,   // bottom
            16, 17, 18, 16, 18, 19,   // right
            20, 21, 22, 20, 22, 23    // left
        ];
        return cubeVertexIndices;
    },

    getSquareVertexes: function (leftX, topY, frontFaceZ, size) {
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
            rightX, bottomY, backFaceZ,
            leftX, bottomY, backFaceZ,
            leftX, topY, backFaceZ,
            rightX, topY, backFaceZ,

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
            rightX, bottomY, frontFaceZ,
            rightX, topY, frontFaceZ,
            rightX, topY, backFaceZ,

            // Left face
            leftX, bottomY, backFaceZ,
            leftX, bottomY, frontFaceZ,
            leftX, topY, frontFaceZ,
            leftX, topY, backFaceZ
        ];
        return vertices;
    },
    createCube: function (GL, dimension) {
        this.releaseCubes(GL);
        var partSize = 2.0 / dimension;
        var offset = 0.1 * partSize;
        partSize -= offset;
        console.log(partSize);
        for (var x = -1; x + partSize < 1; x += (partSize + offset)) {
            for (var y = 1; y - partSize> -1; y -= (partSize + offset)) {
                for (var z = 1; z - partSize> -1; z -= (partSize + offset)) {
                    var squareObject = {};
                    squareObject.vertexes = this.getSquareVertexes(x, y, z, partSize);
                    squareObject.faces = this.getSquareFaces();
                    squareObject.vertex_buffer = GL.createBuffer();
                    squareObject.faces_buffer = GL.createBuffer();
                    squareObject.size = partSize;
                    GL.bindBuffer(GL.ARRAY_BUFFER, squareObject.vertex_buffer);
                    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(squareObject.vertexes), GL.STATIC_DRAW);
                    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, squareObject.faces_buffer);
                    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareObject.faces), GL.STATIC_DRAW);
                    this.cubes.push(squareObject);
                }
            }
        }
    },
    releaseCubes: function (GL) {
        for (var i = 0; i < this.cubes.length; ++i) {;
            GL.deleteBuffer(this.cubes[i].vertex_buffer);
            GL.deleteBuffer(this.cubes[i].faces_buffer);
            GL.deleteBuffer(this.cubes[i].texture.buffer);
            GL.deleteTexture(this.cubes[i].texture.texture);
        }
        this.cubes = [];
    },
    getTextureCoords: function () {
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
    },
    createTexture: function (GL, image) {
        var texture = {};
        texture.buffer = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, texture.buffer);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.getTextureCoords()), GL.STATIC_DRAW);
        texture.texture = GL.createTexture();
        GL.bindTexture(GL.TEXTURE_2D, texture.texture);
        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);

        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.NEAREST);
        GL.bindTexture(GL.TEXTURE_2D, null);
        return texture;
    },
    setTextures: function (GL, image) {
        for (var i = 0; i < this.cubes.length; i++) {
            this.cubes[i].texture = this.createTexture(GL, image);
        }
    }
};