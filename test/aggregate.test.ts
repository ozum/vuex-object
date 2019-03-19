import { createStore } from "./support/store";
import { User } from "./support/models";

createStore();

describe("sum", () => {
  it("should return sum of given field.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .sum("id");

    expect(result).toBe(6);
  });
});

describe("count", () => {
  it("should return number of items if no field is provided.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .count();

    expect(result).toBe(3);
  });

  it("should return number of non-null or defined items if field is provided.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .count("oldId");

    expect(result).toBe(2);
  });
});

describe("average", () => {
  it("should return average of given field.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .average("id");

    expect(result).toBe(2);
  });
});

describe("max", () => {
  it("should max of given field.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .max("id");

    expect(result).toBe(3);
  });
});

describe("min", () => {
  it("should max of given field.", () => {
    const result = User.query()
      .where("id", "<", 4)
      .min("id");

    expect(result).toBe(1);
  });
});
