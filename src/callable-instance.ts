class CallableInstanceInterface extends Function {}

function CallableInstance(this: any, property: any): () => any {
  const func = this.constructor.prototype[property];
  function apply(): any {
    return func.apply(apply, arguments);
  }
  Object.setPrototypeOf(apply, this.constructor.prototype);
  Object.getOwnPropertyNames(func).forEach(p => {
    Object.defineProperty(apply, p, Object.getOwnPropertyDescriptor(func, p)!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
  });
  return apply;
}
CallableInstance.prototype = Object.create(Function.prototype);

export default (CallableInstance as unknown) as typeof CallableInstanceInterface;
