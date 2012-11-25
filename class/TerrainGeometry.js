/*global THREE */
(function(exports) {

    var TerrainGeometry = function(width, height, source, scale, cols, rows) {

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

        this.setHeight(source, scale, cols, rows);

    };

    var methods = {

        setHeight: function(source, scale, cols, rows) {

            if (source instanceof Image) {
                this._fromArray(this._loadImage(source, cols), scale, source.width, source.height);

            } else {
                this._fromArray(source, scale, cols || 1, rows || 1);
            }

        },

        getHeightAt: function(x, z) {

            if (x <= this._min.x * this.scale.x || x >= this._max.x * this.scale.x
                || z <= this._min.z * this.scale.z || z >= this._max.z * this.scale.z) {

                return null;
            }

            var ox = this.position.x + (this._min.x * this.scale.x),
                oz = this.position.z + (this._min.z * this.scale.z),
                col = Math.floor((x - ox) / (this._quadWidth * this.scale.x)),
                row = Math.floor((z - oz) / (this._quadHeight * this.scale.z)),
                dx = (x - this.position.x) / this.scale.x,
                dz = (z - this.position.z) / this.scale.z;

            if (row >= 0 || row < this.rows || col >= 0 && col < this.col) {
                return this.getQuadHeightAt(dx, dz, this._quadGrid[row * this.cols + col]) * this.scale.y + this.position.y;

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
        getQuadHeightAt: function(x, z, qid) {

            var q = this._quadList[qid];

            // Calculate offset from top left vertex
            var dx = x - q[0].x,
                dz = z - q[0].z,
                p1, p2, p3;

            //  #Dir0   #Dir1
            //  l: 013  l: 012
            //  r: 123  r: 023
            //
            //  0---3   0---3
            //  |  /|   |\  |
            //  | / |   | \ |
            //  |/  |   |  \|
            //  1---2   1---2
            if (q[4] === 1) {

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

            } else {

                if (dz > 1 - dx) {
                    p1 = q[1];
                    p2 = q[2];
                    p3 = q[3];

                // Left triangle
                } else {
                    p1 = q[0];
                    p2 = q[1];
                    p3 = q[3];
                }

            }

            var det = (p2.z - p3.z) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.z - p3.z),
                l1 = ((p2.z - p3.z) * (x - p3.x) + (p3.x - p2.x) * (z - p3.z)) / det,
                l2 = ((p3.z - p1.z) * (x - p3.x) + (p1.x - p3.x) * (z - p3.z)) / det,
                l3 = 1.0 - l1 - l2;

            return l1 * p1.y + l2 * p2.y + l3 * p3.y;

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

            var startValue = this.getRectPointAt(map, sx, sz),
                size = 1;

            outer: while(true) {

                for(var z = sz; z < sz + size; z++) {
                    for(var x = sx; x < sx + size; x++) {

                        var val = this.getRectPointAt(map, x, z),
                            isUsed = used[z] && used[z][x];

                        if (val !== startValue || isUsed) {
                            break outer;
                        }

                    }
                }

                size++;

            }

            return [size - 1, size - 1, startValue];

        },

        getRectangles: function(map) {

            console.time('getRectangles');

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

                        rects.push([x, z, rect[0], rect[1], rect[2], false]);

                    }

                }
            }

            console.timeEnd('getRectangles');
            return rects;

        },

        // Generation ---------------------------------------------------------
        _fromArray: function(data, scale, cols, rows) {

            this.cols = cols;
            this.rows = rows;

            this._min.x = -this.width / 2;
            this._min.z = -this.height / 2;

            this._max.x = this.width / 2;
            this._max.z = this.height / 2;

            this._quadWidth = this.width / this.cols;
            this._quadHeight = this.height / this.rows;
            this._quadGrid = null;
            this._quadList = null;

            var faceHeights = this._parseHeight(data, scale);

            this._createGeometry(this.getRectangles(faceHeights));
            this._vertexHeight = null;

        },

        _loadImage: function(img, smoothing) {

            console.time('loadImage');

            smoothing = smoothing || 0.1;

            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                w = img.width,
                h = img.height,
                count = w * h;

            canvas.width = w;
            canvas.height = h;
            context.drawImage(img, 0, 0);

            var data = context.getImageData(0, 0, w, h),
                pix = data.data,
                map = new Uint8Array(count);

            // Load pixel heights
            for(var e = 0, i = 0; e < count; e++) {
                map[e] = Math.floor(((pix[i] + pix[i + 1] + pix[i + 2]) / 3) / smoothing) * smoothing;
                i += 4;
            }

            console.timeEnd('loadImage');

            return map;

        },

        _parseHeight: function(data, scale) {

            console.time('parseHeight');

            var x, z,
                cols1 = this.cols + 1,
                rows1 = this.rows + 1,
                w2 = this.width / 2,
                h2 = this.height / 2;

            this._vertexHeight = new Float32Array(rows1 * cols1);
            for(z = 0; z < rows1; z++) {

                for(x = 0; x < cols1; x++) {

                    var l = 0, height = 0;
                    for(var pz = z - 1; pz <= z; pz++) {
                        if (pz >= 0 && pz < this.rows) {
                            for(var px = x - 1; px <= x; px++) {
                                if (px >= 0 && px < this.cols) {
                                    height += data[pz * this.cols + px];
                                    l++;
                                }
                            }
                        }
                    }

                    if (l !== 0) {
                        height /= l;
                    }

                    height /= scale;

                    this._vertexHeight[z * cols1 + x] = height;

                }

            }

            // Generate Face height data
            var faceHeights = new Array(this.rows);
            this._quadGrid = new Array(this.rows * this.cols);

            var v = this._vertexHeight;
            for(z = 0; z < this.rows; z++) {

                faceHeights[z] = new Array(this.cols);

                for(x = 0; x < this.cols; x++) {

                    var normalHeight = v[x + cols1 * z] * 13
                                     + v[x + cols1 * (z + 1)] * 47
                                     + v[(x + 1) + cols1 * (z + 1)] * 101
                                     + v[(x + 1) + cols1 * z] * 211;

                    faceHeights[z][x] = normalHeight;

                }

            }

            console.timeEnd('parseHeight');

            return faceHeights;

        },

        _createGeometry: function(rectangles) {

            console.time('createGeometry');

            // Calculate face rectangles
            var count = rectangles.length,
                normal = new THREE.Vector3(0, 1, 0),
                w2 = this.width / 2,
                h2 = this.height / 2,
                qw = this._quadWidth,
                qh = this._quadHeight,
                quadId = 0,
                vertexId = 0,
                faceId = 0;

            // Create internal arrays with fixes sizes
            this.vertices = new Array(count * 4);
            this.faces = new Array(count * 2);
            this.faceVertexUvs[0] = new Array(count * 2);
            this._quadList = new Array(count);

            var vertexMap = {};
            function getVertex(x, y, z) {

                var id = x + '#' + y + '#' + z;
                if (vertexMap[id]) {
                    return vertexMap[id];

                } else {
                    return new THREE.Vector3(x, y, z);
                }

            }

            // Create faces, their vertices and quads
            var cols1 = (this.cols + 1);
            for(var i = 0; i < count; i++) {

                // Rectangle Data
                var rect = rectangles[i],
                    x = rect[0],
                    z = rect[1],
                    w = rect[2],
                    h = rect[3];

                // Height
                var ay = this._vertexHeight[z * cols1 + x],
                    by = this._vertexHeight[(z + h) * cols1 + x],
                    cy = this._vertexHeight[(z + h) * cols1 + (x + w)],
                    dy = this._vertexHeight[z * cols1 + (x + w)];

                // Faces
                var faceA, faceB,
                    dir = ((dy - by) > (ay - cy)) ? 1 : 0;

                //  #Dir0   #Dir1
                //  l: 013  l: 012
                //  r: 123  r: 023
                //
                //  a---d   a---d
                //  |  /|   |\  |
                //  | / |   | \ |
                //  |/  |   |  \|
                //  b---c   b---c
                if (dir === 0) {
                    faceA = new THREE.Face3(vertexId, vertexId + 1, vertexId + 3);
                    faceB = new THREE.Face3(vertexId + 1, vertexId + 2, vertexId + 3);

                    this.faceVertexUvs[0][faceId] = [
                        new THREE.UV(x / this.cols, 1 - z / this.rows),
                        new THREE.UV(x / this.cols, 1- (z + h) / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - z / this.rows)
                    ];

                    this.faceVertexUvs[0][faceId + 1] = [
                        new THREE.UV(x / this.cols, 1- (z + h) / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - (z + h) / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - z / this.rows)
                    ];

                } else {
                    faceA = new THREE.Face3(vertexId, vertexId + 1, vertexId + 2);
                    faceB = new THREE.Face3(vertexId + 0, vertexId + 2, vertexId + 3);

                    this.faceVertexUvs[0][faceId] = [
                        new THREE.UV(x / this.cols, 1 - z / this.rows),
                        new THREE.UV(x / this.cols, 1- (z + h) / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - (z + h) / this.rows)
                    ];

                    this.faceVertexUvs[0][faceId + 1] = [
                        new THREE.UV(x / this.cols, 1 - z / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - (z + h) / this.rows),
                        new THREE.UV((x + w) / this.cols, 1 - z / this.rows)
                    ];

                }

                faceA.normal.copy(normal);
                faceA.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
                faceB.normal.copy(normal);
                faceB.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());

                this.faces[faceId++] = faceA;
                this.faces[faceId++] = faceB;

                // Vertices
                var a = getVertex(    (x) * qw - w2, ay,     (z) * qh - h2),
                    b = getVertex(    (x) * qw - w2, by, (z + h) * qh - h2),
                    c = getVertex((x + w) * qw - w2, cy, (z + h) * qh - h2),
                    d = getVertex((x + w) * qw - w2, dy,     (z) * qh - h2);

                this.vertices[vertexId++] = a;
                this.vertices[vertexId++] = b;
                this.vertices[vertexId++] = c;
                this.vertices[vertexId++] = d;

                // Map quads
                if (w === 1 && h === 1) {
                    this._quadGrid[z * this.cols + x] = quadId;

                } else {
                    for(var qz = z; qz < z + h; qz++) {
                        for(var qx = x; qx < x + w; qx++) {
                            this._quadGrid[qz * this.cols + qx] = quadId;
                        }
                    }
                }

                this._quadList[quadId++] = [a, b, c, d, dir];

            }

            console.timeEnd('createGeometry');

            console.time('mergeGeometry');

            this.computeFaceNormals();

            // Get rid of THREE.js internal temp arrays
            this.dynamic = false;
            console.timeEnd('mergeGeometry');

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

