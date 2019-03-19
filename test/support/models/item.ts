import Model from "./base-model";
import OrderLine from "./order-line";
import Order from "./order";
import User from "./user";

const { HasMany, PrimaryKey, VuexModel, StoreProp } = Model.getDecorators<Item>();

@VuexModel
export default class Item extends Model {
  static readonly path = "items";
  static readonly storeType = Model.objectCollection;

  @PrimaryKey id!: number;
  @StoreProp name!: string;

  @(HasMany(() => OrderLine).by("itemId")) orderLines!: OrderLine[];
  @(HasMany(() => Order).through(() => OrderLine, "itemId", "orderId")) orders!: Order[];
  @(HasMany(() => User).by("favoriteItemIds")) favoritedByUsers!: User[];
}
