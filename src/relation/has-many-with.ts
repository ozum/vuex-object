import Relation from ".";
import { getForeignKey } from "../helper";
import Model from "../model";
import Query from "../query";
import { Item, ItemIndex, Items, ManyKeyableFieldName, ManyRelationFieldName, ModelOrGetter, PKValue } from "../types";

// export default class HasMany<TM extends typeof Model> extends Relation {
export default class HasManyWithRelation<SM extends Model, TM extends Model> extends Relation<SM, TM> {
  public fkField: ManyKeyableFieldName<SM>;
  public query?: Query<TM>;

  constructor(
    SourceModelClassOrGetter: ModelOrGetter<SM>,
    TargetModelClassOrGetter: ModelOrGetter<TM>,
    field: ManyRelationFieldName<SM>,
    fkField: ManyKeyableFieldName<SM>,
    query?: Query<TM>,
  ) {
    super(SourceModelClassOrGetter, TargetModelClassOrGetter, field);
    this.fkField = fkField;
    this.query = query;
  }

  foreignKey(value: PKValue): string;
  foreignKey(value: PKValue | PKValue[] | SM | Item<SM>): string | string[] {
    return getForeignKey(value, this.TargetModel, this.fkField);
  }

  getRelated(item: SM): TM[] {
    return this.getRelatedItems(item);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: G E T T E R S : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //
  get relatedItemsGetterFunction(): () => (value: PKValue | SM | Item<SM>) => Items<TM> {
    return () => (value: PKValue | SM | Item<SM>): Items<TM> => {
      const targetIndex: ItemIndex<TM> = this.TargetModel.getIndex();
      const sourceItem: Item<SM> = this.SourceModel.getIndex()[this.SourceModel._key(value)]; // getters.index[this.SourceModel._key(value)];
      const fkField = (this.fkField as unknown) as keyof Item<SM>;
      const sourceForeignKeys = (sourceItem[fkField] as unknown) as (string | number | (string | number)[])[];
      const targetItems = sourceForeignKeys.map(fk => targetIndex[this.foreignKey(fk)]);
      return this.query ? this.query.get(targetItems) : targetItems;
    };
  }
}
