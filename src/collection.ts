export default class Collection<T> extends Array<T> {
  constructor(...values: T[]) {
    super(...values);
  }

  static fromArray<I extends any>(array: I[]): Collection<I> {
    return new this(...array);
  }
}
