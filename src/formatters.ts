const formatters = {
  camel(...args: string[]) {
    return args.shift() + args.map(text => text.replace(/\w/, c => c.toUpperCase())).join("");
  },

  snake(...args: string[]) {
    return this.camel(...args)
      .replace(/([a-z])([A-Z])/g, (match, a, b) => a + "_" + b)
      .toLowerCase();
  },

  upperSnake(...args: string[]) {
    return this.snake(...args).toUpperCase();
  },
};

export default formatters;
