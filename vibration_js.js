let firstReadingTimestamp;
let accumTimestamp = 0;
let chartDataVibration = [];
let chartDataSound = [];
let counter = 0;
var scatterChartData = {
  datasets: [{
    label: 'Vibration',
    borderColor: "rgba(255,0,0,1)",
    borderWidth: 2,
    pointRadius: 1,
    backgroundColor: "rgba(255,0,0,0.6)",
    data: [],
    fill: true,
    showLine: true,
    yAxisID: 'y-axis-1'
  },{
    label: 'Sound',
    borderColor: "rgba(0,0,255,1)",
    borderWidth: 2,
    pointRadius: 1,
    backgroundColor: "rgba(0,0,255,0.6)",
    data: [],
    fill: true,
    showLine: true,
    yAxisID: 'y-axis-2'
  }]
};

window.onload = function() {
  var ctx = document.getElementById('canvas').getContext('2d');
  window.myScatter = Chart.Scatter(ctx, {
    data: scatterChartData,
    options: {
      title: { display: true, text: 'Measures'},
      elements: {
				line: { tension: 0.1 }
			},
      animation: { duration: 0 },
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-1',
        }, {
          type: 'linear',
          display: true,
          position: 'right',
          reverse: true,
          id: 'y-axis-2',
          // grid line settings
          /* gridLines: {
            drawOnChartArea: false,
          }, */
        }],
      }
    }
  });
};




// adapted from https://whatwebcando.today/device-motion.html
var onDeviceMotion = function (eventData) {
  accumTimestamp = accumTimestamp + eventData.interval
  rotationHandler(eventData.rotationRate, accumTimestamp);
};

var onGyroscope = function(e) {
    rotationHandler({
      alpha: gyroscope.x,
      beta: gyroscope.y,
      gamma: gyroscope.z
    }, new Date().getTime() - firstReadingTimestamp);
};

var gyroscope = null;
function startGyroscope() {
  chartDataVibration = [];
  if ('Gyroscope' in window) {
    document.getElementById('moApi').innerHTML = 'Generic Sensor API';
    gyroscope = new Gyroscope();
    gyroscope.addEventListener('reading', onGyroscope);
    gyroscope.start();
  } else if ('DeviceMotionEvent' in window) {
    document.getElementById('moApi').innerHTML = 'Device Motion API';
    window.addEventListener('devicemotion', onDeviceMotion, false);
  } else {
    document.getElementById('moApi').innerHTML = 'No Gyroscope API available';
  }
}

function stopGyroscope() {
  if ('Gyroscope' in window) {
    gyroscope.removeEventListener('reading', onGyroscope);
    gyroscope.stop();
  } else if ('DeviceMotionEvent' in window) {
    window.removeEventListener('devicemotion', onDeviceMotion);
  }
}

function rotationHandler(rotation, timestamp) {
  var val;
  
  val = Math.sqrt(rotation.alpha * rotation.alpha +
    rotation.beta * rotation.beta +
    rotation.gamma * rotation.gamma);
  
  document.getElementById("moRotation").innerHTML = val;
  document.getElementById("moInterval").innerHTML = timestamp;
  chartDataVibration.push({
    x: timestamp,
    y: val
  });
}
function updateGraph() {
  scatterChartData.datasets[0].data = chartDataVibration;
  scatterChartData.datasets[1].data = chartDataSound;
  window.myScatter.update();
}




// adapted from https://github.com/cwilso/volume-meter/
var audioContext = null;
var userMediaStream = null;
var meter = null;
var rafID = null;

function startAudio() {
    chartDataSound = [];
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
    // grab an audio context
    audioContext = new AudioContext();

    // Attempt to get audio input
    try {
        // monkeypatch getUserMedia
        navigator.getUserMedia = 
        	navigator.getUserMedia ||
        	navigator.webkitGetUserMedia ||
        	navigator.mozGetUserMedia;

        // ask for an audio input
        navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, didntGetStream);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function didntGetStream() {
    alert('Stream generation failed.');
}

var mediaStreamSource = null;

function gotStream(stream) {
  userMediaStream = stream;
  // Create an AudioNode from the stream.
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  // Create a new volume meter and connect it.
  meter = createAudioMeter(audioContext);
  mediaStreamSource.connect(meter);

  //create Recorder
  shouldStop = false;
  createRecorder(stream);

  // kick off the visual updating
  drawLoop();
}

function drawLoop( time ) {
  var timestamp = new Date().getTime() - firstReadingTimestamp;
  document.getElementById("auValue").innerHTML = meter.volume*1.4;
  document.getElementById("auInterval").innerHTML = timestamp;
  chartDataSound.push({
    x: timestamp,
    y: meter.volume*1.4
  });
  if (timestamp > counter) {
    counter = counter + 1000;
    updateGraph();
  }
  // set up the next visual callback
  if (!shouldStop) {
    rafID = window.requestAnimationFrame( drawLoop );
  }
}

function stopAudio() {
  shouldStop = true;
  meter.shutdown();
  userMediaStream.getTracks().forEach(function(track) {
    track.stop();
  });
}

function startx() {
  firstReadingTimestamp = new Date().getTime();
  counter = 0;
  startGyroscope();
  startAudio();
}

function stopx() {
  stopGyroscope();
  stopAudio();
}




// adpated from https://developers.google.com/web/fundamentals/media/recording-audio
let shouldStop = false;
let stopped = false;
const downloadLink = document.getElementById('download');
const stopButton = document.getElementById('stopButton');

function createRecorder(stream) {
  const options = {mimeType: 'audio/webm'};
  const recordedChunks = [];
  const mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.addEventListener('dataavailable', function(e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }

    if(shouldStop === true && stopped === false) {
      mediaRecorder.stop();
      stopped = true;
    }
  });

  mediaRecorder.addEventListener('stop', function() {
    downloadLink.href = URL.createObjectURL(new Blob(recordedChunks));
    downloadLink.download = 'acetest.wav';
    downloadArray('csv-vibration', chartDataVibration);
    downloadArray('csv-sound', chartDataSound);
  });

  mediaRecorder.start();
};

function downloadArray(id, arr) {
  var csvContent = "";
  for (i = 0; i < arr.length; i++) {
    csvContent = csvContent + arr[i].x + "," + arr[i].y + "\n"; 
  }
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.getElementById(id);
  link.setAttribute("href", url);
  link.setAttribute("download", id + ".csv");
}
