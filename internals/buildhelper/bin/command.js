#! /usr/bin/env node

// Execute file

const minimist = require("minimist");

const {
  _: [command = "dev"], // 'dev'|'build'|'test'
  ignore = "",
  scope = "",
} = minimist(process.argv.slice(2));

const isDev = command === "dev";

require(`../lib/${command}`)
  .default(scope.split(","), ignore.split(","))
  .then(() => {
    !isDev && console.log("[@rays/buildhelper] build all pckages");
  })
  .catch((e) => console.error(e));