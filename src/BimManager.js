/* global THREE */

const manager = new THREE.LoadingManager();
const loader = new THREE.JSONLoader(manager);

let object;

const addObject = (scene) => {
  return (geometry, materials) => {
    geometry.mergeVertices();
    object = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
    object.rotation.x = -Math.PI/2;
    scene.add(object);
  }
}

const loadModelToScene = (name, scene) => {
  scene.remove(object);
  // load a resource
  loader.load(
      name,
      addObject(scene)
  );
}

export {
  loadModelToScene
}
