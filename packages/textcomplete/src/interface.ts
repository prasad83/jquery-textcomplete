import { SearchResult } from "./SearchResult"
import { Strategy } from "./Strategy"
import { IDropdownOptions } from "./Dropdown"

interface IListenerFn {
  (...args: Array<any>): void
}

export interface IEventEmitter<T extends string> {
  on(event: T, fn: IListenerFn, context?: any): this
  removeListener(event: T, fn: IListenerFn, context?: object): this
}

export type EditorEventName = "change" | "down" | "enter" | "esc" | "up"

export interface IEditorCursorOffset {
  lineHeight: number
  top: number
  left?: number
  right?: number
}

export interface IEditor extends IEventEmitter<EditorEventName> {
  destroy(): void
  applySearchResult(searchResult: SearchResult): void
  getCursorOffset(): IEditorCursorOffset | null
  getBeforeCursor(): string | null
}

export interface ITextcompleteOptions {
  dropdown?: IDropdownOptions
}

export interface IQuery<T = any> {
  match: RegExpMatchArray
  strategy: Strategy<T>
  term: string
}
