const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const types = require("@babel/types");
const template = require("@babel/template").default;

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
});

const targetCalleeName = ["log", "info", "error", "debug"].map(
  (item) => `console.${item}`
);
traverse(ast, {
  CallExpression(path, state) {
    if (path.node.isNew) {
      return;
    }
    const calleeName = path.get("callee").toString();
    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start;
      const newNode = template.expression(
        `console.log("filename: (${line}, ${column})")`
      )();
      newNode.isNew = true;

      if (path.findParent((path) => path.isJSXElement())) {
        /** 作为jsx节点时，使用数组形式，jsx一个{}内只能有一条表达式，多条需要用数组表示 */
        path.replaceWith(types.arrayExpression([newNode, path.node]));
        /** replace之后需要跳过新节点的遍历 */
        path.skip();
      } else {
        /** 一般情况下直接insert */
        path.insertBefore(newNode);
      }
    }
  },
});

const { code, map } = generate(ast);
console.log(code);
