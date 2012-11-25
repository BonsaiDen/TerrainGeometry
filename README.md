# WebGL / Three.js TerrainGeometry

This is a ready to use terrain for Three.js.


### Creating a Terrain from a heightMap

```javascript

    var image = new Image();
    image.src = 'heightMap.png';

    var geometry = new TerrainGeometry(300, 300, image, 0.25),
        material = new THREE.MeshLambertMaterial({ color: 0xff0000 }),
        mesh = new THREE.Mesh(terrain, material);


    // If you want to link the terrain to the mesh that uses it simply do the following:
    terrain.scale = mesh.scale;
    terrain.position = mesh.position;

    // At the moment, rotation assumes that the mesh is not rotated, 
    // but it should be trivial to convert the coordinates yourself

```

### Creating a Terrain from a an Array

```javascript

    var height = [
        [1, 2, 3, 4],
        [0, 0, 0, 0],
        [1, 2, 1, 2],
        [0, 3, 0, 3]
    ];

    var cols = 4,
        rows = 4;

    var geometry = new TerrainGeometry(300, 300, height, cols, rows);
        

```

### Retrieving terrain information

```javascript

    // Return the height of the terrain at the given position (in world coordinates)
    var y = terrain.getHeightAt(100, 100);

    // Return the angle based on the two edges of a circle around a point and a base Y rotation
    var a = terrain.getAngleAt(100, 100, 10, Math.PI);

```

### Simplyfing the geometry

Calling `TerrainGeometry.simplify()` will merge adjacent quads with the same 
height into one; thus, reducing the number of vertices used.

The algorithm is very basic and only works for quadratic areas, also, this 
should be called before the geometry is used by a mesh.


## Credits

Bits and pieces taken from https://github.com/jeromeetienne/threejsboilerplate

