import { EventEmitter } from "eventemitter3"

import { SearchResult } from "./SearchResult"
import { EditorCursorOffset } from "./Editor"
import { isFunction } from "./utils"

export interface DropdownOptions {
  className?: string
  footer?: ((results: any[]) => string) | string
  header?: ((results: any[]) => string) | string
  maxCount?: number
  placement?: "top" | "bottom"
  rotate?: boolean
  style?: Record<string, string>
  item?: {
    className?: string
  }
}

class DropdownRenderer {
  public el: HTMLUListElement

  private itemClassName: string
  private footer: (results: any[]) => string
  private header: (results: any[]) => string
  private placement: "top" | "bottom"

  constructor({ footer, header, style, item, placement }: DropdownOptions) {
    this.el = document.createElement("ul")
    this.footer = isFunction(footer) ? footer : () => footer || ""
    this.header = isFunction(header) ? header : () => header || ""
    this.itemClassName = (item && item.className) || "textcomplete-item"
    this.placement = placement || "bottom"
    this.initializeEl(style)
  }

  public destroy() {
    this.clear()
  }

  public render(searchResults: SearchResult[]): this {
    const rawResults = searchResults.map(searchResult => searchResult.data)

    const headerEl = this.el.firstChild as HTMLLIElement
    headerEl.innerHTML = this.header(rawResults)
    const footerEl = this.el.lastChild as HTMLLIElement
    footerEl.innerHTML = this.footer(rawResults)

    const fragment = document.createDocumentFragment()
    fragment.appendChild(headerEl)
    for (const searchResult of searchResults) {
      const li = document.createElement("li")
      li.className = this.itemClassName
      const a = document.createElement("a")
      a.innerHTML = searchResult.render()
      li.appendChild(a)
      fragment.appendChild(li)
    }
    fragment.appendChild(footerEl)

    this.clear()
    this.el.appendChild(fragment)

    const strategyId = searchResults[0] && searchResults[0].strategy.id
    if (strategyId) {
      this.el.setAttribute("data-strategy", strategyId)
    } else {
      this.el.removeAttribute("data-strategy")
    }
    return this
  }

  public setOffset(offset: EditorCursorOffset): this {
    const doc = document.documentElement
    if (doc) {
      const elementWidth = this.el.offsetWidth
      if (offset.left) {
        const browserWidth = doc.clientWidth
        if (offset.left + elementWidth > browserWidth) {
          offset.left = browserWidth - elementWidth
        }
        this.el.style.left = `${offset.left}px`
      } else if (offset.right) {
        if (offset.right - elementWidth < 0) {
          offset.right = 0
        }
        this.el.style.right = `${offset.right}px`
      }
      if (this.placement === "top") {
        this.el.style.bottom = `${doc.clientHeight - offset.top + offset.lineHeight}px`
      } else {
        this.el.style.top = `${offset.top}px`
      }
    }
    return this
  }

  public activate(next: number | null, prev: number | null) {
    if (next === prev) {
      return
    }
    if (next) {
      this.el.children[next + 1].classList.add("active")
    }
    if (prev) {
      this.el.children[prev + 1].classList.remove("active")
    }
  }

  private initializeEl(styleOption?: Record<string, string>): void {
    const style = {
      display: "none",
      posiiton: "absolute",
      zIndex: "1000",
      ...styleOption
    }
    Object.keys(style).forEach(name => ((this.el.style as any)[name] = (style as any)[name]))
    // Make sure that there are header and footer elements.
    for (const key of ["header", "footer"]) {
      const li = document.createElement("li")
      li.className = `textcomplete-${key}`
      this.el.appendChild(li)
    }
  }

  private clear() {
    while (this.el.lastChild) {
      this.el.removeChild(this.el.lastChild)
    }
  }
}

export class Dropdown extends EventEmitter {
  public shown: boolean
  public el: HTMLUListElement

  private activeIndex: number | null
  private searchResults: SearchResult[]
  private maxCount: number
  private renderer: DropdownRenderer
  private rotate: boolean

  constructor(public options: DropdownOptions) {
    super()

    this.activeIndex = null
    this.shown = false
    this.searchResults = []
    this.rotate = options.hasOwnProperty("rotate") ? options.rotate || true : true
    this.maxCount = options.maxCount || 10
    this.renderer = new DropdownRenderer(options)
    this.el = this.renderer.el

    this.handleClick = this.handleClick.bind(this)
    this.handleMouseover = this.handleMouseover.bind(this)

    this.startListening()
  }

  public destroy(): this {
    this.stopListening()
    this.renderer.destroy()
    this.searchResults = []
    return this
  }

  public deactivate() {
    this.hide()
  }

  public render<T>(searchResults: SearchResult<T>[], offset: EditorCursorOffset): this {
    if (searchResults.length) {
      const renderEvent = new CustomEvent("render", {
        cancelable: true
      })
      this.emit("render", renderEvent)
      if (renderEvent.defaultPrevented) {
        return this
      }
      this.searchResults = this.maxCount ? searchResults.slice(0, this.maxCount) : searchResults
      this.renderer.render(this.searchResults).setOffset(offset)
      this.emit("rendered", new CustomEvent("rendered"))
      this.show()
    } else {
      this.deactivate()
    }
    this.setActiveIndex(null)
    return this
  }

  public up(event: Event): this {
    if (this.shown) {
      if (this.activeIndex === 0) {
        if (this.rotate) {
          this.setActiveIndex(this.searchResults.length - 1)
        }
      } else if (this.activeIndex == null) {
        this.setActiveIndex(this.searchResults.length - 1)
      } else {
        this.setActiveIndex(this.activeIndex - 1)
      }
      event.preventDefault()
    }
    return this
  }

  public down(event: Event): this {
    if (this.shown) {
      if (this.activeIndex === this.searchResults.length - 1) {
        if (this.rotate) {
          this.setActiveIndex(0)
        }
      } else if (this.activeIndex == null) {
        this.setActiveIndex(0)
      } else {
        this.setActiveIndex(this.activeIndex + 1)
      }
      event.preventDefault()
    }
    return this
  }

  public select(index?: number): this {
    if (index == null) {
      if (this.activeIndex) {
        index = this.activeIndex
      } else {
        return this
      }
    }
    const detail = {
      searchResult: this.searchResults[index]
    }
    const selectEvent = new CustomEvent("select", {
      cancelable: true,
      detail
    })
    this.emit("select", selectEvent)
    if (selectEvent.defaultPrevented) {
      return this
    }
    // Textcomplete applies the search result to editor.
    this.emit("selected", new CustomEvent("selected", { detail }))
    this.deactivate()
    return this
  }

  private startListening() {
    this.el.addEventListener("mousedown", this.handleClick)
    this.el.addEventListener("mouseover", this.handleMouseover)
    this.el.addEventListener("touchstart", this.handleClick)
  }

  private stopListening() {
    this.el.removeEventListener("mousedown", this.handleClick)
    this.el.removeEventListener("mouseover", this.handleMouseover)
    this.el.removeEventListener("touchstart", this.handleClick)
  }

  private setActiveIndex(next: number | null) {
    const prev = this.activeIndex
    this.activeIndex = next
    if (next) {
      this.renderer.activate(next, prev)
    }
  }

  /** Show the element */
  private show(): this {
    if (!this.shown) {
      const showEvent = new CustomEvent("show", { cancelable: true })
      this.emit("show", showEvent)
      if (showEvent.defaultPrevented) {
        return this
      }
      this.el.style.display = "block"
      this.shown = true
      this.emit("shown", new CustomEvent("shown"))
    }
    return this
  }

  /** Hide the element */
  private hide(): this {
    if (this.shown) {
      const hideEvent = new CustomEvent("hide", { cancelable: true })
      this.emit("hide", hideEvent)
      if (hideEvent.defaultPrevented) {
        return this
      }
      this.el.style.display = "none"
      this.shown = false
      this.emit("hidden", new CustomEvent("hidden"))
    }
    return this
  }

  private handleClick(event: Event) {
    const index = this.getResultIndex(event.target as Element)
    if (index !== -1) {
      this.select(index)
    }
  }

  private handleMouseover(event: Event) {
    // Since this.handleMouseover() is added to this.el, we can assume that
    // target is a descendant of this.el element.
    const index = this.getResultIndex(event.target as Element)
    if (index !== -1) {
      this.setActiveIndex(index)
    }
  }

  /**
   * @param el a descendant of this.el element.
   * @return index of corresponding result. returns -1 if the el is a descendant of header or footer.
   */
  private getResultIndex(el: Element): number {
    while (el.parentElement !== this.el) {
      el = el.parentElement as Element
    }
    let index = 0
    // tslint:disable-next-line:no-conditional-assignment
    for (; (el = el.previousElementSibling as any); index++) {
      //
    }
    return index === this.el.childElementCount - 1 ? -1 : index - 1
  }
}
