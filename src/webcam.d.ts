declare module "src/components/Webcam" {
  export function setup(): Promise<void>;
  export function start(): Promise<void>;
  export function stop(
    onStop?: (reps: number, elapsedTime: number) => void
  ): void;
  export function setExerciseParams(
    type: string,
    duration: number,
    targetReps: number
  ): void;
  export const reps: number;
  export const elapsedTime: number;
}
