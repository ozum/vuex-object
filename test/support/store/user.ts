import User from "../models/user";

export default {
  namespaced: true,
  getters: User.getters,
  mutations: User.mutations,
  state: [
    { id: 1, name: "George", favoriteItemIds: [1, 2], oldId: 837, sortNo: 1 },
    { id: 2, name: "Susan", favoriteItemIds: [1, 4], sortNo: 1 },
    { id: 3, name: "Mike", favoriteItemIds: [], oldId: 3, sortNo: 2 },
  ],
};
