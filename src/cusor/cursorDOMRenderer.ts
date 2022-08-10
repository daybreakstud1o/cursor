import { CursorDOMRenderer, CursorState, HoverTargetType } from "./cursor";
import { clamp } from "./cursor-util";
import { stylesheet } from "./stylesheet";

export interface CursorDOMElements {
  cursorElm: HTMLDivElement;
  highlightElm: HTMLDivElement;
}

/**

  Initialising the cursor elements

 */
export function createCursorElements(): [CursorDOMElements, () => void] {
  // hide cursor
  const baseWrapper = document.createElement("div");

  stylesheet(baseWrapper, {
    position: "fixed",
    left: "0px",
    top: "0px",
    bottom: "0px",
    right: "0px",
    cursor: "none",
    zIndex: "-1",
  });

  // hide cursor on the background
  stylesheet(document.body, {
    cursor: "none",
  });

  // the base element of the cursor
  const cursorElm = document.createElement("div");
  stylesheet(cursorElm, {
    position: "fixed",
    left: "0px",
    top: "0px",
    pointerEvents: "none",
    opacity: "0",
    transitionProperty: "width,height,transform,opacity",
    transitionDuration: ".2s,.2s,.1s,.2s",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const highlightElm = document.createElement("div");
  stylesheet(highlightElm, {
    position: "fixed",
    left: "0px",
    top: "0px",
    pointerEvents: "none",
    opacity: ".5",
    transitionProperty: "width,height,transform,opacity",
    transitionDuration: ".2s,.2s,.2s,.2s",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    backgroundBlendMode: "multiply",
  });

  document.body.appendChild(baseWrapper);
  document.body.appendChild(cursorElm);
  document.body.appendChild(highlightElm);

  const cleanup = () => {
    document.body.removeChild(baseWrapper);
    document.body.removeChild(cursorElm);
    document.body.removeChild(highlightElm);
  };

  return [{ cursorElm, highlightElm }, cleanup];
}
/**

  Updating the dom elements

 */
export const updateCursorDOM: CursorDOMRenderer = ({
  DOMElements,
  x,
  y,
  velX,
  velY,
  width,
  height,
  hidden,
  hoverTarget,
}: CursorState) => {
  const isHoveringText = hoverTarget?.type === HoverTargetType.TEXT;
  const isHoveringTargetBig = hoverTarget?.type === HoverTargetType.TARGET_BIG;
  const isHoveringTargetSmall =
    hoverTarget?.type === HoverTargetType.TARGET_SMALL;

  const maxSkewAmount = isHoveringText ? 5 : 50;
  const maxSkewSensitivity = isHoveringText ? 2 : 4;

  const skewXAmount = clamp(
    velX * maxSkewSensitivity,
    -maxSkewAmount,
    maxSkewAmount
  );
  const skewYAmount = clamp(
    velY * maxSkewSensitivity,
    -maxSkewAmount,
    maxSkewAmount
  );

  const cursorPosX = x - width / 2;
  const cursorPosY = y - height / 2;

  const BIG_TARGET_HOVER_SCALE = 4;
  const SMALL_TARGET_HOVER_PADDING = 8;

  const highlightElmBox = (() => {
    if (isHoveringTargetSmall && hoverTarget.bounds) {
      const posX = hoverTarget.bounds.x || cursorPosX;
      const posY = hoverTarget.bounds.y || cursorPosY;

      const paddingX = hoverTarget.bounds.width * 0.05;
      const paddingY = hoverTarget.bounds.height * 0.05;

      const boxWidth = hoverTarget.bounds.width + paddingX * 2 || width;
      const boxHeight = hoverTarget.bounds.height + paddingY * 2 || height;

      const offsetX =
        (posX + hoverTarget.bounds.width / 2 + paddingX * 2 - x) * 0.1;
      const offsetY =
        (posY + hoverTarget.bounds.height / 2 + paddingY * 2 - y) * 0.1;
      // set it
      return {
        x: posX - paddingX - offsetX,
        y: posY - paddingY - offsetY,
        width: boxWidth,
        height: boxHeight,
      };
    }

    if (isHoveringTargetBig) {
      const boxWidth = width * BIG_TARGET_HOVER_SCALE;
      const boxHeight = height * BIG_TARGET_HOVER_SCALE;

      return {
        x: x - boxWidth / 2,
        y: y - boxHeight / 2,
        width: boxWidth,
        height: boxHeight,
      };
    }

    return { x: cursorPosX, y: cursorPosY, width: width, height: height };
  })();

  const cursorScale = (() => {
    if (hidden) {
      return 0;
    }
    if (isHoveringTargetBig) {
      return 0.5;
    }
    if (isHoveringTargetSmall) {
      return 0;
    }
    return 1;
  })();

  requestAnimationFrame(() => {
    stylesheet(DOMElements.highlightElm, {
      backgroundColor: `#F25410`,
      opacity: isHoveringTargetBig || isHoveringTargetSmall ? ".4" : "0",
      x: highlightElmBox.x,
      y: highlightElmBox.y,
      skewX: skewXAmount / 3,
      skewY: skewYAmount / 3,
      width: `${highlightElmBox.width}px`,
      height: `${highlightElmBox.height}px`,
    });

    stylesheet(DOMElements.cursorElm, {
      backgroundColor: `#F25410`,
      opacity: hidden ? "0" : "1",
      scaleX: cursorScale,
      scaleY: cursorScale,
      width: `${width}px`,
      height: `${height}px`,
      skewX: skewXAmount,
      skewY: skewYAmount,
      x: cursorPosX,
      y: cursorPosY,
    });
  });
};