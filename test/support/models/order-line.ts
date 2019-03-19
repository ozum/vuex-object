import Model from "./base-model";
import Item from "./item";
import Order from "./order";

const { BelongsTo, PrimaryKey, VuexModel, StoreProp } = Model.getDecorators<OrderLine>();

@VuexModel
export default class OrderLine extends Model {
  static readonly path = "orderLines";
  static readonly storeType = Model.arrayCollection;

  @PrimaryKey orderId!: number;
  @PrimaryKey itemId!: number;

  @BelongsTo(() => Item, "itemId") item!: Item;
  @BelongsTo(() => Order, "orderId") order!: Item;
}
