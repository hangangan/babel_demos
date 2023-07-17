const { visitorKeys } = require("../types");
const NodePath = require("./path/NodePath");

module.exports = function traverse(
  node,
  visitors,
  parent,
  parentPath,
  key,
  listKey
) {
  const defination = visitorKeys.get(node.type);
  let visitorFuncs = visitors[node.type] || {};

  if (typeof visitorFuncs === "function") {
    visitorFuncs = {
      enter: visitorFuncs,
    };
  }

  //   构建path
  const path = new NodePath(node, parent, parentPath, key, listKey);

  //   调用处理当前节点的visitor（enter）
  visitorFuncs.enter && visitorFuncs.enter(path);

  if (node.__shouldSkip) {
    delete node.__shouldSkip;
    return;
  }

  // 遍历ast的可遍历属性
  if (defination.visitor) {
    defination.visitor.forEach((key) => {
      const prop = node[key];
      //   递归-深度优先遍历
      if (Array.isArray(prop)) {
        prop.forEach((childNode, index) => {
          traverse(childNode, visitors, node, path, key, index);
        });
      } else {
        traverse(prop, visitors, node, path, key);
      }
    });
  }

  //   调用处理当前节点的visitor（exit）
  visitorFuncs.exit && visitorFuncs.exit(path);
};
