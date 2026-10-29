import React from "react";
import type { ComponentProps } from "react";
import { NUTO_ICON_PATH } from "./nuto-path";

export const Nuto: React.FC<ComponentProps<"svg">> = (props) => {
  return (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      //   fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d={NUTO_ICON_PATH}
        // fill="#5A58FF"
        // className="fill-primary"
      />
    </svg>
  );
};
