import { createStore } from "./support/store";
import { User, Item } from "./support/models";

createStore();

describe("orderBy", () => {
  it("should sort data in ascending order for given field.", () => {
    const userNames = User.query()
      .where("id", "<", 4)
      .orderBy("name")
      .get()
      .map(user => user.name);
    expect(userNames).toEqual(["George", "Mike", "Susan"]);
  });

  it("should sort data in ascending order for given fields.", () => {
    const userNames = User.query()
      .where("id", "<", 4)
      .orderBy(["sortNo", "name"], ["asc", "desc"])
      .get()
      .map(user => user.name);
    expect(userNames).toEqual(["Susan", "George", "Mike"]);
  });

  it("should sort data in ascending order for given function.", () => {
    const userNames = User.query()
      .where("id", "<", 4)
      .orderBy(record => record.favoriteItemIds[1] || "999", "desc")
      .get()
      .map(user => user.name);
    expect(userNames).toEqual(["Mike", "Susan", "George"]);
  });

  it("should sort data in descending order for given field.", () => {
    const userNames = User.query()
      .where("id", "<", 4)
      .orderBy("name", "desc")
      .get()
      .map(user => user.name);
    expect(userNames).toEqual(["Susan", "Mike", "George"]);
  });
});
