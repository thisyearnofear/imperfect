import React, { ButtonHTMLAttributes } from "react";

type ButtonColor = "green" | "red" | "blue";

const colorClasses: Record<ButtonColor, string> = {
  green: "bg-green-500 hover:bg-green-600",
  red: "bg-red-500 hover:bg-red-600",
  blue: "bg-blue-500 hover:bg-blue-600",
};

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color: ButtonColor;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  color,
  className,
  ...props
}) => (
  <button
    className={`flex-1 max-w-[100px] text-white py-2 px-4 rounded transition-colors text-sm ${colorClasses[color]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default CustomButton;
