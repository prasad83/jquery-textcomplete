import { Query } from "./Query"
import { Strategy } from "./Strategy"

export class SearchResult<T = any> {
  public strategy: Strategy

  private term: string

  constructor(public data: T, query: Query<T>) {
    this.term = query.term
    this.strategy = query.strategy
  }

  public replace(beforeCursor: string, afterCursor: string): [string, string] | null {
    let replacement = this.strategy.replace(this.data)
    if (replacement !== null) {
      if (Array.isArray(replacement)) {
        afterCursor = replacement[1] + afterCursor
        replacement = replacement[0]
      }
      const match = this.strategy.match(beforeCursor)
      if (match) {
        replacement = replacement.replace(/\$&/g, match[0]).replace(/\$(\d)/g, (_, p1) => match[parseInt(p1, 10)])
        return [
          [beforeCursor.slice(0, match.index), replacement, beforeCursor.slice(match.index! + match[0].length)].join(
            ""
          ),
          afterCursor
        ]
      }
    }
    return null
  }

  public render(): string {
    return this.strategy.template ? this.strategy.template(this.data, this.term) : (this.data as any)
  }
}
