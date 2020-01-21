import * as THREE from "/assets/three.module.js";

// Global audio context.
var context = new AudioContext();
var source = context.createBufferSource();
var analyser = context.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 1024;
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
      gainNode.connect(analyser);      
      gainNode.gain.value = 1;
      analyser.connect(context.destination);
      
      source.start(0);
      playing = true;
    }, null);
  }
  request.send();
}
 
function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({canvas});

  const cubeCount = 41;
  const cubeSize = 0.5;
  const cubeStride = 0.75;

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

  let want = 0; 

 

   function getAverageVolume(array) {
    var values = 0;
    var average;

    //var length = array.length;
    var length = 3;


    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    if (average != 0) {
      console.log(array[0] + " " + array[1] + " " + array[2] + " " + array[3]);
    }

    return average;
  }
 
  const speed = 0.01; 
  const amt = 2;

  function render(time) {    
    var array =  new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var average = getAverageVolume(array)
    want = (average/255)*amt - amt/2;
    if (average == 0) {
      want = 0;
    }
    console.log("avg: " + average + " want@ " + want);

    time *= 0.001;

    wantVals.unshift(want);
    wantVals.pop();

    resizeCanvasToDisplaySize();

    let i = 0;
    for (let c of cubes) {
      const x = Math.floor(i / cubeCount);
      const y = i % cubeCount;
      const index = Math.max(Math.abs(Math.floor(cubeCount/2)-x), Math.abs(Math.floor(cubeCount/2)-y));
      //console.log("i: " + i + " x: " + x + " y: " + y + " index: " + index);

      let wantVal = wantVals[index*prop];
      if (Math.abs(wantVal - c.position.y) > speed) {
        c.position.y += Math.sign(wantVal - c.position.y)*speed;
      }
      c.rotation.y += 0.002;

      i++;
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