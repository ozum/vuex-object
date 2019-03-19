import { arrayIn, typedEntries } from "./helper";
import Model from "./model";
import {
  BetweenFilter,
  Filter,
  FilterType,
  GroupFilter,
  InFilter,
  Item,
  ObjectFilter,
  OperatorFilter,
  PredicateFilter,
  SingleFieldStaticInFilter,
} from "./types";

function isSingleFieldStaticInFilter<M extends Model>(
  condition: InFilter<M> | SingleFieldStaticInFilter<M>,
): condition is SingleFieldStaticInFilter<M> {
  return condition.value instanceof Set;
}

function isValueFunction<M extends Model, T>(v: any): v is (record: M | Item<M>) => T {
  return typeof v === "function";
}

function getValue<M extends Model, C extends Filter<M>>(item: M | Item<M>, condition: C): any {
  return isValueFunction(condition.value) ? condition.value(item) : condition.value;
}

function compareIn<M extends Model>(item: M | Item<M>, condition: InFilter<M> | SingleFieldStaticInFilter<M>): boolean {
  if (isSingleFieldStaticInFilter(condition)) {
    const itemValue = item[condition.property];
    return condition.value.has(itemValue as any);
  }

  const value = getValue(item, condition);
  return Array.isArray(condition.property)
    ? arrayIn(condition.property.map(property => item[property]), value)
    : value.includes(item[condition.property]);
}

function compareBetween<M extends Model>(item: M | Item<M>, condition: BetweenFilter<M>): boolean {
  const value = getValue(item, condition);
  return Array.isArray(condition.property)
    ? condition.property.reduce((result, property, i) => result && item[property] >= value[i][0] && item[property] <= value[i][1], true)
    : item[condition.property] >= value[0] && item[condition.property] <= value[1];
}

const comparisonFunctions = {
  "=": (a: any, b: any) => a === b,
  "<>": (a: any, b: any) => a !== b,
  "<": (a: any, b: any) => a < b,
  ">": (a: any, b: any) => a > b,
  "<=": (a: any, b: any) => a <= b,
  ">=": (a: any, b: any) => a >= b,
};

function operatorComparator(
  operator: keyof typeof comparisonFunctions,
): <M extends Model>(item: M | Item<M>, condition: OperatorFilter<M>) => boolean {
  return <M extends Model>(item: M | Item<M>, condition: OperatorFilter<M>): boolean => {
    const value = getValue(item, condition);
    const compare = comparisonFunctions[operator];

    return Array.isArray(condition.property)
      ? condition.property.reduce((result, property, i) => result && compare(item[property], value[i]), true)
      : compare(item[condition.property], value);
  };
}

const filterFunctions: { [Key in FilterType]: any } = {
  "=": operatorComparator("="),
  "<>": operatorComparator("<>"),
  "<": operatorComparator("<"),
  ">": operatorComparator(">"),
  "<=": operatorComparator("<="),
  ">=": operatorComparator(">="),
  between: compareBetween,
  in: compareIn,
  object: <M extends Model>(item: M | Item<M>, condition: ObjectFilter<M>) =>
    typedEntries(condition.value).every(([key, value]) => item[key] === value),
  predicate: <M extends Model>(item: M | Item<M>, condition: PredicateFilter<M>) => condition.value(item),
  // group: <SubModel>(item: SubModel, condition: GroupFilter<SubModel, keyof SubModel>) => filter(item, condition.value),
  group: <M extends Model>(item: M | Item<M>, condition: GroupFilter<M>) => filter(item, condition.value), // eslint-disable-line @typescript-eslint/no-use-before-define
};

// export default function filter<M extends Model, I extends Item<M> | SubModel<M>>(item: I, conditions: Array<Filter<I, FieldName<I>>> = []) {
export default function filter<M extends Model>(item: M | Item<M>, conditions: Filter<M>[] = []): boolean {
  let predicate: boolean | undefined; // = conditions[0] && conditions[0].conjunction === "or" ? false : true;

  conditions.forEach(condition => {
    let currentPredicate = filterFunctions[condition.type](item, condition);
    currentPredicate = condition.not ? !currentPredicate : currentPredicate;

    if (predicate === undefined) {
      predicate = currentPredicate;
    } else if (condition.conjunction === "and") {
      predicate = predicate && currentPredicate;
    } else if (condition.conjunction === "or") {
      predicate = predicate || currentPredicate;
    }
  });

  return predicate === undefined ? true : predicate;
}
