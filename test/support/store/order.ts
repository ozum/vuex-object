import Order from "../models/order";

export default {
  namespaced: true,
  getters: Order.getters,
  mutations: Order.mutations,
  state: [{ id: 101, userId: 1 }, { id: 102, userId: 1 }, { id: 201, userId: 2 }],
};
