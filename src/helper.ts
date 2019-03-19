import Model from "./model";
import { isArrayOfArrays, isItemOrModel, isModelConstructor } from "./type-guards";
import { Item, KeyableFieldName, KeyableFieldNames, ManyKeyableFieldName, ModelConstructor, ModelOrGetter, PKValue } from "./types";

/**
 * Returns keys of object as an array using `Object.keys()` with type definitions for TypeScript.
 * Please note `Object.keys()` does not guarentee that keys of object are in compliance with all keys of the object.
 * This is a workaround and it's in developer's responsibility that type is in compliance. In summary this is a
 * shorthand for `Object.keys(o) as (keyof O)[]`.
 * @see https://github.com/Microsoft/TypeScript/pull/12253
 * @param   {Object} object                 - Object to return keys of.
 * @returns {Array<String|Numbe|Symbol>}    - Keys of object.
 */
export function typedKeys<T>(object: T): (keyof T)[] {
  return Object.keys(object) as (keyof T)[];
}

/**
 * Similar to `typedKeys()` function returns result of `Object.entries()` whose type safety responsibility belongs to developer.
 * @param {Object} object                       - Object to return entries for.
 * @returns {Array<[String|Number|Symbol, *]>}  - Key value tuples of the object as `[[key, value], [keyi value], ...]`
 */
export function typedEntries<T>(object: T): [keyof T, T[keyof T]][] {
  return Object.entries(object) as [keyof T, T[keyof T]][];
}

/**
 * Returns given string as first letter capitalized.
 * @param   {string} input  - String to capitalize first letter.
 * @returns {string}        - First letter capitalized string.
 */
// export function ucFirst(input: string): string {
//   return input.charAt(0).toUpperCase() + input.slice(1);
// }

/**
 * Returns given value after converitng it to an array. If value is already an aarry, returns it.
 * Otherwise returns it as a single element array.
 * @param   {input} - Data to covert to array.
 * @returns {Array} - Data after converted to array.
 */
export function arrify<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

/**
 * Does shallow comparison for two arrays and returns whether they are equal.
 * @param   {Array}   a - Array to compare.
 * @param   {Array}   b - Array to compare.
 * @returns {boolean}   - Whther arrays are equal.
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length || a == null || b == null) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Compares whether candiate array is in given arrays. (equal one of the given arrays)
 * @param {Array}         candidate   - Candidate array to compare against given arrays.
 * @param {Array<Array>}  arrays      - Arrays to look for equality to candidate.
 * @param {Boolean}                   - Whether candidate is in arrays.
 * @example
 * arrayIn([1, 2], [[1, 2], [3, 4]]); // true
 * arrayIn([1, 2], [[0, 1], [3, 4]]); // false
 */
export function arrayIn<T>(candidate: T[], arrays: T[][]): boolean {
  for (const array of arrays) {
    if (arraysEqual(candidate, array)) {
      return true;
    }
  }
  return false;
}

/**
 * Filter for objects. Creates an object composed of the object properties predicate returns truthy for. The predicate is invoked with two arguments: (value, key).
 * @param   {Object}    object	    - Object to filter.
 * @param   {Function}  callback	  - Callback function to predicate. Passed `value`, `key` and `object`.
 * @returns	{Boolean}               - Whether to pick value in created object.
 * @example
 * pickBy({ a: 1, b: 2}, (value, key, obj) => value > 1); // { b:2 }
 */
export function pickBy<T extends { [key: string]: any }>(
  object: T,
  callback: <K extends keyof T>(value: T[K], key: K, object: T) => boolean,
): T {
  const result = {} as T;
  Object.entries(object).forEach(([key, value]) => {
    if (callback(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

/**
 * Accept a Class or a getter function which returns a Class to avoid circular import of modules. Assigns it to given object's requested property.
 * @param   {Object}            targetInstance	- Instance object to assign given getter of class.
 * @param   {String}            propertyName	  - Property name to assign.
 * @param   {Function|Object}   classOrGetter	  - Class or a getter function.
 * @returns {void}
 */
export function assignGetterOrClass<T, C>(targetInstance: T, propertyName: keyof T, classOrGetter: ModelOrGetter<C>): void {
  const descriptor = isModelConstructor(classOrGetter) ? { value: classOrGetter } : ({ get: classOrGetter } as PropertyDescriptor);
  Object.defineProperty(targetInstance, propertyName, descriptor);
}

/**
 * Creates and returns a new object by mapping each element of given array into `[key, value]` pairs.
 * @param   {Array<*>}  data              - Array to map to object.
 * @param   {Function}  mapFunction       - Callback function which should return `[key, value]` pairs.
 * @param   {Function}  [filterFunction]  - If provided, only true returning items are added returned object.
 * @returns {Object}                      - Mapped object.
 */
export function mapToObject<T extends any, N extends any>(
  data: T[],
  mapFunction: (item: T, i: number, array: T[]) => [string, N],
  filterFunction?: (item: T, i: number, array: T[]) => boolean,
): { [key: string]: N } {
  const result: { [key: string]: N } = {} as { [key: string]: N };
  data.forEach((item, i, array) => {
    if (!filterFunction || filterFunction(item, i, array)) {
      const [key, newItem] = mapFunction(item, i, array);
      result[key] = newItem;
    }
  });
  return result;
}

/**
 * Creates and returns a new object by mapping each `[key, value]` pairs of given object into new `[key, value]` pairs.
 * @param   {Object}    data        - Object to map to new object.
 * @param   {Function}  mapFunction - Callback function which should return `[key, value]` pairs.
 * @returns {Object}                - Mapped object.
 */
export function mapObject<T extends any, N extends any>(
  data: { [key: string]: T },
  mapFunction: (key: string, value: T, object: { [key: string]: T }) => [string, N],
): { [key: string]: N } {
  const result: { [key: string]: N } = {} as { [key: string]: N };

  Object.entries(data).forEach(([key, item]) => {
    const [newKey, newItem] = mapFunction(key, item, data);
    result[newKey] = newItem;
  });
  return result;
}

/**
 * Builds and return single or multiple keys using given fields and key stringify function.
 * @param   {String|String[]}   keyFieldName  - Single or composite (multiple) key field names.
 * @param   {Function}          keyFunction   - Key function to convert multiple key fields into string key.
 * @param   {*}                 value         - Item, model or key.
 * @returns {String}
 */
export function getKey<T extends Model>(keyFieldName: KeyableFieldNames<T>, keyFunction: (value: any) => string, value: any): string {
  if (!Array.isArray(keyFieldName)) {
    return typeof value === "object" ? value[keyFieldName] : value; // Single field key.
  } else if (isItemOrModel(value)) {
    value = keyFieldName.map(fieldName => value[fieldName]); // Composite key and value is item
  }

  return keyFunction(value);
}

/**
 * Returns foreign key value of item which references given model `PKModel`
 * @param {Item|Item[]|string|number|Array<string|number>|Array<Array<string|number>>}  itemOrValue   - Single itme or one or multiple foreign key values.
 * @param {Model}                                                                       PKModelClass  - Model class which is referenced by foreign key.
 * @param {string}                                                                      fkFieldName   - Field name or names which holds foreign key value or values.
 * @example
 * getForeignKey([[1,2], [9,10]], ModelWithCompositePK, "itemIds"); // Returns array of fk strings.
 * getForeignKey(someItem, ModelWithCompositePK, "itemIds"); // Returns array of fk strings.
 */

export function getForeignKey<PM extends Model, FM extends Model>( // PM: Primary Key Model, FM: Foreign Key Model
  itemOrValue: PKValue | FM | Item<FM>,
  PKModelClass: ModelConstructor<PM>,
  fkFieldName?: KeyableFieldNames<FM>,
): string;
export function getForeignKey<PM extends Model, FM extends Model>( // PM: Primary Key Model, FM: Foreign Key Model
  itemOrValue: PKValue | PKValue[] | FM | Item<FM>,
  PKModelClass: ModelConstructor<PM>,
  fkFieldName?: KeyableFieldNames<FM> | ManyKeyableFieldName<FM>,
): string | string[];
export function getForeignKey<PM extends Model, FM extends Model>( // PM: Primary Key Model, FM: Foreign Key Model
  itemOrValue: PKValue | PKValue[] | FM | Item<FM>,
  PKModelClass: ModelConstructor<PM>,
  fkFieldName?: KeyableFieldNames<FM> | ManyKeyableFieldName<FM>,
): string | string[] {
  const pkFieldName = PKModelClass._getKeyField();
  const isMultiPKField = Array.isArray(pkFieldName);
  const isMultiFKField = Array.isArray(fkFieldName);
  const keyFunction = PKModelClass.keyFunction;
  let isMultipleItems = false;
  let FKValue;

  if (isItemOrModel(itemOrValue)) {
    const item = itemOrValue as FM | Item<FM>;
    if (isMultiPKField) {
      if (isMultiFKField) {
        FKValue = (fkFieldName as KeyableFieldName<FM>[]).map(name => item[name]); // Single item composite key in multiple fields.
      } else {
        FKValue = item[fkFieldName as KeyableFieldName<FM>]; // Single item [1,9] or multiple items  [[1,9], [10,23]], composite key in single field.
        isMultipleItems = isArrayOfArrays(FKValue);
      }
    } else {
      FKValue = item[fkFieldName as KeyableFieldName<FM> | ManyKeyableFieldName<FM>]; // Single item '7' or multiple items [1,12], simple key in single field.
      isMultipleItems = Array.isArray(FKValue);
    }
  } else {
    FKValue = itemOrValue; // as string | number | Array<string | number>;
    isMultipleItems = isMultiPKField ? isArrayOfArrays(FKValue) : Array.isArray(FKValue);
  }

  return isMultipleItems ? (FKValue as any[]).map(value => keyFunction(value)) : keyFunction(FKValue);
}
