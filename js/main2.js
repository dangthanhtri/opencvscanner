let videos = document.getElementById('videoInput'); // video is the id of video tag

let canvasOutput = document.getElementById('canvasOutput'); // canvasFrame is the id of <canvas>

const FPS = 30;

let src;
let dst;
let canvasInputCtx = null;
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (stream) {
        videos.srcObject = stream;
        videos.play();
        canvasInputCtx.drawImage(videos, 0, 0, videos.width, videos.height);
        let imageData = canvasInputCtx.getImageData(0, 0, videos.width, videos.height);
        src.data.set(imageData.data);

        cv.imshow('canvasOutput', src);
    })
    .catch(function (err) {
        console.log("An error occurred! " + err);
    });


