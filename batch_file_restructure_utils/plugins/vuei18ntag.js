const prettier = require('prettier');
const compiler = require('vue-template-compiler');
const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const translate = require('./google-translate-cn');

module.exports = vuei18ntag;
async function vuei18ntag(parse, content) {
    let containi18nNodes = [];
    let { ast: templateAst } = compiler.compile(parse.template.content, {
        outputSourceRange: true
    });
    let i18nScript = [];
    analysisAst(templateAst, containi18nNodes);
    containi18nNodes.push(parse.script.content);
    containi18nNodes.map(node => {
        if (Array.isArray(node)) {
            node.map(token => {
                if (typeof token == 'string') {
                    return;
                }
                analysisJs(token['@binding'], i18nScript);
            });
        } else {
            analysisJs(node, i18nScript);
        }
    });
    let hasi18n = parse.customBlocks.some(block => block.type == 'i18n');
    let i18n = parse.customBlocks.find(block => block.type == 'i18n') || {
        content: JSON.stringify({ cn: {} })
    };
    let json = JSON.parse(i18n.content.replace(/\r|\n/, ''));
    if(!json.en){
        json.en={}
    }
    i18nScript.map(script => {
        if (!json.cn[script]) {
            json.cn[script] = script;
        }
    });
    await asyncTranslateToEN(json);
    let formated = prettier.format(JSON.stringify(json, null, ' '), {
        printWidth: 120,
        singleQuote: true,
        tabWidth: 4,
        parser: 'json'
    });
    if (hasi18n) {
        content = content.slice(0, i18n.start) + `\r\n${formated}` + content.slice(i18n.end);
    } else {
        content = `<i18n>\r\n${formated}</i18n>\r\n` + content;
    }
    return content;
}
async function sleep(time){
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, time);
    });
}
async function asyncTranslateToEN(obj) {
    const textArr = Object.values(obj.cn).map(val => val);

    for(let i =0;i<textArr.length;i++){
        let item = textArr[i];
        let res = await translate(item, { from: 'auto', to: 'en' });
        obj.en[item]=res.text;
        await sleep(100);
    }
}
function analysisAst(ast, array) {
    ast.directives &&
        ast.directives.map(directive => {
            array.push(directive.value);
        });
    ast.attrs &&
        ast.attrs.map(attr => {
            if (attr.dynamic === undefined) {
                return;
            }
            array.push(attr.value);
        });
    //type 为 1 表示是普通元素，为 2 表示是表达式，为 3 表示是纯文本
    if (ast.type == 2) {
        array.push(ast.tokens);
    }
    if (ast.children) {
        ast.children.map(childNode => {
            analysisAst(childNode, array);
        });
    }
    if (ast.ifConditions) {
        ast.ifConditions.map((childNode, index) => {
            if (index == 0) return;
            analysisAst(childNode.block, array);
        });
    }
}
function analysisJs(js, i18nScript) {
    try {
        if (eval(`typeof ${js}`) == 'object') {
            js = `(${js})`;
        }
    } catch (error) {}
    let jsAst = babelParser.parse(js, {
        range: true,
        sourceType: 'module'
    });
    traverse(jsAst, {
        enter(path) {
            if (path.isCallExpression()) {
                let callee = path.node.callee;
                let property = callee.property || {};
                if (property.type == 'Identifier' && property.name == '$t') {
                    path.node.arguments.map(node => {
                        if (node.type == 'StringLiteral' || node.type == 'DirectiveLiteral') {
                            i18nScript.push(node.value);
                        }
                        if (node.type == 'TemplateLiteral') {
                            node.quasis.map(quasis => {
                                i18nScript.push(quasis.value.raw);
                            });
                        }
                    });
                    path.stop();
                }
            }
            if (path.isIdentifier({ name: '$t' })) {
                path.parent.arguments.map(node => {
                    if (node.type == 'StringLiteral' || node.type == 'DirectiveLiteral') {
                        i18nScript.push(node.value);
                    }
                    if (node.type == 'TemplateLiteral') {
                        node.quasis.map(quasis => {
                            i18nScript.push(quasis.value.raw);
                        });
                    }
                });
                path.stop();
            }
        }
    });
}
