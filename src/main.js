/* global THREE */
/* global THREEx */

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
const scene = new THREE.Scene();
const keyboard = new THREEx.KeyboardState();

let teleportOn = false;
let onMenu = false;
let keyboardOn = true;
let renderer, canvas, effect;

let beaconGroup, crosshair, VRManager, menuParent, teleporter, ground;

const init = () => {
  camera.position.set(0, 5, 10);

  crosshair = Navigator.initCrosshair();
  camera.add(crosshair);

  canvas = document.getElementById('viewportCanvas');
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio);
  effect = new THREE.VREffect(renderer);

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

  BimManager.loadEnvironment('helsinki.js', scene);


  setResizeListeners();
  setClickListeners();
  requestAnimationFrame(animate);
};

const setResizeListeners = () => {
  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
};

const onWindowResize = () => {
  const width = document.getElementById('viewport').offsetWidth;
  let height = window.innerHeight;
  camera.aspect = width / height;
  effect.setSize(width, height, false);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const setClickListeners = () => {
  const onClickEvent = () => {
    if (teleportOn && !onMenu && teleporter) {
      dolly.position.set(teleporter.position.x, teleporter.position.y, teleporter.position.z);
    }
  };
  window.addEventListener('mousedown', onClickEvent, false);
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
  const intersects = raycaster.intersectObjects([ground, BimManager.getObject(), BimManager.getEnvironment()]);
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

const moveDollyToBeaconPosition = (dolly, intersectedBeacon) => {
  moveDollyTo(dolly, {
    x: intersectedBeacon.position.x,
    y: intersectedBeacon.position.y-1,
    z: intersectedBeacon.position.z},
    1000);
};

let tween = null;
const moveDollyTo = (dolly, pos, time) => {
  const tweenPos = {x: dolly.position.x, y: dolly.position.y, z: dolly.position.z};
  if (tween) {
    tween.stop();
  }
  tween = new TWEEN.Tween(tweenPos).to(pos, time);


  tween.onUpdate(() => {
    dolly.position.set(tweenPos.x, tweenPos.y, tweenPos.z);
  });

  tween.onComplete(function() {
    tween = null;
  });

  tween.easing(TWEEN.Easing.Quadratic.In);
  tween.start();
}


let intersectedBeacon = null;

const render = () => {
  Menu.updateMenuPosition(camera, menuParent);

  checkMenu();
  if (teleportOn) {
    checkTeleport();
  } else {
    checkBeacon();
  }

  if (keyboardOn) {
    checkKeyboard();
  }

  if (tween) {
    TWEEN.update();
  }
};

const checkKeyboard = () => {
  const hspeed = 100;
  const vspeed = 100;
  const vstep = 0.5;
  const hstep = 0.5;
  const rot = 3.14/180 * 5;


  if (keyboard.pressed('W')) {
    //alignDollyTo(camera.getWorldDirection());
    dolly.translateZ(-hstep);
  }

  if (keyboard.pressed('S')) {
    //alignDollyTo(camera.getWorldDirection());
    dolly.translateZ(hstep);
  }

  if (keyboard.pressed('A')) {
    dolly.rotateY(rot);
  }

  if (keyboard.pressed('D')) {
    dolly.rotateY(-rot);
  }

  if (keyboard.pressed('R')) {
    dolly.translateY(vstep);
  }
  if (keyboard.pressed('F')) {
    dolly.translateY(-vstep);
  }

}

const alignDollyTo = (vec) => {
  dolly.lookAt(new THREE.Vector3(0, vec.y, 0));
  //const axis = new THREE.Vector3(0, 1, 0);
  //dolly.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
}

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
