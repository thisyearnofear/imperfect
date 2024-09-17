import React from "react";
import { useWebcam } from "../hooks/useWebcam";

interface WebcamWrapperProps {
  children: (props: ReturnType<typeof useWebcam>) => React.ReactNode;
}

const WebcamWrapper: React.FC<WebcamWrapperProps> = ({ children }) => {
  const webcamProps = useWebcam();
  return <>{children(webcamProps)}</>;
};

export default WebcamWrapper;
