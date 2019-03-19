/**
 * Creates a new type with the types of `Target` object on every element in the `Source` array/tuple.
 * Avodis iteration of inherited properties of array. See: {@link https://github.com/Microsoft/TypeScript/issues/27995}
 * @example
 * type Person = { name: string, age: number };
 * type Expected = MapToValue<Person, ["name", "age"]>;  // [string, age]
 */
export type MapToValue<Target, Source extends (keyof Target)[]> = {
  [i in Exclude<keyof Source, keyof any[]>]: Source[i] extends keyof Target ? Target[Source[i]] : never
} & { length: Source["length"] } & any[];

/**
 * If Key is string, creates a new type with the type of `T` object on `Key`,
 * otherwise if key is an array, returns result of MapToValue.
 * @example
 * type Person = { name: string, age: number };
 * type ExpectedString = ValueOf<Person, "name">;  // string
 * type ExpectedArray = ValueOf<Person, ["name", "age"]>;  // [string, age]
 */
export type ValueOf<T, Key extends keyof T | (keyof T)[]> = Key extends (keyof T)[]
  ? MapToValue<T, Key>
  : Key extends keyof T
  ? T[Key]
  : never;

/**
 * From `T` remove a set of properties `Key`
 * @example
 * type Person = { name: string, age: number };
 * type Expected = Omit<Person, "name">; // { age: number }
 */
export type Omit<T, Key extends keyof T> = Pick<T, Exclude<keyof T, Key>>;

/**
 * From `T` pick a set of properties with value type of `ValueType`.
 * Credit: [Piotr Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c)
 * @example
 * type Person = { name: string, age: number };
 * type Expected = PickByValue<Person, string>; // { name: string }
 */
export type PickByValue<T, ValueType> = Pick<T, { [Key in keyof T]: T[Key] extends ValueType ? Key : never }[keyof T]>;

/**
 * From `T` remove a set of properties with value type of `ValueType`.
 * Credit: [Piotr Lewandowski](https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c)
 * @example
 * type Person = { name: string, age: number };
 * type Expected = OmitByValue<Person, string>; // { age: number }
 */
export type OmitByValue<T, ValueType> = Pick<T, { [Key in keyof T]: T[Key] extends ValueType ? never : Key }[keyof T]>;

/**
 * Utility type for `ReadonlyKeys`, `WritableKeys`
 */
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

/**
 * From  `T` pick a set of properties which are writeable.
 * Credit: [Matt McCutchen](https://stackoverflow.com/questions/52443276/how-to-exclude-getter-only-properties-from-type-in-typescript/52473108#52473108)
 * @example
 * class A {
 *   name: string;
 *   birthDate: Date
 *   get age() { ... }
 *   get fullName() { ... }
 * }
 * type Expected = WritableKeys<A>; // "name" | "birthDate"
 */
export type WritableKeys<T> = { [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T];

/**
 * From  `T` pick a set of properties which are readonly.
 * Credit: [Matt McCutchen](https://stackoverflow.com/questions/52443276/how-to-exclude-getter-only-properties-from-type-in-typescript/52473108#52473108)
 * @example
 * class A {
 *   name: string;
 *   birthDate: Date
 *   get age() { ... }
 *   get fullName() { ... }
 * }
 * type Expected = WritableKeys<A>; // "age" | "fullname"
 */
// export type ReadonlyKeys<T> = { [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P> }[keyof T];
export type ReadonlyKeys<T> = { [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P> }[keyof T];

/**
 * Constructor which creates a new `T` instance.
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * From type `T` create a new type, but array fields are converted to their base type.
 * @example
 * type Base = BaseTypes<{ name: string, option: string[] }>; // { name: string, option: string }
 */
export type BaseArray<T> = { [K in keyof T]: T[K] extends (infer Base)[] ? Base : T[K] };
