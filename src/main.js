/* global THREE */
import TWEEN from 'tween.js';
import * as Navigator from './Navigator';

let object;

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
const controls = new THREE.VRControls(camera);
const dolly = new THREE.Group();
const raycaster  = new THREE.Raycaster();
const renderer = new THREE.WebGLRenderer({antialias:true});
const effect = new THREE.VREffect(renderer);
const scene = new THREE.Scene();

const manager = new THREE.LoadingManager();
const loader = new THREE.JSONLoader(manager);

let beaconGroup, crosshair, VRManager;

const init = () => {
  camera.position.set(0, 5, 10);

  crosshair = Navigator.initCrosshair();
  camera.add(crosshair);

  renderer.setPixelRatio(window.devicePixelRatio);

  const container = document.getElementById('viewport');
  container.appendChild(renderer.domElement);

  controls.standing = true;

  dolly.add( camera );

  beaconGroup = Navigator.createBeacons();

  const skybox = createSkybox();
  const ground = createGround();
  const lights = createLights();
  scene.add(dolly, beaconGroup, skybox, ground, lights.hemiLight, lights.directionalLight);


  effect.setSize(window.innerWidth, window.innerHeight);
  VRManager = new WebVRManager(renderer, effect);

  setResizeListeners();
  requestAnimationFrame(animate);
}

const setResizeListeners = () => {
  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
};

const createSkybox = () => {
  const vertexShader = document.getElementById( 'vertexShader' ).textContent;
  const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  const uniforms = {
    topColor:    { type: 'c', value: new THREE.Color( 0x0077ff ) },
    bottomColor: { type: 'c', value: new THREE.Color( 0xffffff ) },
    offset:    { type: 'f', value: 33 },
    exponent:  { type: 'f', value: 0.6 }
  };

  const skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
  const skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
  return new THREE.Mesh( skyGeo, skyMat );
}

const createGround = () => {
  const geometry = new THREE.PlaneGeometry(100, 100);
  const material = new THREE.MeshLambertMaterial( {color: 0x7cc000, side: THREE.DoubleSide} );
  const plane = new THREE.Mesh( geometry, material );
  plane.rotation.x = Math.PI / 180 * 90;
  return plane;
}

const createLights = () => {
  const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.7);
  hemiLight.name = 'hemiLight';

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 50);
  directionalLight.name = 'dirLight';

  return {
    hemiLight: hemiLight,
    directionalLight: directionalLight
  };
}

const addObject = (geometry, materials) => {
  geometry.mergeVertices();
  object = new THREE.Mesh( geometry, new THREE.MultiMaterial( materials ) );
  object.rotation.x = -Math.PI/2;
  scene.add( object );
}

const loadModel = (name) => {
  scene.remove(object);
  // load a resource
  loader.load(
      name,
      addObject
  );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
}

var lastRender = 0;
function animate(timestamp) {
  requestAnimationFrame(animate);
  lastRender = timestamp;
  controls.update();
  render();

  VRManager.render(scene, camera, timestamp, function() {});
}

const getIntersectedBeacon = () =>{
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = raycaster.intersectObjects(beaconGroup.children);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0].object;
}

const setBeaconHighlight = (beacon) => {
  beacon.material.color.setHex(0x00ff00);
};

const removeBeaconHighlight = (beacon) => {
  beacon.material.color.setHex(0xff0000);
  beacon.timestamp = null;
};

let tween = null;
const moveDollyToBeaconPosition = (dolly, intersectedBeacon) => {
  const tweenPos = {x: dolly.position.x, y: dolly.position.y, z: dolly.position.z};
  tween = new TWEEN.Tween(tweenPos).to({
    x: intersectedBeacon.position.x,
    y: intersectedBeacon.position.y-1,
    z: intersectedBeacon.position.z},
  1000);

  tween.onUpdate(() => {
    dolly.position.set(tweenPos.x, tweenPos.y, tweenPos.z);
  });

  tween.onComplete(function() {
    tween = null;
  });

  tween.easing(TWEEN.Easing.Quadratic.In);
  tween.start();
};

let intersectedBeacon = null;
const render = () => {
  const obj = getIntersectedBeacon();

  if (!obj || tween) { // clear previous highlight if any and reset timer
    if (intersectedBeacon) {
      removeBeaconHighlight(intersectedBeacon);
    }
    intersectedBeacon = null;
    crosshair.material = Navigator.createCrosshairMaterial(0xffffff);
  } else {
       if (intersectedBeacon && intersectedBeacon != obj) { // clear previous highlight
          removeBeaconHighlight(intersectedBeacon);
       }
       // highlight crosshair and beacon and start stare timer
       crosshair.material = Navigator.createCrosshairMaterial(0x00ffff);
       intersectedBeacon = obj;
       setBeaconHighlight(intersectedBeacon);
       if (!intersectedBeacon.timestamp) intersectedBeacon.timestamp = Date.now();

       if (Date.now() - intersectedBeacon.timestamp > 2000) { // 2 second stare duration
         crosshair.material = Navigator.createCrosshairMaterial(0xffffff);
         removeBeaconHighlight(intersectedBeacon);
         moveDollyToBeaconPosition(dolly, intersectedBeacon);
       }
  }

  if (tween) {
    TWEEN.update();
  }
}

const showUpload = () => {
  var el = document.querySelectorAll('.upload-form')[0];
  el.style.display = 'block';
}

const hideUpload = () => {
  var el = document.querySelectorAll('.upload-form')[0];
  el.style.display = 'none';
}

window.onload = function() {
   init();
}

window.loadModel = loadModel;
window.showUpload = showUpload;
window.hideUpload = hideUpload;
