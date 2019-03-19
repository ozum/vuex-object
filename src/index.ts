import BaseModel from "./model";

export function createBaseModel(): typeof BaseModel {
  return class Model extends BaseModel {};
}
