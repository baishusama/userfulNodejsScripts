//git ignoreRules
const ignoreRules = ['*.png', '*.ttf', '*.woff', '*.svg', '*.eot'];
const prettier = require('prettier');
const fs = require('fs');
const file = require('file');
const ignore = require('ignore');
const ig = ignore().add(ignoreRules);
let dirs = ['./'];
let files = [];

(async function() {
    try {
        while (dirs.length != 0) {
            dirs = ig.filter(dirs);
            let promises = dirs.map(dir => getInfo(dir));
            let results = await Promise.all(promises);
            dirs = [];
            results.map(result => {
                if (result[0]) return new Error(result[0]);
                result[3] = ig.filter(result[3]);
                dirs = [...dirs, ...result[2]];
                files = [...files, ...result[3]];
            });
        }
        files.map(file => {
            try {
                const text = fs.readFileSync(file, 'utf8');
                const formatted = prettier.format(text, {
                    printWidth: 120,
                    singleQuote: true,
                    tabWidth: 4,
                    filepath: file
                });
                fs.writeFileSync(file, formatted);
            } catch (e) {
                console.log(e.message);
            }
        });
    } catch (e) {
        console.log(e);
    } finally {
        console.log('batch doned');
    }
})();
function getInfo(dir) {
    return new Promise(resolve => file.walk(dir, (...info) => resolve(info)));
}
