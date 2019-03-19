import { createStore } from "./support/store";
import { Order } from "./support/models";

createStore();

describe("queryRelated", () => {
  it("should filter array path.", () => {
    const order = Order.query()
      .where("id", 101)
      .queryRelated(["items", "favoritedByUsers"], q => q.where(user => user.id === 2))
      .get()[0];

    expect(order.items[0].favoritedByUsers[0].id).toBe(2); // user.id === 2, so user is included
    expect(order.items[1].favoritedByUsers[0]).toBe(undefined); // user.id !== 2, so user is not included.
  });

  it("should filter string path.", () => {
    const order = Order.query()
      .where("id", 101)
      .queryRelated("items.favoritedByUsers", q => q.where(user => user.id === 2))
      .get()[0];

    expect(order.items[0].favoritedByUsers[0].id).toBe(2); // user.id === 2, so user is included
    expect(order.items[1].favoritedByUsers[0]).toBe(undefined); // user.id !== 2, so user is not included.
  });
});
