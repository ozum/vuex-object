import RelationDecorator from ".";
import Model from "../../model";
import BelongsToRelation from "../../relation/belongs-to";
import { KeyableFieldNames, ModelOrGetter, SingleRelationFieldName } from "../../types";

export default class BelongsToDecorator<TM extends Model, SM extends Model> extends RelationDecorator<TM, SM> {
  fkField: KeyableFieldNames<SM>;
  fieldName!: SingleRelationFieldName<SM>;

  constructor(getTargetModel: ModelOrGetter<TM>, fkField: KeyableFieldNames<SM>) {
    super(getTargetModel);
    this.fkField = fkField;
  }

  get relation(): BelongsToRelation<SM, TM> {
    return new BelongsToRelation(() => this.SourceModelClass, this.getTargetModel, this.fieldName, this.fkField, this.relationQuery);
  }

  set(model: SM, newValue: any): void {
    const TODO = 1;
  }
}
