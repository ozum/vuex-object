import RelationDecorator from ".";
import Model from "../../model";
import HasManyByRelation from "../../relation/has-many-by";
import { KeyableFieldNames, ManyKeyableFieldName, ManyRelationFieldName, ModelOrGetter } from "../../types";

export default class HasManyByDecorator<TM extends Model, SM extends Model> extends RelationDecorator<TM, SM> {
  fkField: KeyableFieldNames<TM> | ManyKeyableFieldName<TM>;

  fieldName!: ManyRelationFieldName<SM>;

  constructor(getTargetModel: ModelOrGetter<TM>, fkField: KeyableFieldNames<TM> | ManyKeyableFieldName<TM>) {
    super(getTargetModel);
    this.fkField = fkField;
  }

  get relation(): HasManyByRelation<SM, TM> {
    return new HasManyByRelation(() => this.SourceModelClass, this.getTargetModel, this.fieldName, this.fkField, this.relationQuery);
  }

  set(model: SM, newValue: any): void {
    const TODO = 1;
  }
}
