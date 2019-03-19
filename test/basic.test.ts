import { createStore } from "./support/store";
import { User, Item } from "./support/models";

createStore();

describe("Basic array collection model operations", () => {
  it("should get all users.", () => {
    const userIds = User.query()
      .get()
      .map(user => user.id);
    expect(userIds).toEqual([1, 2, 3]);
  });
});

describe("Basic object collection model operations", () => {
  it("should get all items.", () => {
    const itemIds = Item.query()
      .get()
      .map(item => item.id);
    expect(itemIds).toEqual([1, 2, 3, 4, 5]);
  });
});
