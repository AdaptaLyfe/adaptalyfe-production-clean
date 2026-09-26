import { useEffect, useState, type CSSProperties } from "react";

type ModalViewportStyle = CSSProperties & {
  "--health-records-modal-height"?: string;
};

function readModalViewportStyle(): ModalViewportStyle {
  if (typeof window === "undefined" || !window.visualViewport) {
    return {};
  }

  const viewport = window.visualViewport;
  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
    "--health-records-modal-height": `${viewport.height}px`,
  };
}

export function useHealthRecordsModalViewport(): ModalViewportStyle {
  const [style, setStyle] = useState(readModalViewportStyle);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateStyle = () => setStyle(readModalViewportStyle());
    viewport.addEventListener("resize", updateStyle);
    viewport.addEventListener("scroll", updateStyle);
    window.addEventListener("resize", updateStyle);
    updateStyle();

    return () => {
      viewport.removeEventListener("resize", updateStyle);
      viewport.removeEventListener("scroll", updateStyle);
      window.removeEventListener("resize", updateStyle);
    };
  }, []);

  return style;
}