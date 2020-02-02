import * as THREE from "/assets/three.module.js";

var context = new AudioContext();
var source = context.createBufferSource();
var analyser = context.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 1024;
var playing = false;
var playingID = '';
var startTime = 0;
var bpm = 0;

function loadAndPlayAudio(song) {     
  if (playing) {
    source.stop(0);
    playing = false;
    if (playingID == song) {
      playingID = '';
      return;
    }
  }      
  var request = new XMLHttpRequest();
  request.open('GET', `/assets/${song}.mp3`, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) { 
      source = context.createBufferSource();
      source.buffer = buffer;
      var gainNode = context.createGain();
      source.connect(gainNode);
      gainNode.connect(analyser);      
      gainNode.gain.value = 1;
      analyser.connect(context.destination);
      
      source.start(0);
      startTime = performance.now();
      playing = true;
      playingID = song;
      source.onended = function(e) {
        playing = false;
      }
    }, ()=>{});
  }
  request.send();
}
 
function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});

  const cubeCount = 41;
  const cubeSize = 0.5;
  const cubeStride = 0.75;

  const fov = 75;
  const aspect = 2;
  const near = 0.01;
  const far = 2000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = cubeCount*cubeStride + 5;
  camera.position.x = cubeCount*cubeStride/2.0 - cubeSize;
  camera.position.y = 3;

  const scene = new THREE.Scene();

  const light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set(-1, 2, 4);
  scene.add(light);

  var urls = [
    '/assets/purplenebula_ft.jpg',
    '/assets/purplenebula_bk.jpg',
    '/assets/purplenebula_up.jpg',
    '/assets/purplenebula_dn.jpg',
    '/assets/purplenebula_rt.jpg',
    '/assets/purplenebula_lf.jpg',
  ];
  var textureCube = new THREE.CubeTextureLoader().load(urls);
  scene.background = textureCube;

  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  let cubes = [];
  for (let i = 0; i < cubeCount; i++) {
    for (let j = 0; j < cubeCount; j++) {
      const material = new THREE.MeshPhongMaterial({color: Math.ceil((Math.random()*0x222222)|0x00CC00)});
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x += cubeStride * i;
      cube.position.z += (cubeStride * j) + 5;
      cubes.push(cube);      
      scene.add(cube);
    }    
  }  

  let wantVals = [];
  const prop = 20;
  for (let i = 0; i < (cubeCount-2)*prop; i++) {
    wantVals.push(0);
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

 
  function getAverageVolume(array) {
    var values = 0;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        values += array[i];
    }
    return values / length;
  }

  let cameraSpeed = 0.005;
  let cameraAngle = 0;
  const cameraDist = cubeCount*cubeStride/2;
 
  const speed = 0.01; 
  const amt = 8;

  const initX = camera.position.x;
  const initY = camera.position.z;

  function render(time) {
    resizeCanvasToDisplaySize();
    const timePlaying = performance.now() - startTime;
    const beatsElapsed = timePlaying * bpm/(60.0*1000);
    const toNextBeat = Math.abs(0.5 - (Math.ceil(beatsElapsed) - beatsElapsed));

    var array =  new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var average = getAverageVolume(array)
    let want = (average/255)*amt - amt/2;
    if (average == 0) {
      want = 0;
    }

    wantVals.unshift(want);
    wantVals.pop();

    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i];

      const x = Math.floor(i / cubeCount);
      const y = i % cubeCount;
      const index = Math.max(Math.abs(Math.floor(cubeCount/2)-x), Math.abs(Math.floor(cubeCount/2)-y));

      let wantVal = wantVals[index*prop];
      if (Math.abs(wantVal - c.position.y) > speed) {
        c.position.y += Math.sign(wantVal - c.position.y)*speed
      }
      c.rotation.y += 0.002;
    }

    if (playing) {
      cameraAngle = (cameraAngle + cameraSpeed) % (2*Math.PI);
      let xSign = 0;
      let ySign = 0;
      // x neg == left, y neg == into screen
      if (cameraAngle > 0 && cameraAngle <= Math.PI) {
        xSign = -1;
        ySign = -1;
      }      
      if (cameraAngle > Math.PI && cameraAngle <= 2*Math.PI) {
        xSign = -1;
        ySign = -1;
      }
      let x = 2*cameraDist*Math.sin(cameraAngle/2)*Math.cos(cameraAngle/2)*xSign;
      let y = 2*cameraDist*Math.sin(cameraAngle/2)*Math.sin(cameraAngle/2)*ySign;
      camera.position.x = initX + x;
      camera.position.z = initY + y;
      camera.position.y = Math.min(Math.sin(cameraAngle)*2 + 3, 2) + toNextBeat*0.3;
      camera.rotation.y = -cameraAngle;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

$('.button').each(function(i, e) {
  $(e).click(function(e) {
    let song = $(this).attr('id');
    let songBpm = $(this).data('bpm');
    if (song == '') {
      song = $(this).parent().attr('id');
      songBpm - $(this).parent().data('bpm');
    }
    bpm = songBpm;
    loadAndPlayAudio(song);
  });
});

main();