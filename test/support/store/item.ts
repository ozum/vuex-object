import Item from "../models/item";

export default {
  namespaced: true,
  getters: Item.getters,
  mutations: Item.mutations,
  state: {
    1: { id: 1, name: "Pen" },
    2: { id: 2, name: "Paper" },
    3: { id: 3, name: "Compass" },
    4: { id: 4, name: "Ruler" },
    5: { id: 5, name: "Eraser" },
  },
};
