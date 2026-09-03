const fs=require('fs'),vm=require('vm');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/schema.js','utf8'),sandbox);module.exports=sandbox.window.DPV3_SCHEMA;
