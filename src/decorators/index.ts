import Model from "../model";
import { KeyableFieldNames, ModelOrGetter } from "../types";
import BelongsToDecorator from "./relation/belongs-to";
import HasManyDecorator from "./relation/has-many";

function VuexModel<MC extends typeof Model>(ModelClass: MC): void {
  if (!(ModelClass.path && ModelClass.storeType)) {
    throw new Error("static path and static storeType are required in model classes.");
  }
}

function BelongsTo<TM extends Model, SM extends Model>(
  getTargetModel: ModelOrGetter<TM>,
  foreignKey: KeyableFieldNames<SM>,
): BelongsToDecorator<TM, SM> {
  return new BelongsToDecorator(getTargetModel, foreignKey);
}

function HasMany<TM extends Model, SM extends Model>(getTargetModel: ModelOrGetter<TM>): HasManyDecorator<TM, SM> {
  return new HasManyDecorator(getTargetModel);
}

function StoreProp<M extends Model>(target: M, fieldName: keyof M): void {
  target._Class._addField(fieldName, { type: "prop" });

  if (delete target[fieldName]) {
    Object.defineProperty(target, fieldName, {
      enumerable: true,
      get() {
        return this._data[fieldName];
      },
      // set: setFunctions[target._Class.storeType],
      set(newValue: any) {
        return this._commitField(fieldName, newValue);
      },
    });
  }
}

function PrimaryKey(target: any, fieldName: string): void {
  target._Class._addKeyField(fieldName);
  return StoreProp(target, fieldName);
}

export interface Decorators<SM extends Model> {
  VuexModel: typeof VuexModel;
  HasMany: <TM extends Model>(getTargetModel: ModelOrGetter<TM>) => HasManyDecorator<TM, SM>;
  BelongsTo: <TM extends Model>(getTargetModel: ModelOrGetter<TM>, foreignKey: KeyableFieldNames<SM>) => BelongsToDecorator<TM, SM>;
  StoreProp: typeof StoreProp;
  PrimaryKey: typeof PrimaryKey;
}

export function getDecorators<SM extends Model>(): Decorators<SM> {
  return {
    VuexModel,
    HasMany,
    BelongsTo,
    StoreProp,
    PrimaryKey,
  };
}
