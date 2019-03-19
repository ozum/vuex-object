import Relation from ".";
import { arrify, getForeignKey, mapObject } from "../helper";
import Model from "../model";
import Query from "../query";

import { Item, Items, KeyableFieldNames, ManyKeyableFieldName, ManyRelationFieldName, ModelOrGetter, PKValue } from "../types";

export default class HasManyByRelation<SM extends Model, TM extends Model> extends Relation<SM, TM> {
  fkField: KeyableFieldNames<TM> | ManyKeyableFieldName<TM>;
  query?: Query<TM>;

  readonly getters = {
    [`${this.field}BaseIndex`]: this.baseIndexGetterFunction, // i.e: OptionBase, ColorBase ...
    [`${this.field}QueriedIndex`]: this.queriedIndexGetterFunction, // i.e: options, colors ...
  };

  constructor(
    SourceModelClassOrGetter: ModelOrGetter<SM>,
    TargetModelClassOrGetter: ModelOrGetter<TM>,
    field: ManyRelationFieldName<SM>,
    fkField: KeyableFieldNames<TM> | ManyKeyableFieldName<TM>,
    query?: Query<TM>,
  ) {
    super(SourceModelClassOrGetter, TargetModelClassOrGetter, field);
    this.fkField = fkField;
    this.query = query;
  }

  foreignKey(value: PKValue | PKValue[] | TM | Item<TM>): string | string[] {
    return getForeignKey(value, this.SourceModel, this.fkField);
  }

  getBaseIndex<R extends Relation<SM, TM>>(this: R): { [PK: string]: Items<TM> } {
    return this.SourceModel._internalGetter(`${this.field}BaseIndex`);
  }

  getQueriedIndex(): { [PK: string]: Items<TM> } {
    return this.SourceModel._internalGetter(`${this.field}QueriedIndex`);
  }

  getRelated(item: SM): TM[] {
    return this.getRelatedItems(item);
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: G E T T E R S : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //

  get baseIndexGetterFunction(): () => { [PK: string]: Items<TM> } {
    /**
     * Returns an object which maps parent item ids to children items.
     * @returns {Object<string|number, Object>}   - Object which maps ids to objects.
     */
    return (): { [PK: string]: Items<TM> } => {
      const index: { [PK: string]: Items<TM> } = {};
      this.TargetModel.getItems().forEach(targetItem => {
        const foreignKeys = arrify(this.foreignKey(targetItem));
        foreignKeys.forEach(fk => (index[fk] ? index[fk].push(targetItem) : (index[fk] = [targetItem])));
      });
      return index;
    };
  }

  get queriedIndexGetterFunction(): () => { [PK: string]: Items<TM> } {
    /**
     * Returns an object which maps parent item ids to children items.
     * @returns {Object<string|number, Object>}   - Object which maps ids to objects.
     */
    return (): { [PK: string]: Items<TM> } => {
      const index = this.getBaseIndex();

      if (!this.query) {
        return index;
      }

      const relationQuery = this.query || new Query(this.TargetModel);
      return mapObject(index, (pk, targetItems) => [pk, relationQuery.get(targetItems)]);
    };
  }

  get relatedItemsGetterFunction(): () => (value: PKValue | SM | Item<SM>) => Items<TM> {
    return () => (value: PKValue | SM | Item<SM>): Items<TM> => {
      const index = this.getQueriedIndex();
      return index[this.SourceModel._key(value)];
    };
  }
}
