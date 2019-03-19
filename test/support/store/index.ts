// const Vue = require("vue");
import Vue from "vue";
import Vuex, { Store } from "vuex";

import { Model } from "../models";
import User from "./user";
import Item from "./item";
import Order from "./order";
import OrderLine from "./order-line";

Vue.use(Vuex);

/**
 * Create a new Vuex Store.
 */
export function createStore(): Store<any> {
  return new Vuex.Store({
    plugins: [Model.plugin],
    strict: true,
    modules: {
      users: User,
      items: Item,
      orders: Order,
      orderLines: OrderLine,
    },
  });
}
