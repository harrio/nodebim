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

let teleportOn = true;
let onMenu = false;
let keyboardOn = true;
let renderer, canvas, effect;

let crosshair, VRManager, menuParent, toggleParent, teleporter, ground;

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

  const vertexShader = document.getElementById( 'vertexShader' ).textContent;
  const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  const skybox = WorldManager.createSkybox(fragmentShader, vertexShader);
  ground = WorldManager.createGround();
  const lights = WorldManager.createLights();

  scene.add(dolly, skybox, ground, lights.hemiLight, lights.directionalLight);


  effect.setSize(window.innerWidth, window.innerHeight);
  VRManager = new WebVRManager(renderer, effect);

  BimManager.loadEnvironment('senaatintori.js', scene);

  toggleParent = Menu.createMenuToggle(dolly);

  // Set side menu height
  const sideMenu = document.querySelectorAll('.side-menu')[0];
  sideMenu.style.height = window.innerHeight-20 + 'px';
  initResize();
  setClickListeners();
  requestAnimationFrame(animate);
};

const initResize = () => {
  onWindowResize();
  setResizeListeners();
};

const setResizeListeners = () => {
  window.addEventListener('resize', onWindowResize, true);
  window.addEventListener('vrdisplaypresentchange', onVRWindowResize, true);
};

const onWindowResize = () => {
  const width = document.getElementById('viewport').offsetWidth;
  const height = window.innerHeight;
  resizeWindow(width, height);
};

const onVRWindowResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  resizeWindow(width, height);
};

const resizeWindow = (width, height) => {
  camera.aspect = width / height;
  effect.setSize(width, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const setClickListeners = () => {
  const onClickEvent = (event) => {
    const menu = getIntersectedMenu();
    if (menu) {
      if (menu.name == 'MenuToggle') {
        if (menuParent) {
          Menu.hideMenu(dolly);
          menuParent = null;
        } else {
          menuParent = Menu.createMenu(dolly, camera, BimManager.getMaterials());
        }
        toggleNavigation();
      } else {
        BimManager.toggleMaterial(menu);
      }
    } else if (teleportOn && !onMenu && teleporter && (VRManager.mode == 3 || event.button == 2)) {
      moveDollyTo(dolly, {x: teleporter.position.x, y: teleporter.position.y, z: teleporter.position.z}, 500);

    }
  };
  const viewport = document.getElementById('viewport');
  viewport.addEventListener('mousedown', onClickEvent, false);
}

var lastRender = 0;
const animate = (timestamp) => {
  requestAnimationFrame(animate);
  lastRender = timestamp;
  controls.update();
  render();

  VRManager.render(scene, camera, timestamp, function() {});
};

const getIntersectedMenu = () => {
  raycaster.setFromCamera( { x: 0, y: 0 }, camera );
  const intersects = menuParent ? raycaster.intersectObjects(menuParent.children.concat(toggleParent.children)) : raycaster.intersectObjects(toggleParent.children);
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

let tween = null;
const moveDollyTo = (dolly, pos, time) => {
  console.log('Going to: '+pos.x+','+pos.y+','+pos.z);
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

const render = () => {
  Menu.updateMenuPosition(camera, toggleParent);

  if (teleportOn) {
    checkTeleport();
  }

  if (keyboardOn) {
    checkKeyboard();
  }

  if (tween) {
    TWEEN.update();
  }
};

const logPos = (name, obj) => {
    console.log(name+" position: ",obj.position);
    console.log(name+" rotation: ",obj.rotation);
    console.log(name+" worldDir: ",obj.getWorldDirection());

}

const checkKeyboard = () => {
  const hspeed = 100;
  const vspeed = 100;
  const vstep = 0.5;
  const hstep = 0.5;
  const rot = 3.14/180 * 5;
  const lbounds = new THREE.Vector3(-1000, 0.5, -1000);
  const ubounds = new THREE.Vector3(1000, 200, 1000);

  


  if (keyboard.pressed('W') || keyboard.pressed('up')) {
    let cwd = camera.getWorldDirection();

    dolly.position.x += cwd.x*hstep;
    dolly.position.z += cwd.z*hstep;
  }

  if (keyboard.pressed('S') || keyboard.pressed('down')) {
    let cwd = camera.getWorldDirection();

    dolly.position.x += cwd.x* (-hstep);
    dolly.position.z += cwd.z* (-hstep);
  }

  if (keyboard.pressed('A') || keyboard.pressed('left')) {
    dolly.rotateY(rot);
  }

  if (keyboard.pressed('D') || keyboard.pressed('right')) {
    dolly.rotateY(-rot);
  }

  if (keyboard.pressed('R') || keyboard.pressed('.')) {
    dolly.position.y += vstep;

  }
  if (keyboard.pressed('F') || keyboard.pressed(',')) {
    dolly.position.y -= vstep;
  }

  dolly.position.clamp(lbounds, ubounds);

}

const alignDollyToCamera = () => {
  console.log(dolly.getWorldRotation());
  console.log(camera.rotation);  
  
  dolly.quaternion.setFromEuler(new THREE.Euler(0, camera.getWorldRotation().y, 0, 'XYZ'));

}

const toggleNavigation = () => {
  if (teleportOn) {
    scene.remove(teleporter);
    teleporter = null;
  }
  teleportOn = !teleportOn;
}

const checkTeleport = () => {
  if (!teleporter) {
    teleporter = Teleporter.createTeleporter();
    scene.add(teleporter);
  }

  const obj = getIntersectedObj();
  if (obj && obj.point) {
    teleporter.position.set(obj.point.x, obj.point.y, obj.point.z);
  }
}

const loadModel = (name) => {
  BimManager.loadModelToScene(name, scene, () => {
    //menuParent = Menu.createMenu(dolly, BimManager.getMaterials());
  });
  toggleSideMenu();
};

const isDomElementHidden = (el) => {
    const style = window.getComputedStyle(el);
    return (style.display === 'none')
}

const showDom = (domSelector) => {
  const el = document.querySelectorAll(domSelector)[0];
  el.style.display = 'block';
};

const hideDom = (domSelector) => {
  const el = document.querySelectorAll(domSelector)[0];
  el.style.display = 'none';
};

const toggleSideMenu = () => {
  const sideMenu = document.querySelectorAll('.side-menu')[0];
  const sideContent = document.querySelectorAll('.side-menu-content')[0];
  if(isDomElementHidden(sideContent)) {
    hideDom('.side-menu-button');
    sideMenu.style.width = '25%';
    sideMenu.style.height = window.innerHeight-20 +'px';
    setTimeout(()=>{
      showDom('.side-menu-content');
    }, 500);
  } else {
    hideDom('.side-menu-content');
    showDom('.side-menu-button');
    sideMenu.style.width = '36px';
    sideMenu.style.height = '29px';
  }
}

window.onload = function() {
   init();
};

window.loadModel = loadModel;
window.showDom = showDom;
window.hideDom = hideDom;
window.toggleSideMenu = toggleSideMenu;
