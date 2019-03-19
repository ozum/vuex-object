import { createStore } from "./support/store";
import { User } from "./support/models";

createStore();

describe("where", () => {
  it("should filter by field, value and operator.", () => {
    const user = User.query()
      .where("id", ">", 1)
      .get()[0];

    expect(user.id).toBe(2);
  });

  it("should filter by field and value equality.", () => {
    const user = User.query()
      .where("name", "George")
      .get()[0];

    expect(user.id).toBe(1);
  });

  it("should filter by field value using function.", () => {
    const user = User.query()
      .where("id", record => record.oldId)
      .get()[0];

    expect(user.id).toBe(3);
  });

  it("should filter by partial record.", () => {
    const user = User.query()
      .where({ id: 1, name: "George" })
      .get()[0];

    expect(user.id).toBe(1);
  });

  it("should filter by predicate function.", () => {
    const user = User.query()
      .where(record => record.id === 1)
      .get()[0];

    expect(user.id).toBe(1);
  });
});

describe("whereNot", () => {
  it("should filter by field and value equality.", () => {
    const user = User.query()
      .whereNot("id", 1)
      .get()[0];

    expect(user.id).toBe(2);
  });
});

describe("orWhere", () => {
  it("should filter by field and value equality.", () => {
    const userIds = User.query()
      .where("id", 1)
      .orWhere("id", 2)
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 2]);
  });
});

describe("orWhereNot", () => {
  it("should filter by field and value equality.", () => {
    const userIds = User.query()
      .where("id", 1)
      .orWhereNot("id", 2)
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 3]);
  });
});

describe("combined where", () => {
  it("should filter correctly.", () => {
    const user = User.query()
      .where("id", ">", 1)
      .where("id", "<", 3)
      .get()[0];

    expect(user.id).toEqual(2);
  });
});

describe("whereBetween", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .whereBetween("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([2, 3]);
  });
});

describe("orWhereBetween", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .where("id", 1)
      .orWhereBetween("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 2, 3]);
  });
});

describe("whereNotBetween", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .where("id", 1)
      .whereNotBetween("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1]);
  });
});

describe("orWhereNotBetween", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .where("id", 1)
      .orWhereNotBetween("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1]);
  });
});

describe("whereIn", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .whereIn("id", [1, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 3]);
  });
});

describe("orWhereIn", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .whereIn("id", [1, 3])
      .orWhereIn("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 2, 3]);
  });
});

describe("whereNotIn", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .whereIn("id", [1, 3])
      .whereNotIn("id", [2, 3])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1]);
  });
});

describe("orWhereNotIn", () => {
  it("should filter correctly.", () => {
    const userIds = User.query()
      .orWhereNotIn("id", [2])
      .get()
      .map(user => user.id);

    expect(userIds).toEqual([1, 3]);
  });
});
