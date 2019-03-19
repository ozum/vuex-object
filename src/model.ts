import pluralize from "pluralize";
import Vue from "vue";
import { Store } from "vuex";
import {
  createPositionIndex,
  itemIndexGetterCreators,
  itemsGetters,
  modelIndexGetterCreators,
  modelsGetterCreators,
} from "./common-getters";
import { getDecorators, Decorators } from "./decorators";
import Memoize from "./fast-memoize-decorator";
import formatters from "./formatters";
import { arrify, getKey, mapObject, mapToObject, pickBy } from "./helper";
import Query from "./query";
import Relation from "./relation";
import {
  BaseModelFields,
  FieldDefinition,
  ItemIndex,
  Items,
  KeyableFieldNames,
  ModelConstructor,
  ModelIndex,
  PKValue,
  PositionIndex,
  RelationFields,
  RelationQueries,
  StoreType,
} from "./types";
// import { BaseModelFields, ItemIndex, Items, KeyableFieldNames, ModelIndex, PositionIndex } from "./types/typeof";

// TODO: Model'deki bir attribute'a default değer verilirse henüz store'dan gelen datalardan önce set edilmeye çalışıldığı için hata oluşur.
// Ayrıca store'dan bağımsız new ile yeni bir model oluştuğunda nasıl commit edecek? new yasak olup sadece addItem mı olmalı, yoksa save gibi bir method mu olmalı?
// Çağrılma sırası: BaseModel.consturctor -> Set Default Değer -> ChildModel.constructor.
// Denemek için bir modelde prop'a default değer ver.

const mutators: { [key: string]: (fieldName: string) => (state: any, payload: any) => any } = {
  objectCollection: fieldName => (state, { item, newValue }) => Vue.set(state[item.$key], fieldName, newValue),
  arrayCollection: fieldName => (state, { item, newValue }) =>
    Vue.set(state[item._Class.getPositionIndex()[item.$key]], fieldName, newValue),
  singleItem: fieldName => (state, { newValue }) => Vue.set(state, fieldName, newValue),
};

export default class Model {
  // --------- -----------    CONSTANTS   -----------------------------
  static readonly arrayCollection = "arrayCollection";
  static readonly objectCollection = "objectCollection";
  static readonly singleItem = "singleItem";

  // --------- ---------    CONFIGURATION   ---------------------------
  static readonly prefix = "$"; // Prefix to add before name of generated store funtions such as getters, mutations, actions etc.
  static readonly namespaced = true; // Whether store module is namespaced (to add path before name of generated store funtions such as getters, mutations, actions etc.)
  static readonly modelBeforeFilter: boolean = true; // Whether to convert store items to model before applying filters. (`false` may perfomr better by avoiding model conversion for discarded records, but cannot use class attributes in filters.)
  static readonly path: string; // Vuex module object path in vuex store.
  static readonly storeType: StoreType; // Type of the vuex store. (Supported types are among constants.)
  static readonly keyFunction: (value: any) => string = (value: any): string =>
    (typeof value === "object" ? JSON.stringify(value) : value || "").toString(); // Function to convert item pk/fk property or properties to string key.

  // --------- -------------    OTHER   -------------------------------
  // If static properties whose types are array/object are initialized they are shared among all child classes. Added custom getters to initialize them to prevent reference sharing.
  private static _keyField?: string | string[]; // PK field of the record
  private static _haveGetters = false;
  private static _haveMutations = false;
  static _fields: { [key: string]: FieldDefinition }; // Attribute to store fields for this Model class.
  static _store: Store<any>; // reference to vuex store.
  readonly _data!: Model; // Data from vuex store for related item.
  _relationQueries!: RelationQueries<this>; // Relation queries to further filter related data.

  constructor(item: object | Model, { relationQueries = {} } = {}) {
    const data = item instanceof Model ? item._data : item;

    Object.defineProperties(this, {
      _data: { enumerable: false, value: data },
      _relationQueries: { enumerable: false, writable: true, value: relationQueries },
    });

    // Properties from prototype (created by decorator) are not enumerable. Make thme enumerable to use like POJO in vue.
    this._Class._enumerableFieldNames.forEach(fieldName => {
      const descriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype, fieldName);
      if (descriptor) {
        Object.defineProperty(this, fieldName, descriptor);
      }
    });
  }

  /**
   * Returns relation for given field name. If field is not a relation throws error.
   * @param   {String}    fieldName   - Field name to get relation for.
   * @return  {Relation}              - Relation object for the given field.
   * @throws  {Error}                 - Throws error if given field name is not a relation.
   */
  // static _getRelation<SMC extends typeof Model, F extends keyof BaseModelFields<InstanceType<SMC>>>(
  //   this: SMC,
  //   fieldName: F
  // ): Relation<SMC, BaseModelFields<InstanceType<SMC>>[F]> {
  //   return this._getRelationFields()[fieldName].type;
  // }
  static _getRelation<SMC extends typeof Model, SM extends InstanceType<SMC>, F extends keyof BaseModelFields<SM>>(
    this: SMC,
    fieldName: F,
  ): Relation<SM, BaseModelFields<SM>[F]> {
    return this._getRelationFields()[fieldName].type;
  }

  @Memoize
  static _getRelationFields<SMC extends typeof Model, SM extends InstanceType<SMC>, BMF extends BaseModelFields<SM>>(
    this: SMC,
  ): { [K in keyof BMF]: { type: Relation<SM, BMF[K]> } } {
    return pickBy(this._fields, field => field.type instanceof Relation) as { [K in keyof BMF]: { type: Relation<SM, BMF[K]> } };
  }

  /**
   * Returns related data for given relation field. Returns single model for belongsTo relation, array of models otherwise.
   * @param   {String}          fieldName   - Field name to get related data for.
   * @returns {Model | Model[]}             - Model or array of models.
   */
  @Memoize
  _getRelatedData<M extends Model, RF extends RelationFields<M>, F extends keyof RelationFields<M>>(
    this: M,
    fieldName: F,
  ): RF[F] | RF[F][] | undefined {
    const query = this._relationQueries[fieldName];
    const relation = this._Class._getRelation(fieldName);
    const related = relation.getRelated(this) as any;
    return query ? query.get(related) : related;
  }

  /**
   * Class of the given instance.
   */
  get _Class(): ModelConstructor<this> {
    return this.constructor as ModelConstructor<this>;
  }

  /**
   * Returns key for given item, model, key or array of composite key.
   * @param   {*}         - Value to get key for.
   * @returns {String}    - Key for given value.
   */
  static _key<MC extends typeof Model>(this: MC, value: any): string {
    return getKey(this._getKeyField(), this.keyFunction, value);
  }

  /**
   * Returns keys for given items, models, keys or array of composite keys.
   * @param   {*}         - Value to get key for.
   * @returns {String}    - Key for given value.
   */
  static _keys<MC extends typeof Model>(this: MC, values: any): string[] {
    return arrify(values).map(value => this._key(value));
  }

  private static _getInternalGetterName(name: string): string {
    const fullName = this.namespaced ? name : formatters.camel(pluralize.singular(this.path), name);
    return `${this.prefix}${fullName}`;
  }

  /**
   * Returns result of requested internal vuex getter for this model class. Internal vuex getters are getters created by this library.
   * NOTE 1: Getter name should not contain vuex module path, it is automatically added.
   * NOTE 2: Only works getters created by this library. Because names are prefixed with a custom prefix to prevent collision with manually created getters by developer.
   * @param   {String} name   - Name of the getter
   * @returns {*}             - Result of the vuex getter.
   */
  static _internalGetter(name: string): any {
    return this.getter(this._getInternalGetterName(name));
  }

  /**
   * Adds field with give name to the model.
   * @param {string}            name        - Name of the fied to be added.
   * @param {FieldDefinition}   definition  - Definition object of the field.
   */
  static _addField<MC extends typeof Model>(this: MC, name: keyof InstanceType<MC>, definition: FieldDefinition): void {
    if (!this._fields) {
      this._fields = {};
    }

    this._fields[name as string] = definition;
  }

  static _addKeyField<M extends typeof Model>(this: M, fieldName: string): void {
    if (this._keyField === undefined) {
      this._keyField = fieldName;
    } else if (typeof this._keyField === "string") {
      this._keyField = [this._keyField, fieldName];
    } else if (Array.isArray(this._keyField)) {
      this._keyField.push(fieldName);
    } else {
      throw new Error("Wrong key field.");
    }
  }

  static _getKeyField<M extends typeof Model>(this: M): KeyableFieldNames<InstanceType<M>> {
    return this._keyField as KeyableFieldNames<InstanceType<M>>;
  }

  /**
   * Enumerable fields of the model.
   */
  @Memoize
  private static get _enumerableFieldNames(): string[] {
    return Object.keys(pickBy(this._fields, field => !(field instanceof Relation)));
  }

  /**
   * Returns all items stored in related vuex module as an array using a vuex getter.
   * @returns {[*]}   - Items stored in related vuex module.
   */
  static getItems<MC extends typeof Model>(this: MC, keys?: PKValue[]): Items<InstanceType<MC>> {
    return keys && keys.length > 0 ? Object.values(this.getIndex(keys)) : this._internalGetter("items");
  }

  /**
   * Returns all items stored in related vuex module as an object using a vuex getter.
   * If vuex store module is already an object, returns it. Otherwise an index object is generated using a vuex getter.
   * Created index has primary key as object key, and item as value.
   * @returns {Object}   - Items stored in related vuex module.
   */
  static getIndex<MC extends typeof Model>(this: MC, keys?: PKValue[]): ItemIndex<InstanceType<MC>> {
    const index = this._internalGetter("index");
    return keys && keys.length > 0 ? mapToObject(this._keys(keys), key => [key, index[key]], key => index[key] !== undefined) : index;
  }

  /**
   * Returns positional index for array based vuex store modules.
   * Returned object has primary keys as object keys, and index of the array position in vuex store as value.
   * @param {Object<String, Number>}  - Position index
   */
  static getPositionIndex<MC extends typeof Model>(this: MC): PositionIndex<InstanceType<MC>> {
    return this._internalGetter("positionIndex");
  }

  /**
   * Returns all model items stored in related vuex module as an array using a vuex getter.
   * @returns {[*]}   - Model items stored in related vuex module.
   */
  static getModels<MC extends typeof Model>(this: MC, keys?: PKValue[]): InstanceType<MC>[] {
    return keys && keys.length > 0 ? Object.values(this.getModelIndex(keys)) : this._internalGetter("models");
  }

  /**
   * Returns all model items stored in related vuex module as an object using a vuex getter.
   * If vuex store module is already an object, returns it. Otherwise an index object is generated using a vuex getter.
   * Created index has primary key as object key, and item as value.
   * @returns {Object}   - Model items stored in related vuex module.
   */
  static getModelIndex<MC extends typeof Model>(this: MC, keys?: PKValue[]): ModelIndex<InstanceType<MC>> {
    const index = this._internalGetter("modelIndex");
    const result =
      keys && keys.length > 0 ? mapToObject(this._keys(keys), key => [key, index[key]], key => index[key] !== undefined) : index;
    return result;
  }

  /**
   * Returns result of requested vuex getter for this model class.
   * NOTE 1: Getter name should not contain vuex module path, it is automatically added.
   * @param   {String} name   - Name of the getter
   * @returns {*}             - Result of the vuex getter.
   */
  static getter(name: string): any {
    if (!this._haveGetters) {
      throw new Error(`${this.name} model may not have installed vuex store getters. Define vuex getters with '...${this.name}.getters'`);
    }

    const path = this.namespaced && this.path ? `${this.path}/${name}` : name;

    if (path in this._store.getters) {
      return this._store.getters[path];
    } else {
      throw new Error(`Getter ${path} is not available in vuex store.`);
    }
  }

  static commit(name: string, payload: any): void {
    if (!this._haveMutations) {
      throw new Error(`${this.name} model may not have installed vuex store mutations. Define vuex getters with '...${this.name}.getters'`);
    }
    const path = this.path ? `${this.path}/${name}` : name;
    return this._store.commit(path, payload);
  }

  _commitField(fieldName: string, newValue: any): void {
    this._Class.commit(this._Class._getInternalMutationName(fieldName), { newValue, item: this });
  }

  static getDecorators<M extends Model>(): Decorators<M> {
    return getDecorators<M>();
  }

  /**
   * Returns getter functions to be used in vuex store. Models depend on those getters functions.
   * @returns {Object}  - Key value pairs to be used as getter function in vuex store.
   * @example (store/someModule/getters.js)
   * import SomeModel from "~/models/some-model";
   * const getters = {
   *   ...SomeModel.getters,
   * }
   * export default getters;
   */
  static get getters(): { [name: string]: (...args: any[]) => any } {
    const getters: { [name: string]: (...args: any[]) => any } = {
      index: itemIndexGetterCreators[this.storeType](this),
      items: itemsGetters[this.storeType],
      modelIndex: modelIndexGetterCreators[this.storeType](this),
      models: modelsGetterCreators[this.storeType](this),
    };

    if (this.storeType === "arrayCollection") {
      getters.positionIndex = createPositionIndex(this);
    }

    Object.entries(this._getRelationFields()).forEach(([fieldName, field]) => {
      const relation = field.type;
      getters[`${fieldName}Of`] = relation.relatedItemsGetterFunction; // i.e. optionsOf, colorsOf ...
      Object.assign(getters, relation.getters);
    });

    this._haveGetters = true;
    // Add prefix to beginning of the keys.
    return mapObject(getters, (key, value) => [this._getInternalGetterName(key), value]);
  }

  private static _getInternalMutationName(fieldName: string): string {
    const fullName = this.namespaced ? formatters.upperSnake(fieldName) : formatters.upperSnake(pluralize.singular(this.path), fieldName);
    return `${this.prefix}SET_${fullName}`;
  }

  static get mutations(): { [key: string]: (state: any, payload: any) => any } {
    this._haveMutations = true;
    return mapToObject(this._enumerableFieldNames, fieldName => [
      this._getInternalMutationName(fieldName),
      mutators[this.storeType](fieldName),
    ]);
  }

  /**
   * Plugin function to feed to vuex plugin registration. Vuex calls returned function with store, and this function assigns store to it's property in Model class.
   * @returns {Function}  - Function to be used as vuex plugin.
   * @example (store/index.js)
   * import createModel from "..."; //
   * export const Model = createModel();
   * export const plugins = [Model.plugin];
   */
  static get plugin(): (store: Store<any>) => void {
    return (store: Store<any>) => {
      this._store = store;
    };
  }

  /**
   * Returns query builder object.
   * @returns {Query} - Query builder to filter/sort/access data.
   * @example (someComponent.vue)
   * import SomeModel from "../models/some-model";
   * const result = SomeModel.query().where("id", 3).get();
   */
  static query<MC extends typeof Model>(this: MC): Query<InstanceType<MC>> {
    return (new Query(this) as unknown) as Query<InstanceType<MC>>;
  }

  /**
   * Returns result of requested vuex getter for this model class.
   * NOTE 1: Getter name should not contain vuex module path, it is automatically added.
   * @param   {String} name   - Name of the getter
   * @returns {*}             - Result of the vuex getter.
   */
  $getter(name: string): any {
    return this._Class.getter(name);
  }

  /**
   * Primary key converted to string. Composite keys are converted by default using `JSON.stringify()`. (Can be changed via `Model.keyFunction` static property).
   */
  get $key(): string {
    return this._Class._key(this);
  }
}
