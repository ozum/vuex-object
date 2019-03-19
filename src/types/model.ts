import Model from "../model";
import Query from "../query";
import Relation from "../relation";
import { BaseArray, Constructor, Omit, OmitByValue, PickByValue, ValueOf } from "./index";

/*****/
// export type Instance<T extends Model | typeof Model> = T extends typeof Model ? InstanceType<T> : T extends Model ? T : never;
export type Items<M extends Model> = Item<M>[];

export interface ItemIndex<M extends Model> {
  [key: string]: Item<M>;
}

export type SubModels<M extends Model> = SubModel<M>[];
export interface SubModelIndex<M extends Model> {
  [key: string]: M;
}

/*****/

// TODO: (Investigate) For some reason, I need to surround some definitions with Extract<>. See: https://github.com/Microsoft/TypeScript/issues/29677

export type StoreType = "objectCollection" | "arrayCollection" | "singleItem";

export type Item<M extends Model> = Omit<M, keyof Model>;

export type SubModel<M extends Model> = OmitByValue<Item<M>, Function>; // tslint:disable-line:ban-types Function field names of given class.

// export type Item<M extends Model, SM = SubModel<M>> = Omit<SM, ReadonlyKeys<SM>>; // FULL VERSION: export type Item<M extends Model> = OmitType<Omit<M, keyof Model | ReadonlyKeys<M>>, Function>; // tslint:disable-line:ban-types Function field names of given class.export type Item<M extends Model> = OmitType<Omit<M, keyof Model | ReadonlyKeys<M>>, Function>; // tslint:disable-line:ban-types Function field names of given class.

export type ManyKeyableFields<M extends Model> = PickByValue<Item<M>, (string | number | (string | number)[])[]>;
export type KeyableFields<M extends Model> = PickByValue<Item<M>, string | number>;
export type SingleRelationFields<M extends Model> = PickByValue<Item<M>, Model>;
export type ManyRelationFields<M extends Model> = PickByValue<Item<M>, Model[]>;
export type RelationFields<M extends Model> = SingleRelationFields<M> & ManyRelationFields<M>;
export type NumberFields<M extends Model> = PickByValue<Item<M>, number>;

/**
 * Extract class properites of `M` whose types are based on model class. Convert arrays to non array type.
 * @example
 * Class A extends Model {
 *   name: string;
 *   options: Option[];
 *   color: Color;
 * }
 *
 * type expected = BaseModelFields<A>; // { options: Option, color: Color }
 */
export type BaseModelFields<M extends Model, RF extends BaseArray<RelationFields<M>> = BaseArray<RelationFields<M>>> = {
  [K in keyof RF]: RF[K] extends Model ? RF[K] : never
};

// export type BaseModelFields0<M extends Model, RF extends RelationFields<M> = RelationFields<M>> = {
//   [F in keyof RF]: Extract<RF[F] extends M[] ? RF[F][0] : RF[F] extends M ? RF[F] : never, M>
// };

export type RelationQueries<M extends Model> = { [F in keyof RelationFields<M>]: Query<BaseModelFields<M>[F]> };

export type KeyableFieldName<M extends Model> = keyof KeyableFields<M>;
export type KeyableFieldNames<M extends Model> = KeyableFieldName<M> | KeyableFieldName<M>[];
export type ManyKeyableFieldName<M extends Model> = keyof ManyKeyableFields<M>;
export type SingleRelationFieldName<M extends Model> = keyof SingleRelationFields<M>;
export type ManyRelationFieldName<M extends Model> = keyof ManyRelationFields<M>;
export type RelationFieldName<M extends Model> = keyof RelationFields<M>;

export interface RelatedItemIndex<M extends Model> {
  [key: string]: ItemIndex<M>;
}

export interface ModelIndex<M extends Model> {
  [key: string]: M;
}

export interface PositionIndex<M extends Model> {
  [key: string]: number;
}

// export type RelationQueries2<SM extends Model, TM extends Model> = { [Key in keyof RelationFields<SM>]?: Query<TMC> };

// --------

// export type PKValue<M extends Model> = string | string[] | number | number[] | M | M[] | Array<string | number> | Array<Array<string | number>>;

export type PKValue = string | number | (string | number)[];

// export type PKValues<M extends Model> = string | string[] | number | number[] | M | M[] | Array<string | number> | Array<Array<string | number>>;

// export interface StoreGetters<M extends Model> {
//   index: (state: any) => ItemIndex<M>; // Get items by PK.
//   position?: (state: any) => PositionIndex<M>; // get position of the item in array
//   hasMany?: (state: any) => { [F in keyof ManyRelationFields<M>]?: { [PK: string]: M[F] extends Model[] ? ItemIndex<M[F][0]> : never } };
//   hasManyOf?: (
//     state: any
//   ) => { [F in keyof ManyRelationFields<M>]?: (values: PKValue<M>) => { [PK: string]: M[F] extends Model[] ? ItemIndex<M[F][0]> : never } };
// }

export type RelatedData<M extends Model, RF extends RelationFields<M> = RelationFields<M>> = { [F in keyof RF]: any };

export interface FieldDefinition {
  type: Relation<any, any> | string;
}

/**
 * Given type or a function which takes model instance or item and returns given type.
 */
export type ValOrFunc<M extends Model, T> = ((record: M) => T) | T;

/**
 * Function which takes model instance or item and returns boolean.
 */
export type Predicate<M extends Model> = (record: M | Item<M>) => boolean;

export type FieldName<T> = keyof T | [keyof T] | [keyof T, keyof T] | [keyof T, keyof T, keyof T] | [keyof T, keyof T, keyof T, keyof T];

/**
 * Function or value types. Those types are either given type or a function which returns given type.
 * @example
 * FieldValue<M, "name">;                 // string                                     or (item) => string
 * FieldValue<M, ["name", "age]">;        // [string, number]                           or (item) => [string, number]
 * FieldDoubleValue<M, "age">             // [number, number]                           or (item) => [number, number]
 * FieldDoubleValue<M, ["age", "option">  // [[number, string], [number, string], ...]  or (item) => [[number, string], [number, string], ...]
 * FieldValues<M, "option">               // [string, string, string, ...]              or (item) => [string, string, string, ...]
 * FieldValues<M, ["name", "age"]>        // [[string, number], [string, number], ...]  or (item) => [[string, number], [string, number], ...]
 */
//export type FieldValue<M extends Model, F extends FieldName<SubModel<M>>> = ValOrFunc<M, ValueOf<SubModel<M>, F>>;
export type FieldValue<M extends Model, F extends FieldName<SubModel<M>>> = ValOrFunc<M, ValueOf<M, F>>;
export type FieldDoubleValue<M extends Model, F extends FieldName<SubModel<M>>> = ValOrFunc<
  M,
  [ValueOf<SubModel<M>, F>, ValueOf<SubModel<M>, F>]
>;
export type FieldValues<M extends Model, F extends FieldName<SubModel<M>>> = ValOrFunc<M, ValueOf<M, F>[]>;

export type ModelConstructor<M> = Constructor<M> & typeof Model;
export type ModelOrGetter<M> = ModelConstructor<M> | (() => ModelConstructor<M>);
