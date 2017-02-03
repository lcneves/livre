// Constant definitions
const WORLD_RADIUS = 10;
const WORLD_TESSELATION = 32;
const WORLD_OPACITY = 0.85;
const WORLD_SPECULAR = 0x222222;
const WORLD_COLOR = 0x000088;

// Create a sphere to make visualization easier.
var textureLoader = new THREE.TextureLoader();
textureLoader.load(
    'scripts/livre3d/textures/earthmask_2500x1250.jpg',
    function (oceanMask) {
      oceanMask.offset = new THREE.Vector2(0.25, 0.0);
      oceanMask.wrapS = THREE.RepeatWrapping;

      var material = new THREE.MeshPhongMaterial({
        alphaMap: oceanMask,
          wireframe: false,
          transparent: true,
          opacity: WORLD_OPACITY,
          specular: WORLD_SPECULAR,
          color: WORLD_COLOR
      });
      // We want only specular reflections on the oceans
      // TODO: not working
      // material.diffuse.set( 0x000000 );

      var geometry = new THREE.SphereGeometry(WORLD_RADIUS,
        WORLD_TESSELATION, WORLD_TESSELATION);

      var sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
});

// Draw the GeoJSON from JS files previously loaded
//
// drawThreeGeo(adm0, WORLD_RADIUS, 'sphere', {
//   color: 'red'
// })
//
// drawThreeGeo(adm1, WORLD_RADIUS + 0.01, 'sphere', {
//   color: 'yellow'
// })
