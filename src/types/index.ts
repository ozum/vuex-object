export * from "./model";
export * from "./filter";
export * from "./utility";

/**
 * Type which represents an instance of given type. (IMPORTANT: This is a looser version of builtin InstanceType<T>)
 * @example
 * static method<T extends typeof Model>(this: T): Items<InstanceOf<T>> {}
 * method<T extends Model>(this: T): Items<T> {}
 */
// export type InstanceOf<Base> = Base extends new (...args: any[]) => infer R ? R : any;

// // Type union of values of given type: type A = { a: string, b: number }; type B = ValueOf<A>; // string | number
// export type ValueOf<T> = T[keyof T];

// export type Get<T> = () => T;
