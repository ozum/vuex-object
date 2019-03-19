import Relation from ".";
import { getForeignKey } from "../helper";
import Model from "../model";
import Query from "../query";

import { Item, KeyableFieldNames, ModelOrGetter, PKValue, SingleRelationFieldName } from "../types";

export default class BelongsToRelation<SM extends Model, TM extends Model> extends Relation<SM, TM> {
  fkField: KeyableFieldNames<SM>;
  query?: Query<TM>;

  constructor(
    SourceModelClassOrGetter: ModelOrGetter<SM>,
    TargetModelClassOrGetter: ModelOrGetter<TM>,
    field: SingleRelationFieldName<SM>,
    fkField: KeyableFieldNames<SM>,
    query?: Query<TM>,
  ) {
    super(SourceModelClassOrGetter, TargetModelClassOrGetter, field);
    this.fkField = fkField;
    this.query = query;
  }

  foreignKey(value: PKValue | SM | Item<SM>): string {
    return getForeignKey(value, this.TargetModel, this.fkField);
  }

  getRelated(item: SM): TM | undefined {
    return this.getRelatedItem(item);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: G E T T E R S : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //

  get relatedItemsGetterFunction(): () => (value: PKValue | SM | Item<SM>) => Item<TM> | undefined {
    return () => (value: PKValue | SM | Item<SM>): Item<TM> | undefined => {
      const foreignKey = this.foreignKey(value);
      const item = this.TargetModel.getIndex()[foreignKey];
      return this.query && item !== undefined ? this.query.getOne(item) : item;
    };
  }
}
