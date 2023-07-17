const acorn = require("acorn");

const Parser = acorn.Parser;
const tt = acorn.tokTypes;
const TokenType = acorn.TokenType;

// 注册新的Token类型标识新的关键字
Parser.acorn.keywordTypes["guang"] = new TokenType("guang", {
  keyword: "guang",
});

module.exports = function (Parser) {
  return class extends Parser {
    // here---------扩展原有Parse
    parse(program) {
      let newKeywords =
        "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const class extends export import super";
      //新增关键字
      newKeywords += " guang";
      this.keywords = new RegExp(
        "^(?:" + newKeywords.replace(/ /g, "|") + ")$"
      );
      return super.parse(program);
    }

    // here-----------重写parseStatement方法，当遍历到guang关键字时对它进行修改
    parseStatement(context, topLevel, exports) {
      var starttype = this.type; //当前处理到的Token类型

      if (starttype == Parser.acorn.keywordTypes["guang"]) {
        // 如果是“guang”则进行处理
        var node = this.startNode(); //用于创建一个ast节点
        return this.parseGuangStatement(node);
      } else {
        return super.parseStatement(context, topLevel, exports);
      }
    }

    parseGuangStatement(node) {
      this.next(); //用于消费“guang"关键字
      return this.finishNode({ value: "guang" }, "GuangStatement"); //用于创建类型为GuangStatement的ast节点
    }
  };
};
