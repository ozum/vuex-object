import Model from "./base-model";
import Order from "./order";
import Item from "./item";

const { HasMany, PrimaryKey, VuexModel, StoreProp } = Model.getDecorators<User>();

@VuexModel
export default class User extends Model {
  static readonly path = "users";
  static readonly storeType = Model.arrayCollection;

  @PrimaryKey id!: number;
  @StoreProp name!: string;
  @StoreProp favoriteItemIds!: number[];
  @StoreProp oldId?: number;
  @StoreProp sortNo!: number;

  @(HasMany(() => Order).by("userId")) orders!: Order[];
  @(HasMany(() => Item).with("favoriteItemIds")) favoriteItems!: Item[];
}
