import { update } from "undate"
import { Editor, SearchResult, CHANGE } from "textcomplete-core"

import { keyCode, calculateLineHeightPx, calculateElementOffset, getElementScroll } from "./utils"

const textareaCaret = require("textarea-caret")

export class Textarea extends Editor {
  public el: HTMLTextAreaElement

  private lineHeight: number

  constructor(el: HTMLTextAreaElement) {
    super()
    this.el = el
    this.lineHeight = calculateLineHeightPx(this.el)

    this.handleInput = this.handleInput.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.startListening()
  }

  public destroy() {
    this.stopListening()
  }

  public applySearchResult(searchResult: SearchResult) {
    const before = this.getBeforeCursor()
    if (before != null) {
      const replace = searchResult.replace(before, this.getAfterCursor())
      this.el.focus()
      if (replace != null) {
        update(this.el, replace[0], replace[1])
      }
    }
  }

  public getCursorOffset() {
    const offset = calculateElementOffset(this.el)
    const scroll = getElementScroll(this.el)
    const position: { top: number; left: number } = textareaCaret(this.el, this.el.selectionEnd)
    const top = offset.top - scroll.top + position.top + this.lineHeight
    const left = offset.left - scroll.left + position.left

    return this.el.dir !== "rtl"
      ? {
          top,
          left,
          lineHeight: this.lineHeight
        }
      : {
          top,
          right: this.el.ownerDocument.documentElement.clientWidth - left,
          lineHeight: this.lineHeight
        }
  }

  public getBeforeCursor() {
    return this.el.selectionStart !== this.el.selectionEnd ? null : this.el.value.substring(0, this.el.selectionEnd)
  }

  private getAfterCursor(): string {
    return this.el.value.substring(this.el.selectionEnd)
  }

  private handleKeydown(event: KeyboardEvent) {
    const eventName = keyCode(event)
    if (eventName) {
      this.emit(eventName, event)
    }
  }

  private handleInput(event: Event) {
    this.emit(CHANGE, event)
  }

  private startListening() {
    this.el.addEventListener("input", this.handleInput)
    this.el.addEventListener("keydown", this.handleKeydown)
  }

  private stopListening() {
    this.el.removeEventListener("input", this.handleInput)
    this.el.removeEventListener("keydown", this.handleKeydown)
  }
}
