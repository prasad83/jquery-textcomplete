import { IQuery } from "./interface"
import { Textcomplete } from "./Textcomplete"
import { SearchResult } from "./SearchResult"
import { Strategy } from "./Strategy"

export class QueryExecutor {
  constructor(private core: Textcomplete) {}

  public run(text: string, strategies: Strategy[]) {
    const query = this.createQuery(text, strategies)
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
  private createQuery(text: string, strategies: Strategy[]): IQuery | null {
    for (const strategy of strategies) {
      const query = strategy.createQuery(text)
      if (query) {
        return query
      }
    }
    return null
  }

  private execute<T>(query: IQuery<T>): void {
    query.strategy.search(
      query.term,
      results => {
        this.handleQueryResults(results.map(result => new SearchResult(result, query)))
      },
      query.match
    )
  }

  private handleQueryResults<T>(searchResults: SearchResult<T>[]) {
    this.core.onHit(searchResults)
  }
}
