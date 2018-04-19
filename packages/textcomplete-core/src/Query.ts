import { Strategy } from "./Strategy"

export interface Query<T = any> {
  match: RegExpMatchArray
  strategy: Strategy<T>
  term: string
}
