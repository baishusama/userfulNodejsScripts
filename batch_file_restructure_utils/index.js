const fs = require('fs');
const path = require('path');
const compiler = require('vue-template-compiler');
const glob = require('glob');
const vuetemplatei18n = require('./plugins/vuetemplatei18n');
const vuejsi18n = require('./plugins/vuejsi18n');
const vuei18ntag = require('./plugins/vuei18ntag');

let allProcesses = {
    vue: compileVueMiddleware
};

function compileVueMiddleware(file) {
    parse = compiler.parseComponent(file.content);
    if (parse.template) {
        let updated = vuetemplatei18n(parse.template.content);
        console.log(updated);
        file.content = file.content.slice(0, parse.template.start) + updated + file.content.slice(parse.template.end);
    }
    // parse = compiler.parseComponent(file.content);
    // if (parse.script) {
    //     let updated = vuejsi18n(parse.script.content, true);
    //     file.content = file.content.slice(0, parse.script.start) + updated + file.content.slice(parse.script.end);
    // }
    // parse = compiler.parseComponent(file.content);
    // file.content = vuei18ntag(parse, file.content);
    return file;
}

let filePaths = [];
filePaths = glob.sync('i18n/**/*.vue');
filePaths.map(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    let extname = path.extname(filePath).slice(1);
    if (!allProcesses[extname]) {
        return;
    }
    let file = allProcesses[extname]({ content, filePath });
    // fs.writeFileSync(file.filePath, file.content);
});
console.log('batch doned');
