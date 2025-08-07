import { ReactNode } from "react";

export const PageFooter = ({ children }: { children: ReactNode }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        padding: "10px 0 20px",
        minWidth: "90%",
      }}
    >
      {children}
    </div>
  );
};
