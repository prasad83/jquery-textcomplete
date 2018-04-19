import { EventEmitter } from "eventemitter3"

import { Strategy } from "./Strategy"
import { Query } from "./Query"
import { SearchResult } from "./SearchResult"

export class Engine extends EventEmitter {
  private strategies: Strategy[]

  constructor() {
    super()
    this.strategies = []
  }

  public register(strategies: Strategy[]) {
    this.strategies = this.strategies.concat(strategies)
  }

  public run(text: string) {
    const query = this.createQuery(text)
    if (query) {
      this.execute(query)
    } else {
      this.handleQueryResults([])
    }
  }

  /**
   * Create a query which contains a strategy matching to the given text.
   *
   * @param text head to cursor string.
   */
  private createQuery(text: string): Query | null {
    for (const strategy of this.strategies) {
      const query = strategy.createQuery(text)
      if (query) {
        return query
      }
    }
    return null
  }

  private execute<T>(query: Query<T>): void {
    query.strategy.search(
      query.term,
      results => {
        this.handleQueryResults(results.map(result => new SearchResult(result, query)))
      },
      query.match
    )
  }

  private handleQueryResults<T>(searchResults: SearchResult<T>[]) {
    this.emit("hit", { searchResults })
  }
}
