import { EventEmitter } from "eventemitter3"

import { QueryExecutor } from "./QueryExecutor"
import { IEditor, ITextcompleteOptions } from "./interface"
import { SearchResult } from "./SearchResult"
import { Strategy } from "./Strategy"
import { Dropdown, DropdownEventName } from "./Dropdown";

export class Textcomplete extends EventEmitter {
  public state: "created" | "running" | "suspended" | "destroyed" = "created"

  private dropdown: Dropdown = new Dropdown()
  private editor: IEditor
  private queryExecutor: QueryExecutor = new QueryExecutor(this)
  private strategies: Strategy[]

  constructor({ editor, strategies, options }: { editor: IEditor; strategies: Strategy[], options?: ITextcompleteOptions }) {
    super()

    this.dropdown.init(options && options.dropdown || {})
    this.editor = editor
    this.strategies = strategies

    this.handleChange = this.handleChange.bind(this)
    this.handleDown = this.handleDown.bind(this)
    this.handleEnter = this.handleEnter.bind(this)
    this.handleEsc = this.handleEsc.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleUp = this.handleUp.bind(this)
  }

  public start() {
    if (this.state == "created") {
      this.state = "running"
      this.startListening()
    }
    return this
  }

  public destroy() {
    if (this.state != "destroyed") {
      this.state = "destroyed"
      this.stopListening()
      this.dropdown.destroy()
      this.editor.destroy()
    }
    return this
  }

  public suspend() {
    if (this.state == "running") {
      this.state = "suspended"
      this.stopListening()
    }
    return this
  }

  public resume() {
    if (this.state == "suspended") {
      this.state = "running"
      this.startListening()
    }
    return this
  }

  public hide() {
    if (this.state == "running") {
      this.dropdown.deactivate()
    }
    return this
  }

  public trigger(text: string) {
    this.queryExecutor.run(text, this.strategies)
    return this
  }

  /**
   * @private
   */
  public onHit(searchResults: SearchResult[]) {
    if (searchResults.length) {
      const cursorOffset = this.editor.getCursorOffset()
      if (cursorOffset) {
        this.dropdown.render(searchResults, cursorOffset)
        return
      }
    }
    this.dropdown.deactivate()
  }

  private startListening() {
    this.dropdown.on("select", this.handleSelect)
    ;(["show", "shown", "render", "rendered", "select", "selected", "hidden", "hide"] as Array<
      DropdownEventName
    >).forEach(eventName => this.dropdown.on(eventName, (event: CustomEvent) => this.emit(eventName, event)))
    this.editor
      .on("up", this.handleUp)
      .on("down", this.handleDown)
      .on("enter", this.handleEnter)
      .on("esc", this.handleEsc)
      .on("change", this.handleChange)
  }

  private stopListening() {
    this.dropdown.removeListener("select", this.handleSelect)
    this.editor
      .removeListener("up", this.handleUp)
      .removeListener("down", this.handleDown)
      .removeListener("enter", this.handleEnter)
      .removeListener("esc", this.handleEsc)
      .removeListener("change", this.handleChange)
  }

  private handleSelect(event: CustomEvent<{ searchResult: SearchResult }>) {
    this.emit("select", event)
    if (!event.defaultPrevented) {
      this.editor.applySearchResult(event.detail.searchResult)
    }
  }

  private handleUp(event: Event) {
    this.dropdown.up(event)
  }

  private handleDown(event: Event) {
    this.dropdown.down(event)
  }

  private handleEnter(event: Event) {
    const selected = this.dropdown.select()
    if (selected) {
      event.preventDefault()
    } else {
      this.hide()
    }
  }

  private handleEsc(event: Event) {
    if (this.dropdown.shown) {
      this.hide()
      event.preventDefault()
    }
  }

  private handleChange() {
    const before = this.editor.getBeforeCursor()
    if (before) {
      this.trigger(before)
    }
  }
}
