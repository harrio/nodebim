/* global THREE */

const _createSphere = (x,y,z) => {
    const geometry = new THREE.SphereGeometry( 0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial( {
            color: 0xff00cc,
            opacity: 0.1,
            transparent: true
          } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.z = z;
    sphere.position.y = y;
    material.depthTest = false;
    return sphere;
};

const createTeleporter = () => {
  return _createSphere(0, 0, 0);
}

export {
  createTeleporter
}
