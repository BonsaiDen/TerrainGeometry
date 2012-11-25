/*global THREE */
(function(exports) {

    var TerrainGeometry = function(width, height, source, cols, rows) {

        THREE.Geometry.call( this );

        this.width = width;
        this.height = height;

        this.scale = {
            x: 1,
            y: 1,
            z: 1
        };

        this.position = {
            x: 0,
            y: 0,
            z: 0
        };

        this._min = {
            x: 0,
            z: 0
        };

        this._max = {
            x: 0,
            z: 0
        };

        this.setHeight(source, cols, rows);

    };

    var methods = {

        setHeight: function(source, cols, rows) {

            if (source instanceof Image) {
                this._fromArray(this._loadImage(source, cols, rows),
                                source.width, source.height);

            } else {
                this._fromArray(source, cols || 1, rows || 1);
            }

        },

        getHeightAt: function(x, z) {

            var ox = this.position.x + (this._min.x * this.scale.x),
                oz = this.position.z + (this._min.z * this.scale.z);

            if (x <= this._min.x * this.scale.x
                || x >= this._max.x * this.scale.x
                || z <= this._min.z * this.scale.z
                || z >= this._max.z * this.scale.z) {

                return null;
            }

            var col = Math.floor((x - ox) / (this._quadWidth * this.scale.x)),
                row = Math.floor((z - oz) / (this._quadHeight * this.scale.z));

            var dx = (x - this.position.x) / this.scale.x,
                dz = (z - this.position.z) / this.scale.z;

            if (this._quads[row] && this._quads[row][col]) {
                return this.getQuadHeightAt(dx, dz, this._quads[row][col]) * this.scale.y + this.position.y;

            } else {
                return this.position.y;
            }

        },

        getAngleAt: function(x, z, r, a) {

            var x1 = x + Math.sin(a) * r,
                z1 = z + Math.cos(a) * r;

            var x2 = x - Math.sin(a) * r,
                z2 = z - Math.cos(a) * r;

            var y1 = this.getHeightAt(x1, z1) || 0,
                y2 = this.getHeightAt(x2, z2) || 0;

            // Line co-efficient which returns the slope
            var m = (y2 - y1) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));

            return Math.atan(m);

        },

        // Internals --------------------------------------------------------------
        getQuadHeightAt: function(x, z, q) {

            // from top vertice
            var dx = x - q[0].x,
                dz = z - q[0].z,
                p1, p2, p3;

            // Right triangle
            if (dx > dz) {
                p1 = q[0];
                p2 = q[2];
                p3 = q[3];

            // Left triangle
            } else {
                p1 = q[0];
                p2 = q[1];
                p3 = q[2];
            }

            var det = (p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z),
                l1 = ((p2.z - p3.z) * (x - p3.x) + (p3.x - p2.x) * (z - p3.z)) / det,
                l2 = ((p3.z - p1.z) * (x - p3.x) + (p1.x - p3.x) * (z - p3.z)) / det,
                l3 = 1.0 - l1 - l2;

            return l1 * p1.y + l2 * p2.y + l3 * p3.y;

        },

        getVertexPixels: function(vx, vz) {

            var p = [];
            for(var z = vz - 1; z <= vz; z++) {
                if (z >= 0 && z < this.rows) {
                    for(var x = vx - 1; x <= vx; x++) {
                        if (x >= 0 && x < this.cols) {
                            p.push([x, z]);
                        }
                    }
                }
            }

            return p;

        },

        getRectPointAt: function(map, x, z) {

            var row = map[z];
            if (row !== undefined) {
                return row[x] !== undefined ? row[x] : null;

            } else {
                return null;
            }

        },

        getRectAt: function(map, used, sx, sz) {

            var x = sx,
                z = sz,
                startValue = this.getRectPointAt(map, x, z);

            while(true) {

                // Go to the left see if we can expand
                var xValue = this.getRectPointAt(map, x, z);
                if (xValue === startValue && !used[z][x]) {

                    // Go down all rows and see how far we can expand
                    var row = 0;
                    rows: while(true) {

                        for(var i = sx; i < x + 1; i++) {

                            var zValue = this.getRectPointAt(map, i, sz + row);
                            if (zValue !== startValue && !used[z][x]) {
                                break rows;
                            }

                        }

                        row++;

                    }

                    x++;

                } else {
                    return [x - sx, row];
                }

            }

        },

        getRectangles: function(map) {

            var x, xl,
                z, zl,
                faces = {};

            // Find biggest rectangle
            var used = new Array(this.rows);
            for(z = 0, zl = this.rows; z < zl; z++) {
                used[z] = new Array(this.cols);
                for(x = 0, xl = this.cols; x < xl; x++) {
                    used[z][x] = false;
                }
            }

            var rects = [];
            for(z = 0, zl = this.rows; z < zl; z++) {
                for(x = 0, xl = this.cols; x < xl; x++) {

                    if (!used[z][x]) {

                        var rect = this.getRectAt(map, used, x, z);
                        for(var gz = z, gzl = z + rect[1]; gz < gzl; gz++) {
                            for(var gx = x, gxl = x + rect[0]; gx < gxl; gx++) {
                                used[gz][gx] = true;
                            }
                        }

                        rects.push([x, z, rect[0], rect[1]]);

                    }

                }
            }

            return rects;

        },

        // Generation ---------------------------------------------------------
        _loadImage: function(img, scale, smoothing) {

            scale = scale || 1;
            smoothing = smoothing || 0.1;

            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            var data = context.getImageData(0, 0, img.width, img.height),
                pix = data.data,
                map = new Array(img.height),
                i = 0,
                x, z;

            // Load pixel heights
            for(z = 0; z < img.height; z++) {

                map[z] = new Array(img.width);
                for(x = 0; x < img.width; x++) {
                    var value = (pix[i] + pix[i + 1] + pix[i + 2]) / 3 * scale;
                    value = Math.floor(value / smoothing) * smoothing;
                    map[z][x] = value;
                    i += 4;
                }

            }

            return map;

        },

        _fromArray: function(data, cols, rows) {

            this.cols = cols;
            this.rows = rows;

            this._quadWidth = this.width / this.cols;
            this._quadHeight = this.height / this.rows;

            this._min.x = -this.width / 2;
            this._min.z = -this.height / 2;

            this._max.x = this.width / 2;
            this._max.z = this.height / 2;

            this._pixelHeight = data;

            // Create vertex heights
            var x, z,
                cols1 = this.cols + 1,
                rows1 = this.rows + 1;

            this._vertexHeight = new Array(rows1);

            var verticesHeight = [];
            for(z = 0; z < rows1; z++) {

                this._vertexHeight[z] = new Array(cols1);
                for(x = 0; x < cols1; x++) {

                    var pixels = this.getVertexPixels(x, z),
                        height = 0;

                    for(var i = 0, l = pixels.length; i < l; i++) {
                        height += this._pixelHeight[pixels[i][1]][pixels[i][0]];
                    }

                    verticesHeight.push(this._vertexHeight[z][x] = height / pixels.length);

                }

            }

            // Generate face heights
            this._faceHeightNormal = new Array(this.rows);
            this._quads = new Array(this.rows);

            var w2 = this.width / 2,
                h2 = this.height / 2;

            for(z = 0; z < rows; z++) {

                this._faceHeightNormal[z] = new Array(cols);
                this._quads[z] = new Array(this.cols);

                for(x = 0; x < cols; x++) {

                    var a = x + cols1 * z,
                        b = x + cols1 * (z + 1),
                        c = (x + 1) + cols1 * (z + 1),
                        d = (x + 1) + cols1 * z,
                        v = verticesHeight,
                        normalHeight = v[a] + '#' + v[b] + '#' + v[c] + '#' + v[d];

                    this._faceHeightNormal[z][x] = normalHeight;

                    this._quads[z][x] = [{
                        x: (x) * this._quadWidth - w2,
                        y: this._vertexHeight[z][x],
                        z: (z) * this._quadHeight - h2

                    }, {
                        x: (x) * this._quadWidth - w2,
                        y: this._vertexHeight[z + 1][x],
                        z: (z + 1) * this._quadHeight - h2

                    }, {
                        x: (x + 1) * this._quadWidth - w2,
                        y: this._vertexHeight[z + 1][x + 1],
                        z: (z + 1) * this._quadHeight - h2

                    }, {
                        x: (x + 1) * this._quadWidth - w2,
                        y: this._vertexHeight[z][x + 1],
                        z: (z) * this._quadHeight - h2
                    }];

                }

            }

            this._createGeometry();

        },

        _createGeometry: function() {

            // Calculate face rectangles
            var faceRects = this.getRectangles(this._faceHeightNormal);

            var w2 = this.width / 2,
                h2 = this.height / 2;

            // Create faces and their vertices
            // TODO you can optionally merge these later with THREE.js utils
            var normal = new THREE.Vector3(0, 0, 0);
            for(var i = 0, l = faceRects.length; i < l; i++) {

                var rect = faceRects[i],
                    x = rect[0],
                    z = rect[1],
                    w = rect[2],
                    h = rect[3],
                    vy = this._vertexHeight[z][x];

                var a = new THREE.Vector3(    (x) * this._quadWidth - w2, this._vertexHeight[z][x],             (z) * this._quadHeight - h2),
                    b = new THREE.Vector3(    (x) * this._quadWidth - w2, this._vertexHeight[z + h][x],     (z + h) * this._quadHeight - h2),
                    c = new THREE.Vector3((x + w) * this._quadWidth - w2, this._vertexHeight[z + h][x + w], (z + h) * this._quadHeight - h2),
                    d = new THREE.Vector3((x + w) * this._quadWidth - w2, this._vertexHeight[z][x + w],         (z) * this._quadHeight - h2);

                // Push all these into the vertices
                var id = this.vertices.length;
                this.vertices.push(a, b, c, d);

                // Create faces and UVs
                var face = new THREE.Face4(id, id + 1, id + 2, id + 3);
                face.normal.copy(normal);
                face.vertexNormals.push(normal.clone(), normal.clone(),
                                        normal.clone(), normal.clone());

                this.faces.push(face);

                this.faceVertexUvs[0].push([
                    new THREE.UV(x / this.cols, 1 - z / this.rows),
                    new THREE.UV(x / this.cols, 1- (z + h) / this.rows),
                    new THREE.UV((x + w) / this.cols, 1 - (z + h) / this.rows),
                    new THREE.UV((x + w) / this.cols, 1 - z / this.rows)
                ]);

            }

            this.computeCentroids();
            this.computeFaceNormals();
            this.computeVertexNormals();

            this._faceHeightNormal = null;
            this._pixelHeight = null;

        }

    };

    TerrainGeometry.prototype = Object.create(THREE.Geometry.prototype);

    for(var i in methods) {
        if (methods.hasOwnProperty(i)) {
            TerrainGeometry.prototype[i] = methods[i];
        }
    }

    exports.TerrainGeometry = TerrainGeometry;

})(window);

