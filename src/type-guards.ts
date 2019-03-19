import Model from "./model";
// import HasManyRelation from "./relation/has-many"; // CIRCULAR
import { Item, ItemIndex, ModelConstructor, ModelIndex, ModelOrGetter, PKValue } from "./types";

export function isModelIndex<M extends Model>(value: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): value is ModelIndex<M> {
  const values = Object.values(value);
  return !Array.isArray(value) && values && values[0] instanceof Model;
}

export function isModelArray<M extends Model>(value: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): value is M[] {
  return Array.isArray(value) && value[0] instanceof Model;
}

export function isModel<M extends Model>(value: M | Item<M>): value is M {
  return value instanceof Model;
}

// export function isSingleModelOrItem<MC extends typeof Model, M extends InstanceType<MC>>(ModelClass: MC, value: any): value is Item<M> | M {
//   if (!value || Array.isArray(value)) {
//     return false;
//   }

//   return ModelClass._key(value) !== undefined;
// }

export function isItemOrModel<M extends Model>(value: PKValue | PKValue[] | M | Item<M>): value is M | Item<M> {
  return typeof value === "object" && !Array.isArray(value);
}

/**
 * Returns true if given value is a model constructor.
 */
export function isModelConstructor<T>(value: ModelOrGetter<T>): value is ModelConstructor<T> {
  return !!value.prototype && !!value.prototype.constructor.name;
}

/**
 * Returns whether given value is array of arrays.
 */
export function isArrayOfArrays(value: any): value is any[][] {
  return Array.isArray(value) && Array.isArray(value[0]);
}

/**
 * Type safety check for whether given entry/tuple is an `HasMany` relation.
 * @param   {Array}   tuple     - Tuple/entry (result of `Object.entries`) to check.
 * @param   {String}  tuple.0	  - Name of the relation
 * @param   {Any}     tuple.1	  - Possible value to check whether it is `HasMany`
 * @returns {Boolean}           - Whether given entry is an `HasMany` tuple.
 */
// export function isHasMany<SMC extends typeof Model, TMC extends typeof Model>(
//   tuple: [keyof ManyRelationFields<InstanceType<TMC>>, HasMany<SMC, TMC>] | any
// ): tuple is [keyof ManyRelationFields<InstanceType<TMC>>, HasMany<SMC, TMC>] {
//   const [name, field] = tuple;
//   return field instanceof HasMany;
// }
