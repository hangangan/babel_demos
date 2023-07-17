module.exports = function (Parser) {
  return class extends Parser {
    // 将Literal类型节点拆分成NumericLiteral和StringLiteral类型节点
    parseLiteral(...args) {
      const node = super.parseLiteral(...args);
      switch (typeof node.value) {
        case "number":
          node.type = "NumericLiteral";
          break;
        case "string":
          node.type = "StringLiteral";
          break;
      }
      return node;
    }
  };
};
