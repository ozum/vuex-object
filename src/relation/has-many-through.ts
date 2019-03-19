import isEqual from "lodash.isequal";
import Relation from ".";
import Memoize from "../fast-memoize-decorator";
import { assignGetterOrClass, getForeignKey } from "../helper";
import Model from "../model";
import Query from "../query";
import { Item, Items, KeyableFieldNames, ManyRelationFieldName, ModelConstructor, ModelOrGetter, PKValue } from "../types";
import HasManyByRelation from "./has-many-by";

export default class HasManyThroughRelation<SM extends Model, TM extends Model, XM extends Model> extends Relation<SM, TM> {
  sourceFkField: KeyableFieldNames<XM>;
  targetFkField: KeyableFieldNames<XM>;
  query?: Query<TM>;

  readonly ThroughModel!: ModelConstructor<XM>;
  readonly getters = {
    [`${this.field}ThroughIndex`]: this.ThroughIndexGetterFunction, // i.e: OptionBase, ColorBase ...
  };

  constructor(
    SourceModelClassOrGetter: ModelOrGetter<SM>,
    ThroughModelClassOrGetter: ModelOrGetter<XM>,
    TargetModelClassOrGetter: ModelOrGetter<TM>,
    field: ManyRelationFieldName<SM>,
    sourceFkField: KeyableFieldNames<XM>,
    targetFkField: KeyableFieldNames<XM>,
    query?: Query<TM>,
  ) {
    super(SourceModelClassOrGetter, TargetModelClassOrGetter, field);
    assignGetterOrClass(this, "ThroughModel", ThroughModelClassOrGetter);
    this.sourceFkField = sourceFkField;
    this.targetFkField = targetFkField;
    this.query = query;
  }

  sourceForeignKey(value: PKValue | XM | Item<XM>): string {
    return getForeignKey(value, this.SourceModel, this.sourceFkField);
  }

  targetForeignKey(value: PKValue | XM | Item<XM>): string {
    return getForeignKey(value, this.TargetModel, this.targetFkField);
  }

  /**
   * Many-to-many relation is sum of two one-to-many relation. This function investigates whether a one-to-many relation exists
   * from source to through model. If it exists, it may be used by this through relation instead of creating a duplicate.
   */
  @Memoize
  get sourceHasManyByRelation(): HasManyByRelation<SM, XM> | undefined {
    const field = Object.values(this.SourceModel._fields).find(
      ({ type }) =>
        type instanceof HasManyByRelation && type.TargetModel === this.ThroughModel && isEqual(this.sourceFkField, type.fkField),
    );

    return field ? (field.type as HasManyByRelation<SM, XM>) : undefined;
  }

  /**
   * Many-to-many relation is sum of two one-to-many relation. This function investigates whether a one-to-many relation exists
   * from target to through model. If it exists, it may be used by this through relation instead of creating a duplicate.
   */
  @Memoize
  get targetHasManyByRelation(): HasManyByRelation<TM, XM> | undefined {
    const field = Object.values(this.TargetModel._fields).find(
      ({ type }) =>
        type instanceof HasManyByRelation && type.TargetModel === this.ThroughModel && isEqual(this.targetFkField, type.fkField),
    );

    return field ? (field.type as HasManyByRelation<TM, XM>) : undefined;
  }

  getThroughIndex<R extends Relation<SM, TM>>(this: R): { [PK: string]: Items<XM> } {
    return this.SourceModel._internalGetter(`${this.field}ThroughIndex`);
  }

  getRelated(item: SM): TM[] {
    return this.getRelatedItems(item);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: G E T T E R S : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //
  get ThroughIndexGetterFunction(): () => { [PK: string]: Items<XM> } {
    return (): { [PK: string]: Items<XM> } => {
      if (this.sourceHasManyByRelation) {
        return this.sourceHasManyByRelation.getBaseIndex();
      }

      const index: { [PK: string]: Items<XM> } = {};
      this.ThroughModel.getItems().forEach(throughItem => {
        const fk = this.sourceForeignKey(throughItem);
        index[fk] ? index[fk].push(throughItem) : (index[fk] = [throughItem]);
      });
      return index;
    };
  }

  get relatedItemsGetterFunction(): () => (value: PKValue | SM | Item<SM>) => Items<TM> {
    return () => (value: PKValue | SM | Item<SM>): Items<TM> => {
      const throughItems = this.getThroughIndex()[this.SourceModel._key(value)];
      const targetIndex = this.TargetModel.getIndex();

      const targetItems = throughItems.map(throughItem => {
        const targetFK = this.targetForeignKey(throughItem);
        return targetIndex[targetFK];
      });

      return this.query ? this.query.get(targetItems) : targetItems;
    };
  }
}
