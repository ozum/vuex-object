/* eslint-disable @typescript-eslint/no-unused-vars */

import Collection from "./collection";
import { mapObject, mapToObject } from "./helper";
import Model from "./model";
import { StoreType } from "./types";
import { Item, ItemIndex, Items, ModelConstructor, ModelIndex, PositionIndex } from "./types";

type ItemsGetters = { [ST in StoreType]: <M extends Model>(state: any) => Items<M> };
type IndexGetterCreators = { [ST in StoreType]: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: any) => ItemIndex<M> };
type ModelsGetterCreators = { [ST in StoreType]: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: any) => M[] };
type ModelIndexGetterCreators = { [ST in StoreType]: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: any) => ModelIndex<M> };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createPositionIndex = <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Items<M>): PositionIndex<M> =>
  mapToObject(state, (item, i) => [ModelClass._key(item), i]);

export const itemsGetters: ItemsGetters = {
  objectCollection: <M extends Model>(state: ItemIndex<M>): Items<M> => Object.values(state),
  arrayCollection: <M extends Model>(state: Items<M>): Items<M> => state,
  singleItem: <M extends Model>(state: Item<M>): Items<M> => [state],
};

export const itemIndexGetterCreators: IndexGetterCreators = {
  objectCollection: <M extends Model>(_ModelClass: ModelConstructor<M>) => (state: ItemIndex<M>): ItemIndex<M> => state,
  arrayCollection: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Items<M>): ItemIndex<M> =>
    mapToObject(state as any[], item => [ModelClass._key(item), item]),
  singleItem: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Item<M>): ItemIndex<M> => ({ [ModelClass._key(state)]: state }),
};

export const modelsGetterCreators: ModelsGetterCreators = {
  objectCollection: <M extends Model>(ModelClass: ModelConstructor<M>) => (_state: ItemIndex<M>): M[] =>
    new Collection(...Object.values(ModelClass.getModelIndex())),
  arrayCollection: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Items<M>): M[] =>
    new Collection(...state.map(item => new ModelClass(item))),
  singleItem: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Item<M>): M[] => new Collection(new ModelClass(state)),
};

export const modelIndexGetterCreators: ModelIndexGetterCreators = {
  objectCollection: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: ItemIndex<M>): ModelIndex<M> =>
    mapObject(state, (key, value) => [key, new ModelClass(value)]),
  arrayCollection: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Items<M>): ModelIndex<M> =>
    mapToObject(ModelClass.getModels(), item => [ModelClass._key(item), item]),
  singleItem: <M extends Model>(ModelClass: ModelConstructor<M>) => (state: Item<M>): ModelIndex<M> => ({
    [ModelClass._key(state)]: ModelClass.getModels()[0],
  }),
};
