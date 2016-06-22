/* global THREE */

import createGeometry from 'three-bmfont-text';
import loadFont from 'load-bmfont';

let font, texture;

loadFont('fonts/DejaVu-sdf.fnt', function(err, f) {
  font = f;
});

const loader = new THREE.TextureLoader();
loader.load('fonts/DejaVu-sdf.png', (tx) => {
  console.log("Texture loaded");
  texture = tx;});

const makeText = (message, renderer) => {

  texture.needsUpdate = true
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = renderer.getMaxAnisotropy();

  // create a geometry of packed bitmap glyphs,
  // word wrapped to 300px and right-aligned
  var geometry = createGeometry({
    width: 300,
    align: 'center',
    text: message,
    font: font
  });

  // change text and other options as desired
  // the options sepcified in constructor will
  // be used as defaults
  //geometry.update(message);

  // we can use a simple ThreeJS material
  var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    color: 0xffffff
  });

  // now do something with our mesh!
  var mesh = new THREE.Mesh(geometry, material);
  
  mesh.position.set(-geometry.layout.width / 2, geometry.layout.height, 0.01);

  var textAnchor = new THREE.Object3D();
  textAnchor.position.y = -0.05;
  textAnchor.add(mesh);
  textAnchor.rotation.y = Math.PI;

  return textAnchor;
};


const makeTextSprite = (message, fontsize) => {
  let ctx, texture, sprite, spriteMaterial,
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  ctx.font = fontsize + 'px Helvetica';

  // setting canvas width/height before ctx draw, else canvas is empty
  //canvas.width = ctx.measureText(message).width;
  //canvas.height = fontsize * 2; // fontsize * 1.5

  // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
  ctx.font = fontsize + 'px Helvetica';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillText(message, 0, fontsize);

  texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter; // NearestFilter;
  texture.needsUpdate = true;

  spriteMaterial = new THREE.SpriteMaterial({map : texture});
  sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.15, 0.15, 0.15);
  return sprite;
}



export {
  makeTextSprite,
  makeText
}
