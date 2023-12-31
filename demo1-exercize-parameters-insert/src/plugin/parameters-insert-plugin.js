const { declare } = require("@babel/helper-plugin-utils");

const targetCalleeName = ["log", "info", "error", "debug"].map(
  (item) => `console.${item}`
);

/**
 * babel 插件的形式就是函数返回一个对象，对象有 visitor 属性。
 * 函数的第一个参数可以拿到 types、template 等常用包的 api，这样我们就不需要单独引入这些包了。
 * 而且作为插件用的时候，并不需要自己调用 parse、traverse、generate，这些都是通用流程，babel 会做，我们只需要提供一个 visitor 函数，在这个函数内完成转换功能就行了。
 * 函数的第二个参数 state 中可以拿到插件的配置信息 options 等，比如 filename 就可以通过 state.filename 来取。
 */
const parametersInsertPlugin = ({ types, template }, options, dirname) => {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.isNew) {
          return;
        }
        const calleeName = path.get("callee").toString();
        if (targetCalleeName.includes(calleeName)) {
          const { line, column } = path.node.loc.start;
          const newNode = template.expression(
            `console.log("${
              state.filename || "unkown filename"
            }: (${line}, ${column})")`
          )();
          newNode.isNew = true;

          if (path.findParent((path) => path.isJSXElement())) {
            path.replaceWith(types.arrayExpression([newNode, path.node]));
            path.skip();
          } else {
            path.insertBefore(newNode);
          }
        }
      },
    },
  };
};
module.exports = parametersInsertPlugin;
