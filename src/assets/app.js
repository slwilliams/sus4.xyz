import * as THREE from "/assets/three.module.js";

// Global audio context.
var context = new AudioContext();
var source = context.createBufferSource();
var playing = false;

function loadAndPlayAudio(song) {           
  var request = new XMLHttpRequest();
  request.open('GET', `/assets/${song}.mp3`, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {      
      if (playing) {
        source.stop(0);
      }
      source = context.createBufferSource();
      source.buffer = buffer;
      var gainNode = context.createGain();
      source.connect(gainNode);
      gainNode.connect(context.destination);
      gainNode.gain.value = -0.4;
      
      source.connect(context.destination);
      source.start(0);
      playing = true;
    }, null);
  }
  request.send();
}
 
function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({canvas});

  const cubeCount = 9;
  const cubeSize = 1;
  const cubeStride = 3;

  const fov = 75;
  const aspect = 2;
  const near = 0.01;
  const far = 500;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = cubeCount*cubeStride + 5;
  camera.position.x = cubeCount*cubeStride/2.0 - cubeSize;
  camera.position.y = 4;
  camera.rotation.x = -0.4;

  const scene = new THREE.Scene();

  const light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  let cubes = [];  
  for (let i = 0; i < cubeCount; i++) {
    for (let j = 0; j < cubeCount; j++) {
      const material = new THREE.MeshPhongMaterial({color: Math.ceil(Math.random()*16777215)});
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x += cubeStride * i;
      cube.position.z += (cubeStride * j) + 5;
      cubes.push(cube);
      scene.add(cube);
    }    
  }  

  function resizeCanvasToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function render(time) {
    time *= 0.001;

    resizeCanvasToDisplaySize();

    for (let c of cubes) {
      c.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

$('.button').each(function(i, e) {
  $(e).click(function(e) {
    let song = $(this).attr('id');
    if (song == '') {
      song = $(this).parent().attr('id');
    }
    loadAndPlayAudio(song);
  });
});

main();