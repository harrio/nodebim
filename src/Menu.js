/* global THREE */

const yaxis = new THREE.Vector3(0, 1, 0);
const zaxis = new THREE.Vector3(0, 0, 1);

let menuParent, menuToggle, toggleParent;

const createMenuToggle = (dolly) => {
  toggleParent = new THREE.Object3D();
  const geometry = new THREE.CylinderGeometry(0, 0.05, 0.05, 8);
  const material = new THREE.MeshLambertMaterial({color: 0xff0000});
  menuToggle = new THREE.Mesh(geometry, material);
  menuToggle.rotation.x = Math.PI / 180 * -45;
  menuToggle.position.z = -0.5;
  menuToggle.position.y = 1;

  menuToggle.name = "MenuToggle";

  toggleParent.add(menuToggle);
  dolly.add(toggleParent);
  return toggleParent;
}

const createMenu = (dolly, camera, materials) => {
  dolly.remove(menuParent);
  menuParent = new THREE.Object3D();
  let x = 0;
  let y = 0;
  for (let key in materials) {
    let material = materials[key];
    const geometry = new THREE.PlaneGeometry(0.1, 0.1);

    const menuHandle = new THREE.Mesh(geometry, material);
    menuHandle.name = key;
    menuHandle.rotation.x = Math.PI / 180 * -45;

    menuHandle.position.x = 0.2 * x - 0.5;
    menuHandle.position.y = 0.2 * y + 0.5;
    menuHandle.position.z = -1;

    menuParent.add(menuHandle);
    x = x < 4 ? x + 1 : 0;
    y = x == 0 ? y + 1 : y;
  }

  dolly.add(menuParent);
  updateMenuPosition(camera, menuParent);
  return menuParent;
}

const hideMenu = (dolly) => {
  dolly.remove(menuParent);
}

const updateMenuPosition = (camera, menu) => {
  if (menu) {
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
    menu.quaternion.setFromUnitVectors(zaxis, direction);
  }
};

export {
  createMenuToggle,
  createMenu,
  hideMenu,
  updateMenuPosition
}
