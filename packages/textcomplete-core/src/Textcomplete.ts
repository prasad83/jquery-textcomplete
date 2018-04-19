import { EventEmitter } from "eventemitter3"

import { Dropdown, DropdownOptions } from "./Dropdown"
import { Editor, CHANGE, UP, DOWN, ENTER, ESC } from "./Editor"
import { Engine } from "./Engine"
import { Strategy } from "./Strategy"
import { SearchResult } from "./SearchResult"

export interface TextcompleteOptions {
  dropdown?: DropdownOptions
}

export class Textcomplete extends EventEmitter {
  private dropdown: Dropdown
  private engine: Engine

  constructor(private editor: Editor, options: TextcompleteOptions) {
    super()
    this.dropdown = new Dropdown(options.dropdown || {})
    this.engine = new Engine()

    document.body.appendChild(this.dropdown.el)

    this.startListening()
  }

  public destroy() {
    this.dropdown.destroy()
    this.editor.destroy()
    this.stopListening()
    return this
  }

  public hide() {
    this.dropdown.deactivate()
    return this
  }

  public register(strategies: Strategy[]) {
    this.engine.register(strategies)
    return this
  }

  public trigger(text: string) {
    this.engine.run(text)
    return this
  }

  private startListening() {
    this.engine.on("hit", this.handleHit, this)
    this.dropdown.on("select", this.handleSelect, this)
    ;["show", "shown", "render", "rendered", "selected", "hidden", "hide"].forEach(eventName =>
      this.dropdown.on(eventName, (event: CustomEvent) => this.emit(eventName, event))
    )
    this.editor
      .on(UP, this.handleUp, this)
      .on(DOWN, this.handleDown, this)
      .on(ENTER, this.handleEnter, this)
      .on(ESC, this.handleEsc, this)
      .on(CHANGE, this.handleChange, this)
  }

  private stopListening() {
    this.dropdown.removeAllListeners()
    this.engine.removeAllListeners()
    this.editor
      .removeListener(UP, this.handleUp, this)
      .removeListener(DOWN, this.handleDown, this)
      .removeListener(ENTER, this.handleEnter, this)
      .removeListener(ESC, this.handleEsc, this)
      .removeListener(CHANGE, this.handleChange, this)
  }

  private handleHit({ results }: { results: SearchResult[] }) {
    const cursorOffset = this.editor.getCursorOffset()
    if (cursorOffset) {
      this.dropdown.render(results, cursorOffset)
    }
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
