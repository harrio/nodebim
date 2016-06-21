/* global THREE */

import OBJLoader from 'three-obj-loader';
OBJLoader(THREE);

const manager = new THREE.LoadingManager();
const loader = new THREE.JSONLoader(manager);
const envLoader = new THREE.OBJLoader(manager);

let object;
let environment;

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

const loadEnvironment = (name, scene) => {
  if (environment) scene.remove(environment);

  loader.load(
    name, (geometry, materials) => {
      geometry.mergeVertices();
      environment = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
      environment.position.y = 0.1;
//      environment.position.z = 50;
//      environment.position.x = 50;

      scene.add(environment);
   });

}


const getEnvironment = () => {
  if (environment) {
    return environment;
  } else {
    return new THREE.Object3D();
  }
}

const getObject = () => {
  if (object) {
    return object;
  } else {
    return new THREE.Object3D();
  }
}


export {
  loadModelToScene,
  loadEnvironment,
  getEnvironment,
  getObject
}
