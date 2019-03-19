import Model from "../../model";
import Query from "../../query";
import Relation from "../../relation";
import { ModelConstructor, ModelOrGetter, RelationFields } from "../../types";

// const CallableInstance: A = require("callable-instance") as A; // tslint:disable-line: no-var-requires
// import CallableInstance from "callable-instance";
import CallableInstance from "../../callable-instance";

export default abstract class RelationDecorator<TM extends Model, SM extends Model> extends CallableInstance {
  abstract set(model: SM, newValue: any): void;
  abstract get relation(): Relation<SM, TM>;
  abstract fieldName: any;

  getTargetModel: ModelOrGetter<TM>;
  sourceModel!: SM;
  relationQuery?: Query<TM>; //  = new Query(this.getTargetModel);

  constructor(getTargetModel: ModelOrGetter<TM>) {
    super("$decorator");
    this.getTargetModel = getTargetModel;
  }

  get(model: SM): TM | TM[] | undefined {
    return model._getRelatedData(this.fieldName);
  }

  get SourceModelClass(): ModelConstructor<SM> {
    return this.sourceModel._Class;
  }

  query(queryFunction: <Q extends Query<TM>>(this: Q, query: Q) => Q): this {
    const relationQuery = this.relationQuery || new Query(this.getTargetModel);
    queryFunction.call(relationQuery, relationQuery);
    this.relationQuery = relationQuery;
    return this;
  }

  $decorator(sourceModel: SM, fieldName: keyof RelationFields<SM>): void {
    this.fieldName = fieldName;
    this.sourceModel = sourceModel;
    this.relation.addToModel();

    const decorator = this;

    if (delete sourceModel[fieldName]) {
      Object.defineProperty(this.sourceModel, fieldName, {
        enumerable: false,
        get() {
          return decorator.get(this);
        },
        set(newValue) {
          return decorator.set(this, newValue);
        },
      });
    }
  }
}
