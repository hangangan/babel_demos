const { declare } = require("@babel/helper-plugin-utils");
const importModule = require("@babel/helper-module-imports");

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  /** ------------Path------------- */

  // path.node 当前 AST 节点
  // path.parent 父 AST 节点
  // path.parentPath 父 AST 节点的 path
  // path.scope 作用域
  // path.hub 可以通过 path.hub.file 拿到最外层 File 对象， path.hub.getScope 拿到最外层作用域，path.hub.getCode 拿到源码字符串
  // path.container 当前 AST 节点所在的父节点属性的属性值
  // path.key 当前 AST 节点所在父节点属性的属性名或所在数组的下标
  // path.listkey 当前 AST 节点所在父节点属性的属性值为数组时 listkey 为该属性名，否则为 undefined

  // get(key) 获取某个属性的 path
  // set(key, node) 设置某个属性的值
  // getSibling(key) 获取某个下标的兄弟节点
  // getNextSibling() 获取下一个兄弟节点
  // getPrevSibling() 获取上一个兄弟节点
  // getAllPrevSiblings() 获取之前的所有兄弟节点
  // getAllNextSiblings() 获取之后的所有兄弟节点
  // find(callback) 从当前节点到根节点来查找节点（包括当前节点），调用 callback（传入 path）来决定是否终止查找
  // findParent(callback) 从当前节点到根节点来查找节点（不包括当前节点），调用 callback（传入 path）来决定是否终止查找
  // inList() 判断节点是否在数组中，如果 container 为数组，也就是有 listkey 的时候，返回 true
  // isXxx(opts) 判断当前节点是否是某个类型，可以传入属性和属性值进一步判断，比如path.isIdentifier({name: 'a'})
  // assertXxx(opts) 同 isXxx，但是不返回布尔值，而是抛出异常
  // insertBefore(nodes) 在之前插入节点，可以是单个节点或者节点数组
  // insertAfter(nodes) 在之后插入节点，可以是单个节点或者节点数组
  // replaceWith(replacement) 用某个节点替换当前节点
  // replaceWithMultiple(nodes) 用多个节点替换当前节点
  // replaceWithSourceString(replacement) 解析源码成 AST，然后替换当前节点
  // remove() 删除当前节点
  // traverse(visitor, state) 遍历当前节点的子节点，传入 visitor 和 state（state 是不同节点间传递数据的方式）
  // skip() 跳过当前节点的子节点的遍历
  // stop() 结束所有遍历

  // scope.bindings 当前作用域内声明的所有变量
  // scope.block 生成作用域的 block，详见下文
  // scope.path 生成作用域的节点对应的 path
  // scope.references 所有 binding 的引用对应的 path，详见下文
  // scope.dump() 打印作用域链的所有 binding 到控制台
  // scope.parentBlock 父级作用域的 block
  // getAllBindings() 从当前作用域到根作用域的所有 binding 的合并
  // getBinding(name) 查找某个 binding，从当前作用域一直查找到根作用域
  // getOwnBinding(name) 从当前作用域查找 binding
  // parentHasBinding(name, noGlobals) 查找某个 binding，从父作用域查到根作用域，不包括当前作用域。可以通过 noGlobals 参数指定是否算上全局变量（比如console，不需要声明就可用），默认是 false
  // removeBinding(name) 删除某个 binding
  // hasBinding(name, noGlobals) 从当前作用域查找 binding，可以指定是否算上全局变量，默认是 false
  // moveBindingTo(name, scope) 把当前作用域中的某个 binding 移动到其他作用域
  // generateUid(name) 生成作用域内唯一的名字，根据 name 添加下划线，比如 name 为 a，会尝试生成 _a，如果被占用就会生成 __a，直到生成没有被使用的名字。

  return {
    visitor: {
      // here---对Program节点进行处理【是整个文件的容器】
      Program: {
        enter(path, state) {
          //here---需要在enter时就拿到tracker的方法名，后续才能够拼接成调用形式
          path.traverse({
            /**
             * 首先要判断是否被引入过：
             * 在 Program 根结点里通过 path.traverse 来遍历 ImportDeclaration，如果引入了 tracker 模块，就记录 id 到 state，并用 path.stop 来终止后续遍历；
             * 没有就引入 tracker 模块，用 generateUid 生成唯一 id，然后放到 state。
             */
            // here---对import声明语句进行处理
            ImportDeclaration(curPath) {
              //here---import声明语句具有source属性，保存了模块来源【即import xxx from [source] 】
              const requirePath = curPath.get("source").node.value;
              if (requirePath === options.trackerPath) {
                //在该import节点引入了tracker模块
                const specifierPath = curPath.get("specifiers.0"); //here---import语句具有secifier属性，保存了引入了xx模块,值是一个数组【即import [specifier] from xxx】,此处获取到了第一个模块节点的path
                if (specifierPath.isImportSpecifier()) {
                  //here---模块节点具有isImportSpecifier方法，用于判断该模块的type，type用于表示是以什么模式导出的
                  // here---通过state保存模块名，用于后续拼接成方法调用
                  state.trackerImportId = specifierPath.toString();
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  state.trackerImportId = specifierPath.get("local").toString();
                }
                // here---已经找到导入语句并获取到模块名之后就不需要再遍历import了，所以需要调用stop结束遍历
                path.stop();
              }
            },
          });
          // here---没有就引入 tracker 模块，用 generateUid 生成唯一 id，然后放到 state
          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, "tracker", {
              nameHint: path.scope.generateUid("tracker"),
            }).name;
            state.trackerAST = api.template.statement(
              `${state.trackerImportId}()`
            )();
          }
        },
      },
      "ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration"(
        path,
        state
      ) {
        const bodyPath = path.get("body");
        if (bodyPath.isBlockStatement()) {
          // 有函数体就在开始插入埋点代码
          bodyPath.node.body.unshift(state.trackerAST);
        } else {
          const ast = api.template.statement(
            // 没有函数体要包裹一下，处理下返回值
            `{${state.trackerImportId}();return PREV_BODY;}`
          )({ PREV_BODY: bodyPath.node });
          bodyPath.replaceWith(ast);
        }
      },
    },
  };
});
module.exports = autoTrackPlugin;
