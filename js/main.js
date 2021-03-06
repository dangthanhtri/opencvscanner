var takePhotoButton;
var mode = true;
var switchCameraButton;
var amountOfCameras = 0;
var currentFacingMode = 'environment';
const cameraOutput = document.querySelector("#videoOutput"),
  cameraInput = document.querySelector("#video");

// this function counts the amount of video inputs
// it replaces DetectRTC that was previously implemented.
function deviceCount() {
  return new Promise(function (resolve) {
    var videoInCount = 0;

    navigator.mediaDevices
      .enumerateDevices()
      .then(function (devices) {
        devices.forEach(function (device) {
          if (device.kind === 'video') {
            device.kind = 'videoinput';
          }

          if (device.kind === 'videoinput') {
            videoInCount++;
            console.log('videocam: ' + device.label);
          }
        });

        resolve(videoInCount);
      })
      .catch(function (err) {
        console.log(err.name + ': ' + err.message);
        resolve(0);
      });
  });
}

document.addEventListener('DOMContentLoaded', function (event) {
  // check if mediaDevices is supported
  if (
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    navigator.mediaDevices.enumerateDevices
  ) {
    // first we call getUserMedia to trigger permissions
    // we need this before deviceCount, otherwise Safari doesn't return all the cameras
    // we need to have the number in order to display the switch front/back button
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then(function (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        deviceCount().then(function (deviceCount) {
          amountOfCameras = deviceCount;

          // init the UI and the camera stream
          initCameraUI();
          initCameraStream();
        });
      })
      .catch(function (error) {
        //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        if (error === 'PermissionDeniedError') {
          alert('Permission denied. Please refresh and give permission.');
        }

        console.error('getUserMedia() error: ', error);
      });
  } else {
    alert(
      'Mobile camera is not supported by browser, or there is no camera detected/connected',
    );
  }
});

function initCameraUI() {
  console.log(mode);
  takePhotoButton = document.getElementById('takePhotoButton');
  switchCameraButton = document.getElementById('switchCameraButton');

  // https://developer.mozilla.org/nl/docs/Web/HTML/Element/button
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_button_role



  takePhotoButton.addEventListener('click', function () {
    if (mode == true) {
      switchView("videoOutput");
      mode = false;
      takePhotoButton.style.backgroundImage = "url(img/ic_fullscreen_white_48px.svg)";
    } else {
      mode = true;
      switchView("video");
      takePhotoButton.style.backgroundImage = "url(img/ic_photo_camera_white_48px.svg)";
    }
    takeSnapshot();
  });

  // -- switch camera part
  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function () {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }

  // Listen for orientation changes to make sure buttons stay at the side of the
  // physical (and virtual) buttons (opposite of camera) most of the layout change is done by CSS media queries
  // https://www.sitepoint.com/introducing-screen-orientation-api/
  // https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
  window.addEventListener(
    'orientationchange',
    function () {
      // iOS doesn't have screen.orientation, so fallback to window.orientation.
      // screen.orientation will
      if (screen.orientation) angle = screen.orientation.angle;
      else angle = window.orientation;

      var guiControls = document.getElementById('gui_controls').classList;
      var vidContainer = document.getElementById('vid_container').classList;

      if (angle == 270 || angle == -90) {
        guiControls.add('left');
        vidContainer.add('left');
      } else {
        if (guiControls.contains('left')) guiControls.remove('left');
        if (vidContainer.contains('left')) vidContainer.remove('left');
      }

      //0   portrait-primary
      //180 portrait-secondary device is down under
      //90  landscape-primary  buttons at the right
      //270 landscape-secondary buttons at the left
    },
    false,
  );
}

// https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
function initCameraStream() {
  // stop any active streams in the window
  if (window.stream) {
    window.stream.getTracks().forEach(function (track) {
      console.log(track);
      track.stop();
    });
  }

  // we ask for a square resolution, it will cropped on top (landscape)
  // or cropped at the sides (landscape)
  var size = 1280;

  var constraints = {
    audio: false,
    video: {
      width: { ideal: size },
      height: { ideal: size },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError);

  function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    cameraInput.srcObject = stream;

    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    console.log('settings ' + str);
  }

  function handleError(error) {
    console.error('getUserMedia() error: ', error);
  }
}

function takeSnapshot() {
    // if you'd like to show the canvas add it to the DOM

    if ($('#imgCaptured').is(':visible')) {
      var myobj = document.getElementById("imgCaptured");
      myobj.remove();
    }
    var canvas = document.createElement('canvas');
    canvas.id = "canvas"; //T???o id x??i cho d??ng n??y cv.imshow('canvas', dst);
    
    var width = cameraInput.videoWidth;
    var height = cameraInput.videoHeight;
    console.log(width, height);

    var scaleSize = (height / width);
    var heightScale = (window.innerWidth * scaleSize);

    canvas.width = window.innerWidth;
    canvas.height = heightScale;


    context = canvas.getContext('2d');
    context.drawImage(cameraInput, 0, 0, canvas.width, canvas.height);
    console.log(canvas.width, canvas.height);

    // Create an image
    const img = new Image();
    img.onload = function() {
      window.img = img;
    }
    img.src = canvas.toDataURL('image/jpeg,1');

    document.getElementById("videoOutput").innerHTML = ''; // X??a c??i c??
    document.getElementById("videoOutput").appendChild(canvas); // Add canvas

    let image = cv.imread(canvas);
    let edges = new cv.Mat();
    cv.Canny(image, edges, 100, 200);
    // cv.imshow($("canvas")[0],edges);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let cnts = []
    for (let i = 0; i < contours.size(); i++) {
      const tmp = contours.get(i);
      const peri = cv.arcLength(tmp, true);
      let approx = new cv.Mat();

      let result = {
        area: cv.contourArea(tmp),
        points: []
      };

      cv.approxPolyDP(tmp, approx, 0.02 * peri, true);
      const pointsData = approx.data32S;
      for (let j = 0; j < pointsData.length / 2; j++)
        result.points.push({ x: pointsData[2 * j], y: pointsData[2 * j + 1] });

      if (result.points.length === 4) cnts.push(result);

    }
    cnts.sort((a, b) => b.area - a.area);

    console.log(cnts);
    console.log("???? t??m th???y v??n b???n");
    window.points = cnts[0].points;
    drawPoints(cnts[0].points, canvas);
}


function drawPoints(points, canvas) {
  let context = canvas.getContext('2d');
  for (var i = 0; i < points.length; i++) {
    var circle = points[i];

    context.globalAlpha = 0.85;
    context.beginPath();
    context.arc(circle.x, circle.y, 5, 0, Math.PI * 2);
    context.fillStyle = "yellow";
    context.strokeStyle = "yellow";
    context.lineWidth = 5;
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(circle.x, circle.y);
    context.lineTo(points[i - 1 >= 0 ? i - 1 : 3].x, points[i - 1 >= 0 ? i - 1 : 3].y);
    context.stroke();

  }

  init(canvas);
}

function createClickFeedbackUI() {
  // in order to give feedback that we actually pressed a button.
  // we trigger a almost black overlay
  var overlay = document.getElementById('video_overlay'); //.style.display;

  // sound feedback
  var sndClick = new Howl({ src: ['snd/click.mp3'] });

  var overlayVisibility = false;
  var timeOut = 80;

  function setFalseAgain() {
    overlayVisibility = false;
    overlay.style.display = 'none';
  }

  return function () {
    if (overlayVisibility == false) {
      sndClick.play();
      overlayVisibility = true;
      overlay.style.display = 'block';
      setTimeout(setFalseAgain, timeOut);
    }
  };
}


function switchView(name) {
  $("#video , #videoOutput ").hide();
  $("#" + name).show();
}

function canvasClick(e){
  var x = e.touches[0].pageX - e.target.offsetLeft;
  var y = e.touches[0].pageY - e.target.offsetTop;
  
  for(var i=0; i<points.length; i++) {
    
    if(Math.pow(points[i].x - x , 2) + Math.pow(points[i].y - y , 2) < 100 ){
      points[i].selected = true;
      console.log(points[i]);
    } else {
      if(points[i].selected) points[i].selected = false;
    }
  }
  console.log("??ang ch???m v??o");
}
function dragCircle(e){
  //   console.log(points);
  for(var i=0; i<points.length; i++) if(points[i].selected) {
    points[i].x =e.touches[0].pageX - e.target.offsetLeft;
    points[i].y = e.touches[0].pageY - e.target.offsetTop;
    //console.log("xxxx1x");
    console.log("??ang k??o");
  }
  draw(e.target);
}
function stopDragging(e){
  for(var i=0; i<points.length; i++) {
    points[i].selected = false;
  }
  console.log("Ng??ng k??o");
}
function draw(canvas){

  context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img,0,0,canvas.width, canvas.height);
  //context.drawImage(img,0,0,img.width,img.height); Ch??? n??y x??i d??ng tr??n v?? n???u kh??ng s??? b??? thay ?????i h??nh ???nh khi click v??o
  drawPoints(points, canvas);
}

function init(canvas){

    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    console.log("moblie");
    canvas.ontouchstart = canvasClick;
    canvas.ontouchend = stopDragging;
    canvas.ontouchcancel = stopDragging;
    canvas.ontouchmove = dragCircle;
    } else{
    console.log("not moblie");
    canvas.onmousedown = canvasClick;
    canvas.onmouseup = stopDragging;
    canvas.onmouseout = stopDragging;
    canvas.onmousemove = dragCircle;
  }
}