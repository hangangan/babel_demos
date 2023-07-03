const parser = require("@babel/parser");
/**因为 @babel/parser 等包都是通过 es module 导出的，所以通过 commonjs 的方式引入有的时候要取 default 属性。 */
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const types = require("@babel/types");

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

// parse用于遍历生成ast
/**
 * plugins： 指定jsx、typescript、flow 等插件来解析对应的语法
 * allowXxx： 指定一些语法是否允许，比如函数外的 await、没声明的 export等
 * sourceType： 指定是否支持解析模块语法，有 module、script、unambiguous 3个取值：
 * - module：解析 es module 语法
 * - script：不解析 es module 语法
 * - unambiguous：根据内容是否有 import 和 export 来自动设置 module 还是 script
 * strictMode 是否是严格模式
 * startLine 从源码哪一行开始 parse
 * errorRecovery 出错时是否记录错误并继续往下 parse
 * tokens parse 的时候是否保留 token 信息
 * ranges 是否在 ast 节点中添加 ranges 属性
 */
const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
});

/**
 * ----------traverse用于遍历和修改ast-------------------------
 */

// traverse(ast, {
//   FunctionDeclaration: {
//       enter(path, state) {}, // 进入节点时调用
//       exit(path, state) {} // 离开节点时调用
//   }
// })

// traverse(ast, {
//   FunctionDeclaration(path, state) {} // 进入节点时调用
// })

// 进入 FunctionDeclaration 和 VariableDeclaration 节点时调用
// traverse(ast, {
//   'FunctionDeclaration|VariableDeclaration'(path, state) {}
// })

// 各种 XxxStatement 有个 Statement 的别名，各种 XxxDeclaration 有个 Declaration 的别名，可以通过别名来指定对这些 AST 的处理
// 通过别名指定离开各种 Declaration 节点时调用
// traverse(ast, {
//   Declaration: {
//       exit(path, state) {}
//   }
// })

/**
 * ----------通过 path 完成对 AST 的操作-------------------------
 */

// path.node 指向当前 AST 节点
// path.parent 指向父级 AST 节点
// path.getSibling、path.getNextSibling、path.getPrevSibling 获取兄弟节点
// path.find 从当前节点向上查找节点
// path.get、path.set 获取 / 设置属性的 path
// path.scope 获取当前节点的作用域信息
// path.isXxx 判断当前节点是不是 xx 类型
// path.assertXxx 判断当前节点是不是 xx 类型，不是则抛出异常
// path.insertBefore、path.insertAfter 插入节点
// path.replaceWith、path.replaceWithMultiple、replaceWithSourceString 替换节点
// path.remove 删除节点
// path.skip 跳过当前节点的子节点的遍历
// path.stop 结束后续遍历

/**
 * ---------- state 用于不同节点之间传递数据-------------------------
 */

/**
 * ---------- @babel/types 包用于创建一些 AST 和判断 AST 的类型 ----------------
 * ----------  @babel/template 包支持批量创建 ----------------
 */
traverse(ast, {
  CallExpression(path, state) {
    /**
     * CallExrpession 节点有两个属性，callee 和 arguments，分别对应调用的函数名和参数， 所以我们要判断当 callee 是 console.xx 时，在 arguments 的数组中中插入一个 AST 节点。
     * https://astexplorer.net/#/gist/09113e146fa04044e99f8a98434a01af/80bef2b9068991f7a8e4f113ff824f56e3292253
     */
    /**
     * 判断当 callee 部分是成员表达式，并且是 console.xxx 时，那在参数中插入文件名和行列号，行列号从 AST 的公共属性 loc 上取。
     */
    if (
      types.isMemberExpression(path.node.callee) &&
      path.node.callee.object.name === "console" &&
      ["log", "info", "error", "debug"].includes(path.node.callee.property.name)
    ) {
      const { line, column } = path.node.loc.start;
      path.node.arguments.unshift(
        types.stringLiteral(`filename: (${line}, ${column})`)
      );
    }
  },
});

/**
 * -------------- 通过 @babel/generator 包将转换完之后 AST 打印成目标代码字符串 ------------------
 * 第一个参数是要打印的 AST。
 * 第二个参数是 options，指定打印的一些细节，比如通过 comments 指定是否包含注释，通过 minified 指定是否包含空白字符。
 * 第三个参数当多个文件合并打印的时候需要用到，这部分直接看文档即可，基本用不到。
 */
const { code, map } = generate(ast);
console.log(code);
