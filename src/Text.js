/* global THREE */

const makeTextSprite = (message, fontsize) => {
  let ctx, texture, sprite, spriteMaterial,
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  ctx.font = fontsize + "px Arial";

  // setting canvas width/height before ctx draw, else canvas is empty
  canvas.width = ctx.measureText(message).width;
  //canvas.height = fontsize * 2; // fontsize * 1.5

  // after setting the canvas width/height we have to re-set font to apply!?! looks like ctx reset
  ctx.font = fontsize + "px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
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
  makeTextSprite
}
