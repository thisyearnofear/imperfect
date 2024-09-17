import p5 from "p5";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

let detector;
let detectorConfig;
let poses;
let video;
let skeleton = true;
let model;
let elbowAngle = 999;
let backAngle = 0;
let reps = 0;
let upPosition = false;
let downPosition = false;
let highlightBack = false;
let backWarningGiven = false;
let edges;
let running = false;
let isDragging = false;
let offsetX, offsetY;
let canvas;
let startTime;
let elapsedTime = 0;
let timerInterval;
let timerStarted = false;
const EXERCISE_DURATION = 60000;

console.log("Setting up webcam..."); // Before accessing window

const sketch = (p) => {
  p.setup = async () => {
    console.log("Window is defined");
    if (typeof window !== "undefined") {
      var msg = new SpeechSynthesisUtterance("Loading, please wait...");
      window.speechSynthesis.speak(msg);
    }

    let canvasWidth, canvasHeight;
    if (typeof window !== "undefined") {
      canvasWidth = window.innerWidth < 640 ? window.innerWidth : 640;
      canvasHeight = window.innerHeight < 480 ? window.innerHeight : 480;
    }

    canvas = p.createCanvas(canvasWidth, canvasHeight);
    canvas.id("p5Canvas");
    canvas.style("position", "absolute");

    let isMobile = false;
    if (typeof window !== "undefined") {
      isMobile = /Mobi|Android/i.test(navigator.userAgent);
    }

    if (isMobile) {
      canvas.style("top", "85px");
      canvas.style("left", "0px");
      canvas.style("right", "20px");
    } else {
      canvas.style("top", "112px");
      canvas.style("right", "20px");
      canvas.style("left", "372px");
    }

    video = p.createCapture(p.VIDEO, videoReady);

    video.hide();

    await init();
  };

  p.mousePressed = () => {
    if (p.mouseX > 0 && p.mouseX < 640 && p.mouseY > 0 && p.mouseY < 480) {
      isDragging = true;
      offsetX = p.mouseX - parseInt(p.select("#p5Canvas").style("left"));
      offsetY = p.mouseY - parseInt(p.select("#p5Canvas").style("top"));
    }
  };

  p.mouseReleased = () => {
    isDragging = false;
  };

  p.mouseDragged = () => {
    if (isDragging) {
      const newTop = p.mouseY - offsetY;
      const newLeft = p.mouseX - offsetX;
      p.select("#p5Canvas").style("top", `${newTop}px`);
      p.select("#p5Canvas").style("left", `${newLeft}px`);
    }
  };

  p.keyPressed = () => {
    const currentTop = parseInt(canvas.style("top"));
    const currentLeft = parseInt(canvas.style("left"));

    if (p.keyCode === p.UP_ARROW) {
      canvas.style("top", `${currentTop - 10}px`);
    } else if (p.keyCode === p.DOWN_ARROW) {
      canvas.style("top", `${currentTop + 10}px`);
    } else if (p.keyCode === p.LEFT_ARROW) {
      canvas.style("left", `${currentLeft - 10}px`);
    } else if (p.keyCode === p.RIGHT_ARROW) {
      canvas.style("left", `${currentLeft + 10}px`);
    }
  };

  p.draw = () => {
    if (!running) return;

    p.background(220);
    p.translate(p.width, 0);
    p.scale(-1, 1);
    p.image(video, 0, 0, video.width, video.height);

    drawKeypoints(p);
    if (skeleton) {
      drawSkeleton(p, edges);
    }

    drawExerciseCounter(p);
    drawTimer(p);
  };

  p.windowResized = () => {
    let canvasWidth, canvasHeight;
    if (typeof window !== "undefined") {
      canvasWidth = window.innerWidth < 640 ? window.innerWidth : 640;
      canvasHeight = window.innerHeight < 480 ? window.innerHeight : 480;
      p.resizeCanvas(canvasWidth, canvasHeight);
    }
  };
};

async function init() {
  await tf.setBackend("webgl");
  detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
  };
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
  edges = {
    "5,7": "m",
    "7,9": "m",
    "6,8": "c",
    "8,10": "c",
    "5,6": "y",
    "5,11": "m",
    "6,12": "c",
    "11,12": "y",
    "11,13": "m",
    "13,15": "m",
    "12,14": "c",
    "14,16": "c",
  };
  running = true;
  await getPoses();
}

async function videoReady() {
  //console.log('video ready');
}

async function getPoses() {
  if (!running) return;
  if (video.elt.readyState === 4 && video.width > 0 && video.height > 0) {
    poses = await detector.estimatePoses(video.elt);
  }
  setTimeout(getPoses, 0);
  //console.log(poses);
}

function drawKeypoints(p) {
  var count = 0;
  if (poses && poses.length > 0) {
    for (let kp of poses[0].keypoints) {
      const { x, y, score } = kp;
      if (score > 0.3) {
        count = count + 1;
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(4);
        p.circle(x, y, 16);
      }
      if (count == 17) {
        //console.log('Whole body visible!');
      } else {
        //console.log('Not fully visible!');
      }
      updateArmAngle();
      updateBackAngle();
      inUpPosition();
      inDownPosition(p);
    }
  }
}

function inDownPosition(p) {
  var elbowAboveNose = false;
  if (poses[0].keypoints[0].y > poses[0].keypoints[7].y) {
    elbowAboveNose = true;
  } else {
    //console.log('Elbow is not above nose')
  }

  if (
    highlightBack == false &&
    elbowAboveNose &&
    p.abs(elbowAngle) > 70 &&
    p.abs(elbowAngle) < 100
  ) {
    //console.log('In down position')
    if (upPosition == true) {
      var msg = new SpeechSynthesisUtterance("Up");
      window.speechSynthesis.speak(msg);
    }
    downPosition = true;
    upPosition = false;
  }
}

function drawSkeleton(p, edges) {
  const confidence_threshold = 0.5;

  if (poses && poses.length > 0) {
    for (const [key, value] of Object.entries(edges)) {
      const points = key.split(",");
      const p1 = points[0];
      const p2 = points[1];

      const y1 = poses[0].keypoints[p1].y;
      const x1 = poses[0].keypoints[p1].x;
      const c1 = poses[0].keypoints[p1].score;
      const y2 = poses[0].keypoints[p2].y;
      const x2 = poses[0].keypoints[p2].x;
      const c2 = poses[0].keypoints[p2].score;

      if (c1 > confidence_threshold && c2 > confidence_threshold) {
        if (
          highlightBack == true &&
          (p1 == 11 || (p1 == 6 && p2 == 12) || p1 == 13 || p2 == 12)
        ) {
          p.strokeWeight(3);
          p.stroke(255, 0, 0);
          p.line(x1, y1, x2, y2);
        } else {
          p.strokeWeight(2);
          p.stroke("rgb(0, 255, 0)");
          p.line(x1, y1, x2, y2);
        }
      }
    }
  }
}

function resetCanvas() {
  poses = [];
  p.clear();
  p.background(220);
}

function stop(onStop) {
  running = false;
  timerStarted = false;
  clearInterval(timerInterval);
  if (video) {
    video.stop();
    video.remove();
  }
  if (canvas) {
    canvas.remove();
  }
  if (onStop) {
    onStop(reps, Math.floor(elapsedTime / 1000));
  }
}

function updateArmAngle() {
  const leftWrist = poses[0].keypoints[9];
  const leftShoulder = poses[0].keypoints[5];
  const leftElbow = poses[0].keypoints[7];

  let angle =
    (Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x) -
      Math.atan2(leftShoulder.y - leftElbow.y, leftShoulder.x - leftElbow.x)) *
    (180 / Math.PI);

  if (angle < 0) {
    //angle = angle + 360;
  }

  if (
    leftWrist.score > 0.3 &&
    leftElbow.score > 0.3 &&
    leftShoulder.score > 0.3
  ) {
    //console.log(angle);
    elbowAngle = angle;
  } else {
    //console.log('Cannot see elbow');
  }
}

function updateBackAngle() {
  const leftShoulder = poses[0].keypoints[5];
  const leftHip = poses[0].keypoints[11];
  const leftKnee = poses[0].keypoints[13];

  const angle =
    (Math.atan2(leftKnee.y - leftHip.y, leftKnee.x - leftHip.x) -
      Math.atan2(leftShoulder.y - leftHip.y, leftShoulder.x - leftHip.x)) *
    (180 / Math.PI);
  const normalizedAngle = angle % 180;
  if (leftKnee.score > 0.3 && leftHip.score > 0.3 && leftShoulder.score > 0.3) {
    backAngle = normalizedAngle;
  }

  if (backAngle < 20 || backAngle > 160) {
    highlightBack = false;
  } else {
    highlightBack = true;
    if (backWarningGiven != true) {
      var msg = new SpeechSynthesisUtterance("Keep your back straight");
      window.speechSynthesis.speak(msg);
      backWarningGiven = true;
    }
  }
}

function inUpPosition() {
  if (elbowAngle > 170 && elbowAngle < 200) {
    //console.log('In up position')
    if (downPosition == true) {
      var msg = new SpeechSynthesisUtterance(String(reps + 1));
      window.speechSynthesis.speak(msg);
      reps = reps + 1;

      // Start the timer on the first rep
      if (!timerStarted) {
        startTimer();
      }
    }
    upPosition = true;
    downPosition = false;
  }
}

function drawTimer(p) {
  p.push();
  p.translate(p.width / 2, p.height - 60);
  p.scale(-1, 1);
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(-150, -30, 300, 60, 10);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);

  if (!timerStarted) {
    p.text("Do a rep to start", 0, 0);
  } else {
    const currentTime = Date.now();
    elapsedTime = Math.min(currentTime - startTime, EXERCISE_DURATION);
    const remainingTime = Math.ceil((EXERCISE_DURATION - elapsedTime) / 1000);
    p.text(`Time remaining: ${remainingTime}s`, 0, 0);
  }

  p.pop();

  if (elapsedTime >= EXERCISE_DURATION) {
    stop();
  }
}

function drawExerciseCounter(p) {
  p.push();
  p.translate(p.width / 2, p.height - 130);
  p.scale(-1, 1);
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(-150, -30, 300, 60, 10);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(`Push-ups completed: ${reps}`, 0, 0);
  p.pop();
}

function startTimer() {
  timerStarted = true;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    if (running) {
      const currentTime = Date.now();
      elapsedTime = Math.min(currentTime - startTime, EXERCISE_DURATION);
      if (elapsedTime >= EXERCISE_DURATION) {
        stop();
      }
    }
  }, 1000);
}

function startExercise() {
  running = true;
  timerStarted = false;
  reps = 0;
  elapsedTime = 0;
}

export async function setup() {
  await tf.ready();
  new p5(sketch);
  startExercise();
}

export { stop, reps, elapsedTime };
