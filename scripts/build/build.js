#!/usr/bin/env node
const { join } = require("path");
const spawn = require("cross-spawn");
const makeProxies = require("./makeProxies");
const makeGitignore = require("./makeGitignore");

makeGitignore(process.cwd());
makeProxies(process.cwd());

spawn.sync("rollup", ["-c", join(__dirname, "rollup.config.js")], {
  stdio: "inherit"
});
