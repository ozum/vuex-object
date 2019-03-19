import Model from "./base-model";
import User from "./user";
import Item from "./item";
import OrderLine from "./order-line";

const { BelongsTo, HasMany, PrimaryKey, VuexModel, StoreProp } = Model.getDecorators<Order>();

@VuexModel
export default class Order extends Model {
  static readonly path = "orders";
  static readonly storeType = Model.arrayCollection;

  @PrimaryKey id!: number;
  @StoreProp userId!: number;

  @BelongsTo(() => User, "userId") user!: User;
  @(HasMany(() => OrderLine).by("orderId")) orderLines!: OrderLine[];
  @(HasMany(() => Item).through(() => OrderLine, "orderId", "itemId")) items!: Item[];
}
