"use client";
import Footer from "src/components/Footer";
import TransactionWrapper from "src/components/TransactionWrapper";
import WalletWrapper from "src/components/WalletWrapper";
import { useAccount } from "wagmi";
import LoginButton from "../components/LoginButton";
import SignupButton from "../components/SignupButton";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Leaderboard } from "../components/Leaderboard";
import CustomButton from "../components/CustomButton";
import { setup, stop } from "../components/Webcam";
import styles from "./page.module.css";

export default function Page() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("Squat");
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopWebcam, setStopWebcam] = useState(false);
  const [exerciseMode, setExerciseMode] = useState<"squat" | "pushup">("squat");
  const [timeSpent, setTimeSpent] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [canvasPosition, setCanvasPosition] = useState({
    top: "20px",
    right: "20px",
  });

  useEffect(() => {
    if (isTracking) {
      import("src/components/Webcam").then((module) => {
        module.setup();
      });
    }
  }, [isTracking]);

  const handleStart = async () => {
    console.log("handleStart called"); // Debug log
    setIsLoading(true);
    setError(null);
    try {
      console.log("Attempting to access webcam"); // Debug log
      await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Webcam access granted"); // Debug log
      setIsTracking(true);
      setShowSummary(false);
      setStopWebcam(false);
      setIsRunning(true); // Set running status to true
    } catch (err) {
      console.error("Error accessing webcam:", err); // Debug log
      setError(
        "Webcam access denied. Please allow access to use the ExerciseTracker."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    console.log("Stop button pressed");
    setIsTracking(false);
    setIsRunning(false); // Set running status to false
    setExerciseCount(0); // Reset exercise count
    setTimeSpent(0); // Reset time spent
    setError(null); // Clear any errors
    // Stop the video stream
    const videoElement = document.querySelector("video");
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  };

  const handleReset = () => {
    setIsTracking(false);
    setShowSummary(false);
    setExerciseCount(0);
    setTimeSpent(0);
    setError(null);
    setStopWebcam(false);
  };

  const handleExerciseComplete = (count: number, time: number) => {
    setExerciseCount(count);
    setTimeSpent(time);
  };

  const moveCanvas = (newTop: string, newRight: string) => {
    setCanvasPosition({ top: newTop, right: newRight });
  };

  return (
    <div className="flex h-full w-96 max-w-full flex-col px-1 md:w-[1008px]">
      <section className="mt-6 mb-6 flex w-full flex-col md:flex-row">
        <div className="flex w-full flex-row items-center justify-center gap-2 md:gap-0">
          <div className="flex items-center gap-3">
            <SignupButton />
            {!address && <LoginButton />}
          </div>
        </div>
      </section>
      <section className="templateSection flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-gray-100 px-2 py-4 md:grow">
        <div className="flex flex-col h-[450px] w-[450px] max-w-full rounded-xl bg-[#030712] overflow-hidden">
          <div className="flex justify-around bg-[#F3F4F6] rounded-t-xl">
            {["Squat", "Pushup", "Leaderboard", "Settings"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 ${
                  activeTab === tab
                    ? "text-indigo-600 font-bold"
                    : "text-gray-600"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Squat" || tab === "Pushup") {
                    setExerciseMode(tab.toLowerCase() as "squat" | "pushup");
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-grow flex items-center justify-center relative">
            {/* This div is for the loading and tracking messages */}
            <div className="absolute inset-0 flex items-center justify-center bg-transparent text-white">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : !isTracking ? (
                <p>Press Start to begin tracking</p>
              ) : null}
            </div>

            {/* This div is for the p5.js canvas */}
            {(activeTab === "Squat" || activeTab === "Pushup") && (
              <div
                id="canvasContainer"
                style={{
                  position: "absolute",
                  top: canvasPosition.top,
                  right: canvasPosition.right,
                }}
              >
                {isTracking && (
                  <div
                    id="canvasContainer"
                    className={styles.canvasWrapper}
                  ></div>
                )}
                {showSummary && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-4">
                        Workout Summary
                      </h2>
                      <p className="text-xl">
                        Total {activeTab}s: {exerciseCount}
                      </p>
                      <p className="text-xl">
                        Time Spent: {Math.floor(timeSpent / 60)}:
                        {(timeSpent % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "Leaderboard" && (
              <div className="w-full h-full">
                <Leaderboard />
              </div>
            )}
            {activeTab === "Settings" && (
              <p className="text-white">Settings content goes here</p>
            )}
          </div>
        </div>
        <div className="flex w-full justify-center gap-2">
          <CustomButton
            color="green"
            onClick={handleStart}
            disabled={isTracking || isLoading}
          >
            Start
          </CustomButton>
          <CustomButton
            color="red"
            onClick={handleStop}
            disabled={!isTracking || isLoading}
          >
            Stop
          </CustomButton>
          <CustomButton color="blue" onClick={handleReset} disabled={isLoading}>
            Reset
          </CustomButton>
          {address ? <TransactionWrapper /> : <WalletWrapper text="Submit" />}
        </div>
      </section>
      <Footer />
    </div>
  );
}
