import Model from "../model";
import { FieldDoubleValue, FieldName, FieldValue, FieldValues, Predicate, SubModel } from "./index";

// Types to be used in whereConditions
export type FilterOperator = "=" | "<>" | "<" | ">" | "<=" | ">=";
export type FilterOperatorExtended = "in" | "between";
export type FilterType = FilterOperator | FilterOperatorExtended | "group" | "object" | "predicate";

interface BaseFilter<M extends Model, F extends any> {
  not: boolean;
  conjunction: "and" | "or";
  property: F;
}

export interface OperatorFilter<M extends Model, F extends FieldName<SubModel<M>> = FieldName<SubModel<M>>> extends BaseFilter<M, F> {
  type: FilterOperator;
  value: FieldValue<M, F>;
}

// export interface SingleFieldOperatorFilter<M extends Model, F extends SingleFieldName<SubModel<M>> = SingleFieldName<SubModel<M>>> extends BaseFilter<M, F> {
//   value: FieldValue<M, F>;
// }

// export interface MultipleFieldOperatorFilter<M extends Model, F extends MultipleFieldName<SubModel<M>> = MultipleFieldName<SubModel<M>>>
//   extends BaseFilter<M, F> {
//   value: FieldValue<M, F>;
// }

export interface BetweenFilter<M extends Model, F extends FieldName<SubModel<M>> = FieldName<SubModel<M>>> {
  not: boolean;
  conjunction: "and" | "or";
  type: "between";
  property: F;
  value: FieldDoubleValue<M, F>;
}

export interface InFilter<M extends Model, F extends FieldName<SubModel<M>> = FieldName<SubModel<M>>> {
  not: boolean;
  conjunction: "and" | "or";
  type: "in";
  property: F;
  value: FieldValues<M, F>;
}

export interface SingleFieldStaticInFilter<M extends Model, F extends keyof SubModel<M> = keyof SubModel<M>> {
  not: boolean;
  conjunction: "and" | "or";
  type: "in";
  property: F;
  value: Set<SubModel<M>[F]>;
}

// export interface SingleFieldInFilter<M extends Model, F extends keyof SubModel<M> = keyof SubModel<M>> {
//   not: boolean;
//   conjunction: "and" | "or";
//   type: "in";
//   property: F;
//   value: Set<SubModel<M>[F]>;
// }

// export interface MultiFieldInFilter<M extends Model, F extends Array<keyof SubModel<M>> = Array<keyof SubModel<M>>> {
//   not: boolean;
//   conjunction: "and" | "or";
//   type: "in";
//   property: F;
//   value: FieldValues<M, F>;
// }

// export type InFilter<M extends Model, F extends keyof M | Array<keyof SubModel<M>> = FieldName<SubModel<M>>> = F extends keyof M
//   ? SingleFieldInFilter<M>
//   : F extends Array<keyof M>
//   ? MultiFieldInFilter<M, F>
//   : never;

export interface ObjectFilter<M extends Model> {
  not: boolean;
  conjunction: "and" | "or";
  type: "object";
  property?: undefined;
  value: Partial<SubModel<M>>;
}

export interface GroupFilter<M extends Model> {
  not: boolean;
  conjunction: "and" | "or";
  type: "group";
  property?: undefined;
  value: Filter<M>[];
}

export interface PredicateFilter<M extends Model> {
  not: boolean;
  conjunction: "and" | "or";
  type: "predicate";
  property?: undefined;
  value: Predicate<M>;
}

// export type Filter<Data, Key extends keyof Data> = OperatorFilter<Data, Key> | ObjectFilter<Data> | GroupFilter<Data, Key> | InFilter<Data, Key>;

// export type Filter<M extends Model, F extends FieldName<SubModel<M>> = FieldName<SubModel<M>>> =
export type Filter<M extends Model> =
  | OperatorFilter<M>
  | BetweenFilter<M>
  | ObjectFilter<M>
  | GroupFilter<M>
  | InFilter<M>
  | SingleFieldStaticInFilter<M>
  | PredicateFilter<M>;
