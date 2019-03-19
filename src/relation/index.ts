import { assignGetterOrClass } from "../helper";
import Model from "../model";
import { isModel, isModelArray } from "../type-guards";
import { Item, Items, ModelConstructor, ModelOrGetter, PKValue, RelationFieldName, RelationQueries } from "../types";

export default abstract class Relation<SM extends Model, TM extends Model> {
  abstract relatedItemsGetterFunction(...args: any[]): (value: PKValue | SM | Item<SM>) => Item<TM> | Items<TM> | TM | TM[] | undefined;
  abstract getRelated(item: SM): TM | TM[] | undefined;

  readonly getters = {};
  readonly SourceModel!: ModelConstructor<SM>;
  readonly TargetModel!: ModelConstructor<TM>;
  readonly field: RelationFieldName<SM>;

  constructor(SourceModelClassOrGetter: ModelOrGetter<SM>, TargetModelClassOrGetter: ModelOrGetter<TM>, field: RelationFieldName<SM>) {
    assignGetterOrClass(this, "SourceModel", SourceModelClassOrGetter);
    assignGetterOrClass(this, "TargetModel", TargetModelClassOrGetter);
    this.field = field;
  }

  addToModel(): this {
    this.SourceModel._addField(this.field, { type: this });
    return this;
  }

  /**
   * Returns sub relation queries for the relation field of given item.
   */
  private getFieldRelationQueries(item: SM): RelationQueries<TM> | undefined {
    const fieldRelationQueries = item._relationQueries[this.field]
      ? ((item._relationQueries[this.field]._relationQueries as unknown) as RelationQueries<TM>)
      : undefined;
    return fieldRelationQueries === undefined || Object.keys(fieldRelationQueries).length === 0 ? undefined : fieldRelationQueries;
  }

  protected getRelatedItem(item: SM): TM | undefined {
    const relatedItem: Item<TM> | TM = this.SourceModel._internalGetter(`${this.field}Of`)(item);
    const relationQueries = this.getFieldRelationQueries(item);
    return relatedItem === undefined || (!relationQueries && isModel(relatedItem))
      ? relatedItem
      : new this.TargetModel(relatedItem, { relationQueries });
  }

  protected getRelatedItems(item: SM): TM[] {
    const relatedItems: (Item<TM> | TM)[] = this.SourceModel._internalGetter(`${this.field}Of`)(item);
    const relationQueries = this.getFieldRelationQueries(item);

    return !relationQueries && isModelArray(relatedItems)
      ? relatedItems
      : relatedItems.map(relatedItem => new this.TargetModel(relatedItem, { relationQueries }));
  }
}
