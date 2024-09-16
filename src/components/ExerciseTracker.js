import React, { useRef, useEffect, useState } from "react";

const ExerciseTracker = ({
  isTracking,
  onExerciseComplete,
  onStop,
  stopWebcam,
  exerciseMode,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [reps, setReps] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (isTracking) {
      setStartTime(Date.now());
      initializePoseDetector();
      startWebcam();
    } else if (stopWebcam) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isTracking, stopWebcam]);

  const initializePoseDetector = async () => {
    console.log("Loading Pose Detection model...");
    await tf.setBackend("webgl"); // Set the backend to webgl
    await tf.ready(); // Ensure TensorFlow.js is ready
    const detector = await posenet.load(); // Use global posenet object
    console.log("Pose Detection model loaded");
    setDetector(detector);
  };

  const startWebcam = async () => {
    if (videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current
          ?.play()
          .catch((error) => console.error("Error playing video:", error));
        console.log("Video is playing");
        startDetection();
      };
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startDetection = () => {
    if (detector && videoRef.current) {
      const detectPose = async () => {
        const video = videoRef.current;
        if (video) {
          const pose = await detector.estimateSinglePose(video, {
            flipHorizontal: false,
          });
          console.log("Pose detected:", pose);
          drawSkeleton(pose);
          checkExercise(pose);
        }
        if (isTracking) {
          requestAnimationFrame(detectPose);
        }
      };
      detectPose();
    }
  };

  const drawSkeleton = (pose) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawKeypoints(ctx, pose);
      drawConnectors(ctx, pose);
    }
  };

  const drawKeypoints = (ctx, pose) => {
    pose.keypoints.forEach((kp) => {
      if (kp.score && kp.score > 0.3) {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        console.log("Drawing keypoint:", kp); // Debug log
      }
    });
  };

  const drawConnectors = (ctx, pose) => {
    const adjacentKeyPoints = posedetection.util.getAdjacentPairs(
      posedetection.SupportedModels.MoveNet
    );
    adjacentKeyPoints.forEach(([i, j]) => {
      const kp1 = pose.keypoints[i];
      const kp2 = pose.keypoints[j];
      if (kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
        console.log("Drawing connector:", kp1, kp2); // Debug log
      }
    });
  };

  const checkExercise = (pose) => {
    if (exerciseMode === "squat") {
      checkSquat(pose);
    } else if (exerciseMode === "pushup") {
      checkPushup(pose);
    }
  };

  const checkSquat = (pose) => {
    const leftHip = getKeypoint("left_hip", pose);
    const leftKnee = getKeypoint("left_knee", pose);
    const leftAnkle = getKeypoint("left_ankle", pose);

    if (leftHip && leftKnee && leftAnkle) {
      const angle = calculateAngle(leftHip, leftKnee, leftAnkle);
      if (angle < 100 && !isDown) {
        setIsDown(true);
      } else if (angle > 160 && isDown) {
        setIsDown(false);
        setReps((prevReps) => prevReps + 1);
      }
    }
  };

  const checkPushup = (pose) => {
    const leftShoulder = getKeypoint("left_shoulder", pose);
    const leftElbow = getKeypoint("left_elbow", pose);
    const leftWrist = getKeypoint("left_wrist", pose);

    if (leftShoulder && leftElbow && leftWrist) {
      const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      if (angle < 90 && !isDown) {
        setIsDown(true);
      } else if (angle > 160 && isDown) {
        setIsDown(false);
        setReps((prevReps) => prevReps + 1);
      }
    }
  };

  const getKeypoint = (name, pose) => {
    const keypoint = pose.keypoints.find((kp) => kp.name === name);
    return keypoint && keypoint.score && keypoint.score > 0.3
      ? { x: keypoint.x, y: keypoint.y }
      : null;
  };

  const calculateAngle = (pointA, pointB, pointC) => {
    const radians =
      Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
      Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  useEffect(() => {
    if (!isTracking && startTime) {
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);
      onExerciseComplete(reps, timeSpent);
      onStop();
    }
  }, [isTracking, startTime, reps, onExerciseComplete, onStop]);

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
        {exerciseMode.charAt(0).toUpperCase() + exerciseMode.slice(1)} Count:{" "}
        {reps}
      </div>
    </div>
  );
};

export default ExerciseTracker;
