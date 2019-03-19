import { createStore } from "./support/store";
import { User, Item, OrderLine, Order } from "./support/models";

createStore();

describe("Item", () => {
  it("should have many order lines. (HasManyBy)", () => {
    const itemOrderLineOrderIds = Item.query()
      .where("id", 1)
      .get()[0]
      .orderLines.map(orderLine => orderLine.orderId);

    expect(itemOrderLineOrderIds).toEqual([101, 102]);
  });

  it("should have many orders through order lines. (HasManyThrough)", () => {
    const itemOrderIds = Item.query()
      .where("id", 1)
      .get()[0]
      .orders.map(order => order.id);

    expect(itemOrderIds).toEqual([101, 102]);
  });

  it("should have favorited by many users. (HasManyBy Array)", () => {
    const itemOrderIds = Item.query()
      .where("id", 1)
      .get()[0]
      .favoritedByUsers.map(user => user.id);

    expect(itemOrderIds).toEqual([1, 2]);
  });
});

describe("OrderLine", () => {
  it("should belongs to an item. (BelongsTo)", () => {
    const item = OrderLine.query()
      .where(["orderId", "itemId"], [101, 1])
      .get()[0].item;

    expect(item.id).toEqual(1);
  });

  it("should belongs to an order. (BelongsTo)", () => {
    const order = OrderLine.query()
      .where(["orderId", "itemId"], [101, 1])
      .get()[0].order;

    expect(order.id).toEqual(101);
  });
});

describe("Order", () => {
  it("should belongs to a user. (BelongsTo)", () => {
    const user = Order.query()
      .where("id", 101)
      .get()[0].user;

    expect(user.id).toEqual(1);
  });

  it("should have many order lines. (HasManyBy)", () => {
    const orderLineItemIds = Order.query()
      .where("id", 101)
      .get()[0]
      .orderLines.map(orderLine => orderLine.itemId);

    expect(orderLineItemIds).toEqual([1, 2]);
  });

  it("should have many items through order lines. (HasManyThrough)", () => {
    const orderItemIds = Order.query()
      .where("id", 101)
      .get()[0]
      .items.map(item => item.id);

    expect(orderItemIds).toEqual([1, 2]);
  });
});

describe("User", () => {
  it("should have many orders. (HasManyBy)", () => {
    const userOrderIds = User.query()
      .where("id", 1)
      .get()[0]
      .orders.map(order => order.id);

    expect(userOrderIds).toEqual([101, 102]);
  });

  it("should have many favorite items. (HasManyWith)", () => {
    const userFavoriteItemIds = User.query()
      .where("id", 1)
      .get()[0]
      .favoriteItems.map(item => item.id);
    expect(userFavoriteItemIds).toEqual([1, 2]);
  });
});
