import isEqual from "lodash.isequal";
import mapValues from "lodash.mapvalues";
import orderBy from "lodash.orderby";
import Collection from "./collection";
import Memoize from "./fast-memoize-decorator";
import filter from "./filter";
import { assignGetterOrClass, mapToObject, pickBy } from "./helper";
import Model from "./model";
import { isModelArray, isModelIndex } from "./type-guards";
import {
  BaseModelFields,
  FieldDoubleValue,
  FieldName,
  FieldValue,
  FieldValues,
  Filter,
  FilterOperator,
  Item,
  ItemIndex,
  ModelConstructor,
  ModelIndex,
  ModelOrGetter,
  PKValue,
  Predicate,
  RelationFieldName,
  RelationQueries,
  SubModel,
  NumberFields,
} from "./types";

export default class Query<M extends Model> {
  private _whereConditions: Filter<M>[] = [];
  private _wherePK: PKValue[] = [];
  private _orderBy: { itaretees: (keyof SubModel<M> | ((record: M | Item<M>) => any))[]; directions: ("asc" | "desc")[] } = {
    itaretees: [],
    directions: [],
  };
  _relationQueries = {} as RelationQueries<M>;
  readonly _Model!: ModelConstructor<M>;

  constructor(ModelClassOrGetter: ModelOrGetter<M>) {
    assignGetterOrClass(this, "_Model", ModelClassOrGetter);
  }

  private _addCondition(condition: Filter<M>): this {
    this._whereConditions.push(condition);
    return this;
  }

  private _getModel(item: undefined): undefined;
  private _getModel(item: M | Item<M>): M;
  private _getModel(item?: M | Item<M>): M | undefined {
    return item instanceof Model || item === undefined ? item : new this._Model(item, { relationQueries: this._relationQueries });
  }

  private _getModelIndex(data: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): ModelIndex<M> {
    if (isModelIndex(data)) {
      return data;
    }

    if (Array.isArray(data)) {
      const mapItem: (i: any) => [string, M] = (item: Item<M>): [string, M] => [this._Model._key(item), this._getModel(item)];
      const mapModel: (i: any) => [string, M] = (model: M): [string, M] => [model.$key, model];
      const convertFunction = data[0] instanceof Model ? mapModel : mapItem;

      return mapToObject(data, convertFunction);
    }

    return mapValues(data, item => this._getModel(item));
  }

  private _getModelArray(data: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): M[] {
    const arrayData: M[] | Item<M>[] = Array.isArray(data) ? data : Object.values(data);
    return isModelArray(arrayData) ? arrayData : new Collection(...arrayData.map(item => this._getModel(item)));
  }

  @Memoize
  get(data?: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): M[] {
    return this._getModelArray(this._filter(data));
  }

  getOne(data: M | Item<M>): M {
    return this._getModel(this._filter([data])[0]);
  }

  first(): M {
    return this.get()[0];
  }

  private _processIndexableConditions(): void {
    if (!this._whereConditions.some(condition => condition.conjunction === "or")) {
      const newWhereConditions: Filter<M>[] = [];
      const allowedTypes = new Set(["in", "="]);

      this._whereConditions.forEach(condition => {
        if (
          typeof condition.value !== "function" &&
          !condition.not &&
          allowedTypes.has(condition.type) &&
          isEqual(condition.property, this._Model._getKeyField())
        ) {
          this._wherePK = this._wherePK.concat((condition.value instanceof Set ? Array.from(condition.value) : [condition.value]) as
            | PKValue
            | PKValue[]);
        } else {
          newWhereConditions.push(condition);
        }
      });

      this._whereConditions = newWhereConditions;
    }
  }

  private _filter(data?: M[] | Item<M>[]): M[] | Item<M>[];
  private _filter(data?: ModelIndex<M> | ItemIndex<M>): ModelIndex<M> | ItemIndex<M>;
  private _filter(data?: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[];
  private _filter(data?: ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[]): ModelIndex<M> | ItemIndex<M> | M[] | Item<M>[] {
    const willModelsModified = Object.keys(this._relationQueries).length > 0; // Whether models are going to be modified. NOTE: DO NOT USE vuex getters returning models if models going to be modified. Independent queries share same models

    this._processIndexableConditions();

    if (!data) {
      data = willModelsModified ? this._Model.getItems(this._wherePK) : this._Model.getModels(this._wherePK); // If available (this._wherePK) use PK to get pre-filter data.
    } else if (data && this._Model.modelBeforeFilter) {
      data = Array.isArray(data) ? this._getModelArray(data) : this._getModelIndex(data);
    }

    if (this._whereConditions.length > 0) {
      data = Array.isArray(data)
        ? data.filter(item => filter(item, this._whereConditions))
        : pickBy(data, item => filter(item, this._whereConditions));
    }

    if (this._orderBy.itaretees.length > 0) {
      data = orderBy(data, this._orderBy.itaretees, this._orderBy.directions) as typeof data;
    }

    return data;
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: O R D E R B Y : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //
  /**
   * Adds order by details to the query.
   * @param {FieldName | FieldName[] | Function | Function[] }  iteratees     - Single or multiple fieldnames or functions to be sorted.
   * @param {"asc" | "desc" | Array<"asc" | "desc">}            [directions]  - Sort directions for given iteratees.
   * @returns                                                   this          - Query object to be chained.
   * @example
   * query.orderBy("id", "desc");
   * query.orderBy(["id", "name"], ["asc", "desc"]);
   * query.orderBy(record => new Date(record.birthDate), "desc");
   */
  orderBy<F extends keyof SubModel<M> | ((record: M | Item<M>) => any)>(iteratees: F, directions?: "asc" | "desc"): this;
  orderBy<F extends keyof SubModel<M> | ((record: M | Item<M>) => any)>(iteratees: F[], directions?: ("asc" | "desc")[]): this;
  orderBy<F extends keyof SubModel<M> | ((record: M | Item<M>) => any)>(
    iteratees: F | F[],
    directions?: "asc" | "desc" | ("asc" | "desc")[],
  ): this {
    const iterateesLength = Array.isArray(iteratees) ? iteratees.length : 1;
    const directionsLength = Array.isArray(directions) ? directions.length : 1;

    this._orderBy.itaretees = this._orderBy.itaretees.concat(iteratees);
    this._orderBy.directions = this._orderBy.directions.concat(
      directions || "asc",
      new Array(iterateesLength - directionsLength).fill("asc"),
    );

    return this;
  }

  //
  // ────────────────────────────────────────────────── I ──────────
  //   :::::: W H E R E : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────
  //
  private _where<F extends FieldName<SubModel<M>>>(
    not: boolean,
    conjunction: "and" | "or",
    q: F | Partial<SubModel<M>> | Predicate<M>,
    opOrValue?: FilterOperator | FieldValue<M, F>,
    value?: FieldValue<M, F>,
  ): this {
    const type = (opOrValue && value ? opOrValue : opOrValue ? "=" : undefined) as FilterOperator;
    value = value !== undefined ? value : (opOrValue as FieldValue<M, F>);

    if (type && value) {
      return this._addCondition({ not, conjunction, type, property: q as F, value });
    } else {
      return typeof q === "function"
        ? this._addCondition({ not, conjunction, type: "predicate", value: q })
        : this._addCondition({ not, conjunction, type: "object", value: q as Partial<SubModel<M>> });
    }
  }

  where<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FilterOperator, value: FieldValue<M, F>): this; // i.e: ("age", ">", 30)  OR  ("credit", ">", person => person.account.credit)
  where<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FieldValue<M, F>): this; // i.e: ("id", 2)  OR  ("id", person => person.someField)
  where<F extends FieldName<SubModel<M>>>(q: Partial<SubModel<M>> | Predicate<M>): this; // i.e: ({ id: 1 })  OR  (person => person.age > 30)
  where<F extends FieldName<SubModel<M>>>(
    q: F | Partial<SubModel<M>> | Predicate<M>,
    opOrValue?: FilterOperator | FieldValue<M, F>,
    value?: FieldValue<M, F>,
  ): this {
    return this._where(false, "and", q, opOrValue, value);
  }

  orWhere<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FilterOperator, value: FieldValue<M, F>): this; // i.e: ("age", ">", 30)  OR  ("credit", ">", person => person.account.credit)
  orWhere<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FieldValue<M, F>): this; // i.e: ("id", 2)  OR  ("id", person => person.someField)
  orWhere<F extends FieldName<SubModel<M>>>(q: Partial<SubModel<M>> | Predicate<M>): this; // i.e: ({ id: 1 })  OR  (person => person.age > 30)
  orWhere<F extends FieldName<SubModel<M>>>(
    q: F | Partial<SubModel<M>> | Predicate<M>,
    opOrValue?: FilterOperator | FieldValue<M, F>,
    value?: FieldValue<M, F>,
  ): this {
    return this._where(false, "or", q, opOrValue, value);
  }

  whereNot<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FilterOperator, value: FieldValue<M, F>): this; // i.e: ("age", ">", 30)  OR  ("credit", ">", person => person.account.credit)
  whereNot<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FieldValue<M, F>): this; // i.e: ("id", 2)  OR  ("id", person => person.someField)
  whereNot<F extends FieldName<SubModel<M>>>(q: Partial<SubModel<M>> | Predicate<M>): this; // i.e: ({ id: 1 })  OR  (person => person.age > 30)
  whereNot<F extends FieldName<SubModel<M>>>(
    q: F | Partial<SubModel<M>> | Predicate<M>,
    opOrValue?: FilterOperator | FieldValue<M, F>,
    value?: FieldValue<M, F>,
  ): this {
    return this._where(true, "and", q, opOrValue, value);
  }

  orWhereNot<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FilterOperator, value: FieldValue<M, F>): this; // i.e: ("age", ">", 30)  OR  ("credit", ">", person => person.account.credit)
  orWhereNot<F extends FieldName<SubModel<M>>>(q: F, opOrValue: FieldValue<M, F>): this; // i.e: ("id", 2)  OR  ("id", person => person.someField)
  orWhereNot<F extends FieldName<SubModel<M>>>(q: Partial<SubModel<M>> | Predicate<M>): this; // i.e: ({ id: 1 })  OR  (person => person.age > 30)
  orWhereNot<F extends FieldName<SubModel<M>>>(
    q: F | Partial<SubModel<M>> | Predicate<M>,
    opOrValue?: FilterOperator | FieldValue<M, F>,
    value?: FieldValue<M, F>,
  ): this {
    return this._where(true, "or", q, opOrValue, value);
  }

  //
  // ──────────────────────────────────────────────────────── I ──────────
  //   :::::: S U B Q U E R Y : :  :   :    :     :        :          :
  // ──────────────────────────────────────────────────────────────────
  //

  private _whereQuery(not: boolean, conjunction: "and" | "or", q: <RQ extends Query<M>>(this: RQ, query: RQ) => RQ): this {
    const query: Query<M> = new Query(() => this._Model);
    const subFilters = q.call(query, query)._whereConditions;
    return this._addCondition({ not, conjunction, type: "group", value: subFilters });
  }

  whereQuery(q: <RQ extends Query<M>>(this: RQ, query: RQ) => RQ): this {
    return this._whereQuery(false, "and", q);
  }

  orWhereQuery(q: <RQ extends Query<M>>(this: RQ, query: RQ) => RQ): this {
    return this._whereQuery(false, "or", q);
  }

  whereNotQuery(q: <RQ extends Query<M>>(this: RQ, query: RQ) => RQ): this {
    return this._whereQuery(true, "and", q);
  }

  orWhereNotQuery(q: <RQ extends Query<M>>(this: RQ, query: RQ) => RQ): this {
    return this._whereQuery(true, "or", q);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: B E T W E E N : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //

  whereBetween<F extends FieldName<SubModel<M>>>(property: F, value: FieldDoubleValue<M, F>): this {
    return this._addCondition({ not: false, conjunction: "and", property, type: "between", value });
  }

  orWhereBetween<F extends FieldName<SubModel<M>>>(property: F, value: FieldDoubleValue<M, F>): this {
    return this._addCondition({ not: false, conjunction: "or", property, type: "between", value });
  }

  whereNotBetween<F extends FieldName<SubModel<M>>>(property: F, value: FieldDoubleValue<M, F>): this {
    return this._addCondition({ not: true, conjunction: "and", property, type: "between", value });
  }

  orWhereNotBetween<F extends FieldName<SubModel<M>>>(property: F, value: FieldDoubleValue<M, F>): this {
    return this._addCondition({ not: true, conjunction: "or", property, type: "between", value });
  }

  //
  // ──────────────────────────────────────────── I ──────────
  //   :::::: I N : :  :   :    :     :        :          :
  // ──────────────────────────────────────────────────────
  //
  private _whereIn<F extends FieldName<SubModel<M>>>(not: boolean, conjunction: "and" | "or", property: F, value: FieldValues<M, F>): this {
    // If single field is compared against static values (non-function), use optimized Set.
    const processedValue = Array.isArray(property) || typeof value === "function" ? value : (new Set(value) as any);
    const condition: Filter<M> = { not, conjunction, property, type: "in", value: processedValue };
    return this._addCondition(condition);
  }

  whereIn<F extends FieldName<SubModel<M>>>(property: F, value: FieldValues<M, F>): this {
    return this._whereIn(false, "and", property, value);
  }

  orWhereIn<F extends FieldName<SubModel<M>>>(property: F, value: FieldValues<M, F>): this {
    return this._whereIn(false, "or", property, value);
  }

  whereNotIn<F extends FieldName<SubModel<M>>>(property: F, value: FieldValues<M, F>): this {
    return this._whereIn(true, "and", property, value);
  }

  orWhereNotIn<F extends FieldName<SubModel<M>>>(property: F, value: FieldValues<M, F>): this {
    return this._whereIn(true, "or", property, value);
  }

  //
  // ──────────────────────────────────────────────── I ──────────
  //   :::::: N U L L : :  :   :    :     :        :          :
  // ──────────────────────────────────────────────────────────
  //
  whereNull<F extends FieldName<SubModel<M>>>(property: F): this {
    return this.where(property, null as any);
  }

  whereNotNull<F extends FieldName<SubModel<M>>>(property: F): this {
    return this.whereNot(property, null as any);
  }

  orWhereNull<F extends FieldName<SubModel<M>>>(property: F): this {
    return this.orWhere(property, null as any);
  }

  orWhereNotNull<F extends FieldName<SubModel<M>>>(property: F): this {
    return this.orWhereNot(property, null as any);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: R E L A T E D : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //

  /**
   * Adds conditions and filters to related entities.
   * @param {string | string[]} relationPath  - Field names as an array or string with dot notation. "member.options" or ["member", "options"]
   * @param {QueryFunction}     queryFn       - Callback to filter related data.
   * @example
   * query.queryRelated(["options", "optionGroup"], query => query.where("rate", ">", 2)); // Retrieves optionGroups which have rating above 2.
   * query.queryRelated("options.optionGroup"], query => query.where("rate", ">", 2)); // Retrieves optionGroups which have rating above 2.
   */
  queryRelated<TQ extends Query<any>>(relationPath: string, queryFn: (this: TQ, query: TQ) => TQ): this;
  queryRelated<F1 extends RelationFieldName<M>, TQ extends RelationQueries<M>[F1] = RelationQueries<M>[F1]>(
    relationPath: F1 | [F1],
    queryFn: (this: TQ, query: TQ) => TQ,
  ): this;
  queryRelated<
    F1 extends RelationFieldName<M>,
    F2 extends RelationFieldName<BaseModelFields<M>[F1]>,
    TQ extends RelationQueries<BaseModelFields<M>[F1]>[F2] = RelationQueries<BaseModelFields<M>[F1]>[F2]
  >(relationPath: [F1, F2], queryFn: (this: TQ, query: TQ) => TQ): this;
  queryRelated<
    F1 extends RelationFieldName<M>,
    F2 extends RelationFieldName<BaseModelFields<M>[F1]>,
    F3 extends RelationFieldName<BaseModelFields<BaseModelFields<M>[F1]>[F2]>,
    TQ extends RelationQueries<BaseModelFields<BaseModelFields<M>[F1]>[F2]>[F3] = RelationQueries<
      BaseModelFields<BaseModelFields<M>[F1]>[F2]
    >[F3]
  >(relationPath: [F1, F2, F3], queryFn: (this: TQ, query: TQ) => TQ): this;
  queryRelated<
    F1 extends RelationFieldName<M>,
    F2 extends RelationFieldName<BaseModelFields<M>[F1]>,
    F3 extends RelationFieldName<BaseModelFields<BaseModelFields<M>[F1]>[F2]>,
    TQ extends Query<any>
  >(relationPath: string | F1 | [F1, F2?, F3?], queryFn: (this: TQ, query: TQ) => TQ): this {
    relationPath = (typeof relationPath === "string" ? relationPath.split(".") : relationPath) as [F1, F2?, F3?];
    const [fieldName, ...remaining] = relationPath;
    const relation = this._Model._getRelation(fieldName);

    const query: Query<InstanceType<typeof relation.TargetModel>> = this._relationQueries[fieldName] || new Query(relation.TargetModel);

    if (remaining.length === 0) {
      queryFn.call(query as TQ, query as TQ);
    } else {
      query.queryRelated(remaining as any, queryFn); // Add to relatedQueries of relatedQueries...
    }

    this._relationQueries[fieldName] = query;

    return this;
  }

  //
  // ────────────────────────────────────────────────────────── I ──────────
  //   :::::: A G G R E G A T E : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────────
  //
  @Memoize
  // sum<F extends FieldName<SubModel<M>>>(property: F): number | undefined {
  sum<F extends keyof NumberFields<M>>(property: F): number | undefined {
    return this.get().reduce((sum, item) => sum + ((item[property] as unknown) as number), 0);
  }

  @Memoize
  count<F extends keyof SubModel<M>>(property?: F): number {
    const data = this.get();

    return property
      ? data.reduce((count, item) => count + (item[property] === undefined || item[property] === null ? 0 : 1), 0)
      : data.length;
  }

  @Memoize
  average<F extends keyof NumberFields<M>>(property: F): number | undefined {
    const sum = this.sum(property);
    const count = this.count();
    return sum === undefined ? undefined : sum / count;
  }

  @Memoize
  max<F extends keyof SubModel<M>>(property: F): FieldValue<M, F> | undefined {
    const data = this.get();
    const initial = data[0] ? data[0][property] : undefined;
    return data.reduce((maxVal, item) => (item[property] > maxVal ? item[property] : maxVal), initial as any);
  }

  @Memoize
  min<F extends keyof SubModel<M>>(property: F): FieldValue<M, F> | undefined {
    const data = this.get();
    const initial = data[0] ? data[0][property] : undefined;
    return data.reduce((maxVal, item) => (item[property] < maxVal ? item[property] : maxVal), initial as any);
  }
}
