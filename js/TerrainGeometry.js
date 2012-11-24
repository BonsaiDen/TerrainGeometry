/*global Class, THREE */
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
                this._fromArray(this._loadImage(source, cols), source.width, source.height);

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
        getVertexPixels: function(vx, vz) {

            var p = [];
            for(var z = vz - 1; z <= vz; z++) {
                if (z >= 0 && z < this.rows) {
                    for(var x = vx - 1; x <= vx; x++) {
                        if (x >= 0 && x < this.cols) {
                            p.push(z * this.rows + x);
                        }
                    }
                }
            }

            return p;

        },

        getVertexHeight: function(id) {

            var z = ~~(id / (this.cols + 1)),
                x = id - z * (this.cols + 1),
                pixels = this.getVertexPixels(x, z);

            var h = 0;
            for(var i = 0, l = pixels.length; i < l; i++) {
                h += this._heightData[pixels[i]];
            }

            h /= pixels.length;

            return h;

        },

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

        _createGeometry: function() {

            var x, z,
                cols1 = this.cols + 1,
                rows1 = this.rows + 1,

                w = this.width / this.cols,
                h = this.height / this.rows;

            // Create Vertices
            var normal = new THREE.Vector3( 0, 0, 0 );
            for(z = 0; z < rows1; z++) {
                for(x = 0; x < cols1; x++) {

                    var vx = x * w - this.width / 2,
                        vy = this.getVertexHeight(x + z * rows1),
                        vz = z * h - this.height / 2;

                    this.vertices.push(new THREE.Vector3(vx, vy, vz));

                }
            }

            this._quads = new Array(this.rows);
            for(z = 0; z < this.rows; z++) {

                this._quads[z] = new Array(this.cols);

                for(x = 0; x < this.cols; x++) {

                    var a = x + cols1 * z,
                        b = x + cols1 * (z + 1),
                        c = (x + 1) + cols1 * (z + 1),
                        d = (x + 1) + cols1 * z;

                    var face = new THREE.Face4(a, b, c, d);
                    face.normal.copy(normal);
                    face.vertexNormals.push(normal.clone(), normal.clone(),
                                            normal.clone(), normal.clone());

                    this.faces.push(face);
                    this.faceVertexUvs[0].push([
                        new THREE.UV(x / this.cols, 1 - z / this.rows),
                        new THREE.UV(x / this.cols, 1 - (z + 1) / this.rows),
                        new THREE.UV((x + 1) / this.cols, 1 - (z + 1) / this.rows),
                        new THREE.UV((x + 1) / this.cols, 1 - z / this.rows )
                    ]);

                    this._quads[z][x] = [
                        this.vertices[a],
                        this.vertices[b],
                        this.vertices[c],
                        this.vertices[d]
                    ];

                }

            }

            this.computeCentroids();
            this.computeFaceNormals();
            this.computeVertexNormals();

        },

        simplify: function() {

            var x, z,
                cols1 = this.cols + 1,
                rows1 = this.rows + 1,
                map = {};

            for(z = 1; z < rows1 - 1; z++) {

                for(x = 1; x < cols1 - 1; x++) {

                    // Take an inner vertice
                    var i = x + z * rows1;

                    // Grab the four surrounding faces
                    var faces = this._getVertexFaces(i);

                    // Check if all the face normals are the equal
                    if (faces.length !== 4) {
                        continue;
                    }

                    var a = this.faces[faces[0]].normal,
                        b = this.faces[faces[1]].normal,
                        c = this.faces[faces[2]].normal,
                        d = this.faces[faces[3]].normal;

                    if (a.equals(b) && b.equals(c) && c.equals(d)) {

                        map[x + '#' + z] = {
                            vertex: i,
                            faces: faces,
                            group: 0
                        };

                    }

                }

            }

            // Calculate the biggest rectangles from the vertices
            function markRectangle(xs, zs, xe, ze, groupId) {

                var ux = 0,
                    gx = 0,
                    gz = 0,
                    iz, ix,
                    grown = false;

                outer: for(iz = zs; iz < ze; iz++) {

                    for(ix = xs; ix < (ux !== 0 ? ux : xe); ix++) {

                        var v = map[ix + '#' + iz];
                        if (!v || (v.group !== 0 && v.group !== groupId)) {

                            if (ux) {
                                break outer;

                            } else {
                                ux = ix;
                                break;
                            }

                        } else {
                            gx = ix;
                            gz = iz;
                            grown = true;
                        }

                    }

                }

                // Mark the area and increase size
                if (grown) {

                    var vertices = [],
                        faces = {};

                    for(iz = zs; iz <= gz; iz++) {
                        for(ix = xs; ix <= gx; ix++) {

                            var m = map[ix + '#' + iz];
                            m.group = groupId;
                            vertices.push(m.vertex);
                            faces[m.vertex] = m.faces;

                        }
                    }

                    return {
                        vertices: vertices,
                        faces: faces,
                        width: (gx - xs) + 1,
                        height: (gz - zs) + 1
                    };

                } else {
                    return null;
                }

            }

            // Build the rectangular groups for the vertices
            var groupId = 1,
                groups = [];

            for(z = 1; z < this.rows; z++) {
                for(x = 1; x < this.cols; x++) {

                    var v = map[x + '#' + z];
                    if (v && v.group === 0) {

                        var group = markRectangle(x, z, this.cols, this.rows, groupId);
                        if (group && (group.width === group.height || (group.width > 1 && group.height > 1))) {
                            groups.push(group);
                        }

                        groupId++;

                    }

                }
            }

            var g, gl;
            for(g = 0, gl = groups.length; g < gl; g++) {
                this._reduceVertexGroup(groups[g]);
            }

            // Remove all old faces used by the vertices
            this._removeVertexGroupFaces(groups);

        },

        _reduceVertexGroup: function(group) {

            // Grab the outer vertices
            var oa = group.vertices[0],
                ob = group.vertices[group.vertices.length - 1 - (group.width - 1)],
                oc = group.vertices[group.vertices.length - 1],
                od = group.vertices[group.width - 1];

            // Grab the 4 faces
            var fa = group.faces[oa][0],
                fb = group.faces[ob][2],
                fc = group.faces[oc][3],
                fd = group.faces[od][1];

            // Grab the 4 corner vertices
            var a = this.faces[fa].a,
                b = this.faces[fb].b,
                c = this.faces[fc].c,
                d = this.faces[fd].d;

            // Create a new face
            var face = new THREE.Face4(a, b, c, d),
                normal = this.faces[fa].normal;

            face.normal.copy(normal);
            face.vertexNormals.push(normal.clone(), normal.clone(),
                                    normal.clone(), normal.clone());

            this.faces.push(face);

            // Patch UVs
            var cols1 = this.cols + 1,
                rows1 = this.rows + 1;

            function fromId(id) {

                var z = ~~(id / cols1),
                    x = id - (z * rows1);

                return {
                    x: x,
                    z: z
                };

            }

            var lb = fromId(b),
                ld = fromId(d);

            this.faceVertexUvs[0].push([
                new THREE.UV(lb.x / this.cols, 1 - ld.z / this.rows),
                new THREE.UV(lb.x / this.cols, 1 - lb.z / this.rows),
                new THREE.UV(ld.x / this.cols, 1 - lb.z / this.rows),
                new THREE.UV(ld.x / this.cols, 1 - ld.z / this.rows )
            ]);

        },

        _removeVertexGroupFaces: function(groups) {

            var removeList = [],
                i, l;

            for(var g = 0, gl = groups.length; g < gl; g++) {

                var group = groups[g];

                for(var gf in group.faces) {
                    if (group.faces.hasOwnProperty(gf)) {

                        if (group.height > 1 && group.width > 1) {
                            removeList.push(group.faces[gf][0]);
                            removeList.push(group.faces[gf][1]);
                            removeList.push(group.faces[gf][2]);
                            removeList.push(group.faces[gf][3]);

                        } else if (group.height === 1 && group.width === 1) {
                            removeList.push(group.faces[gf][0]);
                            removeList.push(group.faces[gf][1]);
                            removeList.push(group.faces[gf][2]);
                            removeList.push(group.faces[gf][3]);

                        } else if (group.height === 1) {
                            removeList.push(group.faces[gf][0]);
                            removeList.push(group.faces[gf][1]);

                        } else if (group.width === 1) {
                            removeList.push(group.faces[gf][0]);
                            removeList.push(group.faces[gf][2]);
                        }

                    }

                }

            }

            var newFaces = [],
                newFaceVertexUvs = [];

            for(i = 0, l = this.faces.length; i < l; i++) {
                if (removeList.indexOf(i) === -1) {
                    newFaces.push(this.faces[i]);
                    newFaceVertexUvs.push(this.faceVertexUvs[0][i]);
                }
            }

            this.faces.length = 0;
            this.faceVertexUvs[0].length = 0;

            this.faces.push.apply(this.faces, newFaces);
            this.faceVertexUvs[0].push.apply(this.faceVertexUvs[0], newFaceVertexUvs);

        },

        _getVertexFaces: function(i) {

            // Grab the four surrounding faces
            var faces = [], f, l, cl = 0;
            for(f = 0, l = this.faces.length; f < l; f++) {

                var face = this.faces[f];
                if (face.a === i || face.b === i || face.c === i || face.d === i) {

                    faces.push(f);

                    if (++cl === 4) {
                        break;
                    }

                }

            }

            return faces;

        },

        _loadImage: function(img, scale) {

            var canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            var data = context.getImageData(0, 0, img.width, img.height),
                pix = data.data;

            for(var i = 0, j = 0, l = pix.length; i < l; i += 4) {
                var all = pix[i] + pix[i + 1] + pix[i + 2];
                data[j++] = (all / 3) * scale;
            }

            return data;

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

            this._heightData = data;
            this._createGeometry();

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

