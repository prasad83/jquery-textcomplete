import { ENTER, ESC, UP, DOWN } from "textcomplete-core"

const CHAR_CODE_ZERO = "0".charCodeAt(0)
const CHAR_CODE_NINE = "9".charCodeAt(0)

export function isDigit(charCode: number): boolean {
  return charCode >= CHAR_CODE_ZERO && charCode <= CHAR_CODE_NINE
}

/** Extract editor event name from a keyboard event. */
export function keyCode(event: KeyboardEvent) {
  return event.keyCode === 9
    ? ENTER // tab
    : event.keyCode === 13
      ? ENTER // enter
      : event.keyCode === 27
        ? ESC // esc
        : event.keyCode === 38
          ? UP // up
          : event.keyCode === 40
            ? DOWN // down
            : event.keyCode === 78 && event.ctrlKey
              ? DOWN // ctrl-n
              : event.keyCode === 80 && event.ctrlKey
                ? UP // ctrl-p
                : null
}

/** Get the current coordinates of the `el` relative to the document. */
export function calculateElementOffset(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const { defaultView, documentElement } = el.ownerDocument
  const offset = {
    top: rect.top + defaultView.pageYOffset,
    left: rect.left + defaultView.pageXOffset
  }
  if (documentElement) {
    offset.top -= documentElement.clientTop
    offset.left -= documentElement.clientLeft
  }
  return offset
}

export function getElementScroll(el: HTMLElement) {
  return { top: el.scrollTop, left: el.scrollLeft }
}

/** Returns the line-height of the given node in pixels. */
export function calculateLineHeightPx(el: HTMLElement) {
  const computedStyle = window.getComputedStyle(el)

  if (computedStyle.lineHeight == null) {
    return 0
  }

  // If the char code starts with a digit, it is either a value in pixels,
  // or unitless, as per:
  // https://drafts.csswg.org/css2/visudet.html#propdef-line-height
  // https://drafts.csswg.org/css2/cascade.html#computed-value
  if (isDigit(computedStyle.lineHeight.charCodeAt(0))) {
    // In real browsers the value is *always* in pixels, even for unit-less
    // line-heights. However, we still check as per the spec.
    if (isDigit(computedStyle.lineHeight.charCodeAt(computedStyle.lineHeight.length - 1))) {
      return parseFloat(computedStyle.lineHeight) * parseFloat(computedStyle.fontSize!)
    } else {
      return parseFloat(computedStyle.lineHeight)
    }
  }

  // Otherwise, the value is "normal".
  // If the line-height is "normal", calculate by font-size
  return getLineHeightByFontSize(el, computedStyle)
}

/** Returns calculated line-height of the given node in pixels. */
export function getLineHeightByFontSize(el: HTMLElement, computedStyle: CSSStyleDeclaration): number {
  const ownerDocument = el.ownerDocument
  const body = ownerDocument.body
  const temp = ownerDocument.createElement(el.nodeName)
  temp.innerHTML = "&nbsp;"
  temp.style.fontSize = computedStyle.fontSize
  temp.style.fontFamily = computedStyle.fontFamily
  temp.style.padding = "0"
  body.appendChild(temp)

  // Make sure thextarea has only 1 row
  if (temp instanceof HTMLTextAreaElement) {
    temp.rows = 1
  }

  // Assume the height of the element is the line-height
  const height = temp.offsetHeight
  body.removeChild(temp)
  return height
}
