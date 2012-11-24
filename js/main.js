/*global THREE, Stats, THREEx, Detector, requestAnimationFrame, TerrainGeometry */
var stats, scene, renderer;
var camera, controls, cube, cube1, cube2, cube3, cube4;
var terrain;

var util = {

    matrix: new THREE.Matrix4(),

    rotateInWorld: function(mesh, x, y, z) {

        // Reset the Matrix, Order of the rotations is important
        mesh.matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

        // First Y
        util.matrix.makeRotationY(y);
        mesh.matrix.multiplySelf(util.matrix);
        mesh.rotation.setEulerFromRotationMatrix(mesh.matrix);

        // Then X
        util.matrix.makeRotationX(x);
        mesh.matrix.multiplySelf(util.matrix);
        mesh.rotation.setEulerFromRotationMatrix(mesh.matrix);

        // Finally Z
        util.matrix.makeRotationZ(z);
        mesh.matrix.multiplySelf(util.matrix);
        mesh.rotation.setEulerFromRotationMatrix(mesh.matrix);

    }

};


// init the scene
function init() {

    if (Detector.webgl) {
        renderer = new THREE.WebGLRenderer({
            antialias : true,	// to get smoother output
            preserveDrawingBuffer: true	// to allow screenshot
        });

        renderer.setClearColorHex( 0xBBBBBB, 1 );

    // uncomment if webgl is required
    } else {
        Detector.addGetWebGLMessage();
        return true;
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    // add Stats.js - https://github.com/mrdoob/stats.js
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild( stats.domElement );

    // create a scene
    scene = new THREE.Scene();

    // put a camera in the scene
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set(0, 400, 400);

	controls = new THREE.OrbitControls( camera );
    scene.add(camera);

    THREEx.WindowResize.bind(renderer, camera);


    // Create Terrain ---------------------------------------------------------
    var tex = new Image();
    tex.src = 'images/texture.png';

    var img = new Image();
    img.onload = function() {

        terrain = new TerrainGeometry(300, 300, img, 0.25);

        var material = new THREE.MeshBasicMaterial( { map: new THREE.Texture(tex) } );

        material.map.needsUpdate = true;

        material.wireframe = true;
        scene.add( new THREE.Mesh( terrain , material ) );

    };

    img.src = 'images/height.png';

    // Helper Cubes
    var material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    var geometry = new THREE.CubeGeometry(4, 4, 4);
    cube = new THREE.Mesh(geometry, material);
    scene.add( cube );

    geometry = new THREE.CubeGeometry(1, 1, 1);
    cube1= new THREE.Mesh(geometry, material);
    scene.add( cube1);

    cube2 = new THREE.Mesh(geometry, material);
    scene.add( cube2 );

    material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
    cube3 = new THREE.Mesh(geometry, material);
    scene.add( cube3);

    cube4 = new THREE.Mesh(geometry, material);
    scene.add( cube4);

    // Lights -----------------------------------------------------------------
    var light;
    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0x002288 );
    light.position.set( -1, -1, -1 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );

}

// render the scene
var a = 0;
function render() {

    a += 0.01;

    var x = Math.sin(a) * 100,
        z = Math.cos(a) * 100;

    if (terrain) {

        cube.position.x = x;
        cube.position.y = terrain.getHeightAt(x, z) || 0;
        cube.position.z = z;

        var r = 4, ar = 0;
        var x1 = x + Math.sin(ar) * r,
            z1 = z + Math.cos(ar) * r;

        var x2 = x - Math.sin(ar) * r,
            z2 = z - Math.cos(ar) * r;

        var y1 = terrain.getHeightAt(x1, z1) || 0,
            y2 = terrain.getHeightAt(x2, z2) || 0;

        cube2.position.x = x2;
        cube2.position.y = y2;
        cube2.position.z = z2;

        cube1.position.x = x1;
        cube1.position.y = y1;
        cube1.position.z = z1;

        ar = Math.PI / 2;
        var x3 = x + Math.sin(ar) * r,
            z3 = z + Math.cos(ar) * r;

        var x4 = x - Math.sin(ar) * r,
            z4 = z - Math.cos(ar) * r;

        var y3 = terrain.getHeightAt(x3, z3) || 0,
            y4 = terrain.getHeightAt(x4, z4) || 0;

        cube4.position.x = x4;
        cube4.position.y = y4;
        cube4.position.z = z4;

        cube3.position.x = x3;
        cube3.position.y = y3;
        cube3.position.z = z3;

        var rx = terrain.getAngleAt(x, z, 1, 0),
            rz = terrain.getAngleAt(x, z, 1, Math.PI / 2);

        util.rotateInWorld(cube, rx, 0, -rz);

    }

    // actually render the scene
    renderer.render( scene, camera );
}


// animation loop
function animate() {
    requestAnimationFrame( animate );
	controls.update();
    render();
    stats.update();
}

if( !init() ) {
    animate();
}


