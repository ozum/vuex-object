import OrderLine from "../models/order-line";

export default {
  namespaced: true,
  getters: OrderLine.getters,
  mutations: OrderLine.mutations,
  state: [{ orderId: 101, itemId: 1 }, { orderId: 101, itemId: 2 }, { orderId: 102, itemId: 1 }, { orderId: 201, itemId: 5 }],
};
