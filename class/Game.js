/*global Class, BaseGame, THREE, TerrainGeometry, toImage */
var Game = Class(function(update, render) {
    BaseGame(this, update, render);

}, BaseGame, {

    init: function(element, width, height) {
        BaseGame.init(this, element, width, height);
        this.setupScene();
    },

    setupScene: function() {

        var geometry, material, mesh, light, that = this;

        // Cube
        geometry = new THREE.CubeGeometry(4, 4, 4);
        material = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        mesh = new THREE.Mesh(geometry, material);
        this.cube = mesh;
        this.cube.useQuaternion = true;
        this.cubeAngle = 0;
        this.cubeOffset = 0;
        this.scene.add(mesh);

        // Light
        this.light = new THREE.PointLight( 0xffffff, 1 );
        this.light.position.set( 0, 50, 150 );
        this.scene.add( this.light );


        // Camera
        this.camera.position.set(0, 50, 150);
        this.camera.lookAt(this.scene.position);
        this.controls = new THREE.OrbitControls(this.camera);

        // Load Image and create Terrain
        var img = new Image();
        var uv = new Image();
        img.onload = function() {

            var terrain = new TerrainGeometry(300, 300, img, 8, 32);

            var lightMap = toImage(terrain.generateLightMap(256, 1500, 256), img.width, img.height);

            //material = new THREE.MeshNormalMaterial({ color: 0xffcc00 });
            material = new THREE.MeshLambertMaterial( {
                map: new THREE.Texture(uv),
                lightMap: new THREE.Texture(lightMap),
                shading: THREE.SmoothShading
            });

            terrain.computeVertexNormals();
            terrain.faceVertexUvs[1] = terrain.faceVertexUvs[0];
            terrain.computeVertexNormals();

            material.map.needsUpdate = true;
            material.lightMap.needsUpdate = true;
            //material.wireframe = true;

            mesh = new THREE.Mesh(terrain, material);
            that.scene.add(mesh);
            that.terrain = terrain;
            that.terrainMesh = mesh;

            that.start();

        };

        uv.src = 'images/uv.png';
        img.src = 'images/height.png';

        document.addEventListener('mouseup', function() {

            var p = that.camera.position;
            var sx = ~~(img.width / 2 + p.x),
                sy = ~~(img.height / 2 + p.y) * 4,
                sz = ~~(img.height / 2 + p.z);

            that.light.position = p;

            var lightMap = toImage(that.terrain.generateLightMap(sx, sy, sz), img.width, img.height);
            that.terrainMesh.material.lightMap = new THREE.Texture(lightMap);
            that.terrainMesh.material.lightMap.needsUpdate = true;

        }, false);

    },

    update: function(t) {

        if (this.terrain) {

            //this.cubeAngle += 0.01;
            this.cubeOffset += 0.01;

            var x = 0, //Math.sin(this.cubeOffset) * 40, //-40, //
                z = Math.cos(this.cubeOffset) * 40;


            this.cube.position.x = x;
            this.cube.position.y = (this.terrain.getHeightAt(x, z) || 0) + 2;
            this.cube.position.z = z;

            this.cube.quaternion.setFromEuler({
                x: this.terrain.getAngleAt(x, z, 2, this.cubeAngle),
                y: this.cubeAngle,
                z: this.terrain.getAngleAt(x, z, 2, this.cubeAngle - Math.PI / 2)
            });

        }

        this.controls.update();
        BaseGame.update(this, t);

    }

});


function toImage(map, width, height) {

    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    var data = context.getImageData(0, 0, width, height),
        pix = data.data,
        i = 0;

    for(var z = 0; z < height; z++) {

        for(var x = 0; x < width; x++) {
            var value = map[z * width + x];
            pix[i] = pix[i + 1] = pix[i + 2] = value;
            pix[i + 3] = 255;
            i += 4;
        }

    }

    context.putImageData(data, 0, 0);

    return canvas;

}

