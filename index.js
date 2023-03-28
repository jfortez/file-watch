const chokidar = require("chokidar");
const { readFileSync, unlinkSync, writeFileSync } = require("fs");
const { parseStringPromise } = require("xml2js");

const filePath = "./web.config";
const getFileContent = (path) => {
  return new Promise(async (resolve, reject) => {
    try {
      const webConfig = readFileSync(filePath, "utf-8");
      const webConfigJSON = await parseStringPromise(webConfig);
      // get every env var from appSettings
      const appSettings = webConfigJSON?.configuration?.appSettings[0]?.add || [];

      // get the value of the env var
      let envVariables = {};
      appSettings.forEach(({ $ }) => {
        const key = $.key;
        const value = $.value;
        envVariables[key] = value;
      });
      // return the env var
      resolve(envVariables);
    } catch (error) {
      reject(error);
    }
  });
};

const watcher = chokidar.watch(filePath, { persistent: true });
let previousEnvs = {};
const onChangeFile = async (file) => {
  const envs = await getFileContent();
  if (JSON.stringify(previousEnvs) === JSON.stringify(envs)) {
    return;
  }
  // remove env.js file
  unlinkSync("./env.js");
  // create env.js file
  const envFile = `window.__envs__ = ${JSON.stringify(envs)};`;
  writeFileSync("./env.js", envFile);

  log(`File ${file} has been changed!`);
  previousEnvs = envs;
};
// Something to use when events are received.
const log = (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
// Add event listeners.
watcher.on("change", onChangeFile);
