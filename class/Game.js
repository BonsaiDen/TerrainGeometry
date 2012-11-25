/*global Class, BaseGame, THREE, TerrainGeometry */
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

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 );
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0x002288 );
        light.position.set( -1, -1, -1 );
        this.scene.add( light );

        // Camera
        this.camera.position.set(0, 50, 150);
        this.camera.lookAt(this.scene.position);
        this.controls = new THREE.OrbitControls(this.camera);

        // Load Image and create Terrain
        var img = new Image();
        var uv = new Image();
        img.onload = function() {

            var terrain = new TerrainGeometry(300, 300, img, 8, 8);
            material = new THREE.MeshNormalMaterial({ color: 0xffcc00 });
            //material = new THREE.MeshLambertMaterial( { map: new THREE.Texture(uv) , shading: THREE.SmoothShading });

            //material.map.needsUpdate = true;
            //material.wireframe = true;

            mesh = new THREE.Mesh(terrain, material);
            that.scene.add(mesh);
            that.terrain = terrain;

            that.start();

        };

        uv.src = 'images/uv.png';
        img.src = 'images/height.png';

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

