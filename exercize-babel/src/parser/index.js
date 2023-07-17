const acorn = require("acorn");

const syntaxPlugins = {
  literal: require("./plugins/literal"),
  guangKeyword: require("./plugins/guangKeyword"),
};

const defaultOptions = {
  plugins: [],
};

// 用于根据传入的options，从syntaxPlugins的Map映射中扩展原有的parser
function parse(code, options) {
  const resolvedOptions = Object.assign({}, defaultOptions, options);
  const newParser = resolvedOptions.plugins.reduce((Parser, pluginName) => {
    let plugin = syntaxPlugins[pluginName];
    return plugin ? Parser.extend(plugin) : Parser;
  }, acorn.Parser);
  return newParser.parse(code, {
    locations: true, //保留ast在源码中的位置信息，用于生成sourcemap文件
  });
}

module.exports = {
  parse,
};
