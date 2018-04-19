import { EventEmitter } from "eventemitter3"

import { SearchResult } from "./SearchResult"

export const CHANGE = "change"
export const DOWN = "down"
export const ENTER = "enter"
export const ESC = "esc"
export const UP = "up"

export interface EditorCursorOffset {
  lineHeight: number
  top: number
  left?: number
  right?: number
}

export abstract class Editor extends EventEmitter {
  public abstract destroy(): void
  public abstract applySearchResult(result: SearchResult): void
  public abstract getCursorOffset(): EditorCursorOffset | null
  public abstract getBeforeCursor(): string | null
}
