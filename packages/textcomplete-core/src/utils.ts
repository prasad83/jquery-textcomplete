// tslint:disable-next-line:ban-types
export function isFunction(obj: any): obj is Function {
  return typeof obj === "function"
}

export function isString(obj: any): obj is string {
  return typeof obj === "string"
}
