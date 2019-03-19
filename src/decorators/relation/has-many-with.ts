import RelationDecorator from ".";
import Model from "../../model";
import HasManyWithRelation from "../../relation/has-many-with";
import { ManyKeyableFieldName, ManyRelationFieldName, ModelOrGetter } from "../../types";

export default class HasManyWithDecorator<TM extends Model, SM extends Model> extends RelationDecorator<TM, SM> {
  fkField: ManyKeyableFieldName<SM>;
  fieldName!: ManyRelationFieldName<SM>;

  constructor(getTargetModel: ModelOrGetter<TM>, fkField: ManyKeyableFieldName<SM>) {
    super(getTargetModel);
    this.fkField = fkField;
  }

  get relation(): HasManyWithRelation<SM, TM> {
    return new HasManyWithRelation(() => this.SourceModelClass, this.getTargetModel, this.fieldName, this.fkField, this.relationQuery);
  }

  set(model: SM, newValue: any): void {
    const TODO = 1;
  }
}
