import RelationDecorator from ".";
import Model from "../../model";
import HasManyThroughRelation from "../../relation/has-many-through";
import { KeyableFieldNames, ManyRelationFieldName, ModelOrGetter } from "../../types";

export default class HasManyByDecorator<TM extends Model, SM extends Model, XM extends Model> extends RelationDecorator<TM, SM> {
  getThroughModel: ModelOrGetter<XM>;
  sourceFKField: KeyableFieldNames<XM>;
  targetFKField: KeyableFieldNames<XM>;
  fieldName!: ManyRelationFieldName<SM>;

  constructor(
    getTargetModel: ModelOrGetter<TM>,
    getThroughModel: ModelOrGetter<XM>,
    sourceFKField: KeyableFieldNames<XM>,
    targetFKField: KeyableFieldNames<XM>,
  ) {
    super(getTargetModel);
    this.getThroughModel = getThroughModel;
    this.sourceFKField = sourceFKField;
    this.targetFKField = targetFKField;
  }

  get relation(): HasManyThroughRelation<SM, TM, XM> {
    return new HasManyThroughRelation(
      () => this.SourceModelClass,
      this.getThroughModel,
      this.getTargetModel,
      this.fieldName,
      this.sourceFKField,
      this.targetFKField,
      this.relationQuery,
    );
  }

  set(model: SM, newValue: any): void {
    const TODO = 1;
  }
}
