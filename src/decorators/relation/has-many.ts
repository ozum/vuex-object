import Model from "../../model";
import { KeyableFieldNames, ManyKeyableFieldName, ModelOrGetter } from "../../types";
import HasManyByDecorator from "./has-many-by";
import HasManyThroughDecorator from "./has-many-through";
import HasManyWithDecorator from "./has-many-with";

export default class HasManyDecorator<TM extends Model, SM extends Model> {
  getTargetModel: ModelOrGetter<TM>;

  constructor(getTargetModel: ModelOrGetter<TM>) {
    this.getTargetModel = getTargetModel;
  }

  by(fkField: KeyableFieldNames<TM> | ManyKeyableFieldName<TM>): HasManyByDecorator<TM, SM> {
    return new HasManyByDecorator(this.getTargetModel, fkField);
  }

  with(fkField: ManyKeyableFieldName<SM>): HasManyWithDecorator<TM, SM> {
    return new HasManyWithDecorator(this.getTargetModel, fkField);
  }

  through<XM extends Model>(
    getThroughModel: ModelOrGetter<XM>,
    sourceFKField: KeyableFieldNames<XM>,
    targetFKField: KeyableFieldNames<XM>,
  ): HasManyThroughDecorator<TM, SM, XM> {
    return new HasManyThroughDecorator(this.getTargetModel, getThroughModel, sourceFKField, targetFKField);
  }
}
