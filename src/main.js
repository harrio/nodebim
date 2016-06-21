/* global THREE */
import TWEEN from 'tween.js';
import * as BimManager from './BimManager';
import * as Navigator from './Navigator';
import * as Teleporter from './Teleporter';
import * as Menu from './Menu';
import * as WorldManager from './WorldManager';


const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
const controls = new THREE.VRControls(camera);
const dolly = new THREE.Group();
const raycaster  = new THREE.Raycaster();
const renderer = new THREE.WebGLRenderer({antialias:true});
const effect = new THREE.VREffect(renderer);
const scene = new THREE.Scene();

let teleportOn = false;
let onMenu = false;

let beaconGroup, crosshair, VRManager, menuParent, teleporter, ground;

const init = () => {
  camera.position.set(0, 5, 10);

  crosshair = Navigator.initCrosshair();
  camera.add(crosshair);

  renderer.setPixelRatio(window.devicePixelRatio);

  const container = document.getElementById('viewport');
  container.appendChild(renderer.domElement);

  controls.standing = true;

  dolly.add(camera);

  menuParent = Menu.createMenu(dolly);

  beaconGroup = Navigator.createBeacons();

  const vertexShader = document.getElementById( 'vertexShader' ).textContent;
  const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  const skybox = WorldManager.createSkybox(fragmentShader, vertexShader);
  ground = WorldManager.createGround();
  const lights = WorldManager.createLights();

  scene.add(dolly, beaconGroup, skybox, ground, lights.hemiLight, lights.directionalLight);


  effect.setSize(window.innerWidth, window.innerHeight);
  VRManager = new WebVRManager(renderer, effect);

  setResizeListeners();
  setClickListeners();
  requestAnimationFrame(animate);
};

const setResizeListeners = () => {
  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.updateProjectionMatrix();
};

const setClickListeners = () => {
  const onClickEvent = (event) => {
    if (teleportOn && !onMenu && teleporter) {
      dolly.position.set(teleporter.position.x, teleporter.position.y, teleporter.position.z);
    }
  };
  window.addEventListener("mousedown", onClickEvent, false);
}

var lastRender = 0;
const animate = (timestamp) => {
  requestAnimationFrame(animate);
  lastRender = timestamp;
  controls.update();
  render();

  VRManager.render(scene, camera, timestamp, function() {});
};

const getIntersectedBeacon = () => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = raycaster.intersectObjects(beaconGroup.children);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0].object;
};

const getIntersectedMenu = () => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = raycaster.intersectObjects(menuParent.children);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0].object;
};

const getIntersectedObj = () => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = raycaster.intersectObjects([ground, BimManager.getObject()]);
  if (intersects.length < 1) {
    return null;
  }
  return intersects[0];
};

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
  Menu.updateMenuPosition(camera, menuParent);

  checkMenu();
  if (teleportOn) {
    checkTeleport();
  } else {
    checkBeacon();
  }

  if (tween) {
    TWEEN.update();
  }
};

const checkMenu = () => {
  const obj = getIntersectedMenu();
  if (obj) {
    if (!onMenu) {
      toggleNavigation();
    }
    onMenu = true;
  } else {
    onMenu = false;
  }
}

const checkTeleport = () => {
  scene.remove(teleporter);
  teleporter = null;

  const obj = getIntersectedObj();
  if (obj && obj.point) {
    teleporter = Teleporter.createTeleporter();
    scene.add(teleporter);
    teleporter.position.set(obj.point.x, obj.point.y, obj.point.z);
  }
}

const checkBeacon = () => {
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

       if (Date.now() - intersectedBeacon.timestamp > 1000) { // 1 second stare duration
         crosshair.material = Navigator.createCrosshairMaterial(0xffffff);
         removeBeaconHighlight(intersectedBeacon);
         moveDollyToBeaconPosition(dolly, intersectedBeacon);
       }
  }

}

const toggleNavigation = () => {
  if (teleportOn) {
    scene.remove(teleporter);
    teleporter = null;
    scene.add(beaconGroup);
  } else {
    scene.remove(beaconGroup);
  }
  teleportOn = !teleportOn;
}

const loadModel = (name) => {
  BimManager.loadModelToScene(name, scene);
};

const showUpload = () => {
  var el = document.querySelectorAll('.upload-form')[0];
  el.style.display = 'block';
};

const hideUpload = () => {
  var el = document.querySelectorAll('.upload-form')[0];
  el.style.display = 'none';
};

window.onload = function() {
   init();
};

window.loadModel = loadModel;
window.showUpload = showUpload;
window.hideUpload = hideUpload;
