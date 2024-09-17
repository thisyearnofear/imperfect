import { useState, useCallback, useEffect } from "react";

export const useWebcam = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [exerciseType, setExerciseType] = useState<"Pushup">("Pushup");

  useEffect(() => {
    // This effect will only run on the client side
    if (typeof window !== "undefined") {
      // Initialize any browser-specific setup here
    }
  }, []);

  const startTracking = useCallback(
    async (type: "Pushup", duration: number) => {
      if (typeof window === "undefined") return;

      try {
        const { setup, setExerciseParams } = await import(
          "src/components/Webcam"
        );
        await navigator.mediaDevices.getUserMedia({ video: true });
        setIsTracking(true);
        setShowSummary(false);
        setExerciseCount(0);
        setTimeSpent(0);
        setExerciseType(type);
        setExerciseParams(type.toLowerCase(), duration, exerciseCount);
        await setup();
      } catch (err) {
        setError(
          "Webcam access denied or error initializing. Please allow access to use the ExerciseTracker."
        );
      }
    },
    []
  );

  const stopTracking = useCallback(async () => {
    if (typeof window === "undefined") return;

    const { stop } = await import("src/components/Webcam");
    stop((reps, elapsedTime) => {
      setExerciseCount(reps);
      setTimeSpent(elapsedTime);
      setShowSummary(true);
    });
    setIsTracking(false);
  }, []);

  const resetTracking = useCallback(() => {
    setIsTracking(false);
    setExerciseCount(0);
    setTimeSpent(0);
    setError(null);
    setShowSummary(false);
  }, []);

  return {
    isTracking,
    exerciseCount,
    timeSpent,
    error,
    showSummary,
    exerciseType,
    startTracking,
    stopTracking,
    resetTracking,
  };
};
