/* global THREE */

const yaxis = new THREE.Vector3(0, 1, 0);
const zaxis = new THREE.Vector3(0, 0, 1);

const createMenu = (dolly) => {
  const menuParent = new THREE.Object3D();

  const geometry = new THREE.PlaneGeometry(0.2, 0.2);
  const material = new THREE.MeshLambertMaterial( {color: 0xff0000, side: THREE.OneSide} );
  const menuHandle = new THREE.Mesh( geometry, material );
  menuHandle.rotation.x = Math.PI / 180 * -45;

  menuHandle.position.z = -0.5;
  menuHandle.position.y = 1;

  menuParent.add(menuHandle);

  dolly.add(menuParent);
  return menuParent;
}


const updateMenuPosition = (camera, menuParent) => {
  var direction = zaxis.clone();
  // Apply the camera's quaternion onto the unit vector of one of the axes
  // of our desired rotation plane (the z axis of the xz plane, in this case).
  direction.applyQuaternion(camera.quaternion);
  // Project the direction vector onto the y axis to get the y component
  // of the direction.
  var ycomponent = yaxis.clone().multiplyScalar(direction.dot(yaxis));
  // Subtract the y component from the direction vector so that we are
  // left with the x and z components.
  direction.sub(ycomponent);
  // Normalize the direction into a unit vector again.
  direction.normalize();
  // Set the pivot's quaternion to the rotation required to get from the z axis
  // to the xz component of the camera's direction.
  menuParent.quaternion.setFromUnitVectors(zaxis, direction);
};

export {
  createMenu,
  updateMenuPosition
}
