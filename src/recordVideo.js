// JavaScript source code
"use strict";

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

var mediaSource = new MediaSource();
mediaSource.addEventListener("sourceopen", handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

var gumVideo = document.querySelector("video#gum");
var recordedVideo = document.querySelector("video#recorded");

var recordButton = document.querySelector("button#record");
var playButton = document.querySelector("button#play");
var downloadButton = document.querySelector("button#download");
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;

console.log("location.host:", location.host);
// window.isSecureContext could be used for Chrome
var isSecureOrigin =
    location.protocol === "https:" || location.host.includes("localhost");
if (!isSecureOrigin) {
    alert(
        "getUserMedia() must be run from a secure origin: HTTPS or localhost." +
        "\n\nChanging protocol to HTTPS"
    );
    location.protocol = "HTTPS";
}

var constraints = {
    audio: true,
    video: true
};

navigator.mediaDevices
    .getUserMedia(constraints)
    .then(successCallback, errorCallback);

function successCallback(stream) {
    console.log("getUserMedia() got stream: ", stream);
    window.stream = stream;
    gumVideo.srcObject = stream;
}

function errorCallback(error) {
    console.log("navigator.getUserMedia error: ", error);
}

function handleSourceOpen(event) {
    console.log("MediaSource opened");
    //sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
    sourceBuffer = mediaSource.addSourceBuffer(
        'video/mp4;codecs="avc1.424028,mp4a.40.2"'
    );
    console.log("Source buffer: ", sourceBuffer);
}

let previousTime = Date.now();

function handleDataAvailable(event) {
    const timeNow = Date.now();
    console.log(`Interval: ${timeNow - previousTime}`);
    previousTime = timeNow;
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function handleStop(event) {
    console.log("Recorder stopped: ", event);
    console.log("Recorded Blobs: ", recordedBlobs);
}

function toggleRecording() {
    if (recordButton.textContent === "Start Recording") {
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = "Start Recording";
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
}

// The nested try blocks will be simplified when Chrome 47 moves to Stable
function startRecording() {
    //var options = { mimeType: "video/webm;codecs=vp9", bitsPerSecond: 100000 };
    var options = {
        mimeType: "video/mp4;codecs=avc1.424028, mp4a.40.2",
        bitsPerSecond: 100000
    };
    recordedBlobs = [];
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e0) {
        console.log(
            "Unable to create MediaRecorder with options Object: ",
            options,
            e0
        );
        try {
            //options = { mimeType: "video/webm;codecs=vp8", bitsPerSecond: 100000 };
            options = {
                mimeType: "video/mp4;codecs=avc1.424028, mp4a.40.2",
                bitsPerSecond: 100000
            };
            mediaRecorder = new MediaRecorder(window.stream, options);
        } catch (e1) {
            console.log(
                "Unable to create MediaRecorder with options Object: ",
                options,
                e1
            );
            try {
                mediaRecorder = new MediaRecorder(window.stream);
            } catch (e2) {
                alert("MediaRecorder is not supported by this browser.");
                console.log("Unable to create MediaRecorder", e2);
                return;
            }
        }
    }
    console.log("Created MediaRecorder", mediaRecorder, "with options", options);
    recordButton.textContent = "Stop Recording";
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(1000); // collect 10ms of data
    console.log("MediaRecorder started", mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
    recordedVideo.controls = true;
}

function play() {
    var type = (recordedBlobs[0] || {}).type;
    var superBuffer = new Blob(recordedBlobs, { type });
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
}

function download() {
    var blob = new Blob(recordedBlobs, { type: "video/mp4" });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "test.mp4";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}
