# vuex-object

# FEATURES

- **Type safe**: Written in TypeScript. Provides warnings, autocomplete etc. in model properties (fields).
- Easily access vuex data using ORM like relations.
- **Lazy load**: Only fetches related data if requested.
- **Index**: Creates vuex getters for related data to fetch them quickly.
- Uses mutations to update data.

# SYNOPSIS

```ts
const items = Item.query()
  .where("id", ">", 10)
  .get();

const importantItems = Item.query()
  .where("id", ">", 10)
  .orWhere(item => item.priority > 3)
  .get();

// Lazily load first item's orders using index with through relation: item -> orderLine -> order
const itemOrders = Item.query()
  .where("id", ">", 10)
  .first().orders;

// Update data using vuex mutations
itemOrders[0].fullfilled = true;
```

# USAGE

## 1. Create model files

**models/base-model.ts**

```ts
import { createBaseModel } from "vuex-object";

// Export default base model
export default createBaseModel();
```

**models/user.ts**

```ts
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
```

**models/order.ts**

```ts
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
```

## 2. Create vuex store

Create your vuex store as usual, add plugin getters, plugin mutations and register plugin.

```ts
import Vue from "vue";
import Vuex, { Store } from "vuex";

import { Model, Item, Order, OrderLine, User } from "../models"; // Import your models

Vue.use(Vuex);

const store = new Vuex.Store({
  plugins: [Model.plugin], // Register plugin
  strict: true,
  modules: {
    items: { state: {}, namespaced: true, getters: { ...Item.getters }, mutations: { ...Item.mutations } },
    orders: { state: {}, namespaced: true, getters: { ...Order.getters }, mutations: { ...Order.mutations } },
    orderLines: { state: {}, namespaced: true, getters: { ...OrderLine.getters }, mutations: { ...OrderLine.mutations } },
    users: { state: {}, namespaced: true, getters: { ...User.getters }, mutations: { ...User.mutations } },
  },
});
```

## 3. Vue component

Use your models in vue components.

```vue
<template>
  <div>
    {{ items }}
    {{ orders }}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "nuxt-property-decorator";
import Item from "../models/item";

export default class ComponentName extends Vue {
  get items() {
    return Item.query().where("id", ">", 10);
  }

  get someOrder() {
    return Item.query().first().orders;
  }
}
</script>
```

## Details

WIP. Please see `test` folder in repository.
