import { Query } from "./Query"
import { isFunction, isString } from "./utils"

const DEFAULT_INDEX = 2

export interface StrategyProps<T = any> {
  match: RegExp | ((text: string) => RegExpMatchArray | null)
  search: (term: string, callback: SearchCallback<T>, match: RegExpMatchArray) => void
  replace: ((data: T) => string[] | string | null)
  cache?: boolean
  context?: (text: string) => string | boolean | null | undefined
  template?: (data: T, term?: string) => string
  index?: number
  id?: string
}

export type SearchCallback<T> = (results: T[]) => void

export class Strategy<T = any> {
  public id: StrategyProps<T>["id"]
  public template: StrategyProps<T>["template"]

  private props: StrategyProps<T>
  private cache: Record<string, T[]>

  constructor(props: StrategyProps<T>) {
    this.props = props
    this.cache = {}
    this.id = props.id
    this.template = props.template
  }

  public destroy(): this {
    this.cache = {}
    return this
  }

  public search(term: string, callback: SearchCallback<T>, match: RegExpMatchArray): void {
    if (this.props.cache) {
      this.searchWithCache(term, callback, match)
    } else {
      this.props.search(term, callback, match)
    }
  }

  public replace(data: T) {
    return this.props.replace(data)
  }

  public createQuery(text: string): Query | null {
    if (isFunction(this.props.context)) {
      const context = this.props.context(text)
      if (isString(context)) {
        text = context
      } else if (!context) {
        // Deprecated. Should unregister the strategy instead of falsy context.
        return null
      }
    }
    const match = this.match(text)
    if (match) {
      return {
        match,
        strategy: this,
        term: match[this.props.index || DEFAULT_INDEX]
      }
    }
    return null
  }

  public match(text: string): RegExpMatchArray | null {
    if (isFunction(this.props.match)) {
      return this.props.match(text)
    } else {
      return text.match(this.props.match)
    }
  }

  private searchWithCache(term: string, callback: SearchCallback<T>, match: RegExpMatchArray): void {
    if (this.cache[term]) {
      callback(this.cache[term])
    } else {
      this.props.search(
        term,
        results => {
          this.cache[term] = results
          callback(results)
        },
        match
      )
    }
  }
}
