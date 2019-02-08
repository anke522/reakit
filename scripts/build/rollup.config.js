const babel = require("rollup-plugin-babel");
const resolve = require("rollup-plugin-node-resolve");
const replace = require("rollup-plugin-replace");
const commonjs = require("rollup-plugin-commonjs");
const { uglify } = require("rollup-plugin-uglify");
const ignore = require("rollup-plugin-ignore");
const { camelCase, upperFirst } = require("lodash");
const getIndexPath = require("./getIndexPath");
const getPublicFiles = require("./getPublicFiles");
const getSourcePath = require("./getSourcePath");
const { getPackage, getModuleDir, getMainDir } = require("./pkg");

const cwd = process.cwd();
const pkg = getPackage(cwd);
const sourcePath = getSourcePath(cwd);
const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

// Keeps subdirectories and files belonging to our dependencies as external too
// (i.e. lodash/pick)
function makeExternalPredicate(externalArr) {
  if (!externalArr.length) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return id => pattern.test(id);
}

function getExternal(isUMD) {
  const external = Object.keys(pkg.peerDependencies || {});
  const allExternal = [...external, ...Object.keys(pkg.dependencies || {})];
  return makeExternalPredicate(isUMD ? external : allExternal);
}

function getPlugins(isUMD) {
  const commonPlugins = [
    babel({
      extensions,
      exclude: ["node_modules/**", "../../node_modules/**"]
    }),
    resolve({ extensions, preferBuiltins: false })
  ];

  if (isUMD) {
    return [
      ...commonPlugins,
      commonjs({ include: /node_modules/ }),
      ignore(["stream"]),
      uglify(),
      replace({ "process.env.NODE_ENV": JSON.stringify("production") })
    ];
  }

  return commonPlugins;
}

function getOutput(isUMD) {
  if (isUMD) {
    return {
      name: upperFirst(camelCase(pkg.name)),
      file: pkg.unpkg,
      format: "umd",
      exports: "named",
      globals: {
        reakit: "Reakit",
        react: "React",
        "react-dom": "ReactDOM"
      }
    };
  }

  const moduleDir = getModuleDir(cwd);

  return [
    moduleDir && {
      format: "es",
      dir: moduleDir
    },
    {
      format: "cjs",
      dir: getMainDir(cwd),
      exports: "named"
    }
  ].filter(Boolean);
}

function getInput(isUMD) {
  if (isUMD) {
    return getIndexPath(sourcePath);
  }
  return getPublicFiles(sourcePath);
}

function getConfig(isUMD) {
  return {
    external: getExternal(isUMD),
    plugins: getPlugins(isUMD),
    output: getOutput(isUMD),
    input: getInput(isUMD)
  };
}

module.exports = [getConfig(), pkg.unpkg && getConfig(true)].filter(Boolean);
