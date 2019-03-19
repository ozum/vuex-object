import fm from "fast-memoize";

function newFunction(name: string, fn: () => any): any {
  return function(this: any, ...args: any[]) {
    const bound = fn.bind(this);
    const value = ((fm as unknown) as (...args: any[]) => (...args: any[]) => any)(bound);
    // const value = fm(bound);
    Object.defineProperty(this, name, { value });
    return value(...args);
  };
}

function newGetter(name: string, fn: () => any): any {
  return function(this: any) {
    const value = fn.apply(this);
    Object.defineProperty(this, name, { value });
    return value;
  };
}

export default function Memoize(target: {}, propertyKey: string, descriptor: PropertyDescriptor): void {
  const value = descriptor.value;
  if (typeof value === "function") {
    descriptor.value = newFunction(propertyKey, value as () => any);
    return;
  }
  const get = descriptor.get;
  if (get != null) {
    descriptor.get = newGetter(propertyKey, get);
  }
}
