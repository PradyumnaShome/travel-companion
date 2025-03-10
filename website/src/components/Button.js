import React from "react";

export function Button({ children, onClick, className }) {
  return (
    <button className={`p-2 rounded-md ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
