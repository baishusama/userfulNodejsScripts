const compiler = require('vue-template-compiler');
const vuejsi18n = require('./vuejsi18n');
const babelParser = require('@babel/parser');

module.exports = vuetemplatei18n;

function vuetemplatei18n(templateContent) {
    let { ast } = compiler.compile(templateContent, {
        outputSourceRange: true
    });
    let needTransform = [];
    analysisAst(ast, needTransform, templateContent);
    needTransform.sort((a, b) => a.start - b.start);
    let transformedContent = '';
    if (needTransform.length === 0) {
        return templateContent;
    }
    for (let i = 0; i < needTransform.length; i++) {
        let preNode = needTransform[i - 1] || {
            end: 0
        };
        let curNode = needTransform[i];
        let needTransformString = templateContent.slice(curNode.start, curNode.end);
        let transformedString = '';
        let isNeedTransform = /[\u4e00-\u9fa5]/;
        switch (curNode.type) {
            case 'htmlAttr':
                if (!isNeedTransform.test(needTransformString)) {
                    transformedString = needTransformString;
                } else {
                    transformedString = `:${needTransformString.replace(
                        curNode.value,
                        `"$t('${curNode.value.slice(1, -1)}')"`
                    )}`;
                }
                break;
            case 'htmlDirective':
                if (!isNeedTransform.test(needTransformString)) {
                    transformedString = needTransformString;
                } else {
                    transformedString = needTransformString.replace(curNode.value, vuejsi18n(curNode.value));
                }
                break;
            case 'htmlContent':
                if (!isNeedTransform.test(needTransformString)) {
                    transformedString = needTransformString;
                } else {
                    transformedString = `{{$t('${needTransformString}')}}`;
                }
                break;
            case 'htmlDynamicAttr':
                transformedString = needTransformString.replace(curNode.value, vuejsi18n(curNode.value));
                break;
            case 'htmlDynamicContent':
                transformedString = `${curNode.tokens
                    .filter(token => {
                        if (typeof token == 'string') {
                            return !!token.replace(/\s/g, '');
                        }
                        return true;
                    })
                    .map(token => {
                        if (typeof token == 'string') {
                            if (!isNeedTransform.test(token)) {
                                return `${token}`;
                            } else {
                                return `{{$t('${token.trim()}')}}`;
                            }
                        } else {
                            let isFilter = /^_f\(/.test(token['@binding']);
                            if (isFilter) {
                                let js = token['@binding'];
                                let ast = babelParser.parse(js, {
                                    range: true,
                                    sourceType: 'module'
                                });
                                let filters = [];
                                filters.unshift(parseFilter(ast.program.body[0].expression, filters, js));
                                return `{{${filters.join(' | ')}}}`;
                            } else {
                                return `{{${vuejsi18n(token['@binding'])}}}`;
                            }
                        }
                    })
                    .join('')}`;
                break;
            default:
                throw new Error('没有类型');
                break;
        }
        if (i != needTransform.length - 1) {
            transformedContent += `${templateContent.slice(preNode.end, curNode.start)}${transformedString}`;
        } else {
            transformedContent += `${templateContent.slice(
                preNode.end,
                curNode.start
            )}${transformedString}${templateContent.slice(curNode.end)}`;
        }
    }
    return transformedContent;
}
function parseFilter(ast, filters, js) {
    while (
        ast.callee &&
        ast.callee.callee &&
        ast.callee.callee.type == 'Identifier' &&
        ast.callee.callee.name == '_f'
    ) {
        filters.unshift(ast.callee.arguments[0].value);
        ast = ast.arguments[0];
    }
    return vuejsi18n(js.slice(ast.start, ast.end));
}
function calcOffset(whole, child) {
    return whole.indexOf(child);
}
function analysisAst(ast, array, templateContent) {
    ast.directives &&
        ast.directives.map(directive => {
            if (directive.value == '""') {
                return;
            }
            let isFilter = /^_f\(/.test(directive.value);
            if (isFilter) {
                console.log('不支持' + directive.value);
                return;
            }
            let start = directive.start;
            let end = directive.end;
            let offset = 0;
            while (calcOffset(templateContent.slice(start + offset, end + offset), directive.value) == -1) {
                offset++;
            }

            let type = 'htmlDirective';
            array.push({
                start: start + offset,
                end: end + offset,
                value: directive.value,
                type
            });
        });
    ast.attrs &&
        ast.attrs.map(attr => {
            if (attr.value == '""') {
                return;
            }
            let isFilter = /^_f\(/.test(attr.value);
            if (isFilter) {
                console.log('不支持' + attr.value);
                return;
            }
            let start = attr.start;
            let end = attr.end;
            let offset = 0;
            while (calcOffset(templateContent.slice(start + offset, end + offset), attr.value) == -1) {
                offset++;
            }
            let whitespacelength =
                templateContent.slice(start + offset, end + offset).length -
                templateContent.slice(start + offset, end + offset).replace(/^\s{1,}/, '').length;
            offset += whitespacelength;
            let type = '';
            if (attr.dynamic === undefined) {
                type = 'htmlAttr';
            } else {
                type = 'htmlDynamicAttr';
            }
            array.push({
                start: start + offset,
                end: end + offset,
                value: attr.value,
                type
            });
        });
    //type 为 1 表示是普通元素，为 2 表示是表达式，为 3 表示是纯文本
    if (ast.type == 3) {
        let start = ast.start;
        let offset = calcOffset(templateContent.slice(start), ast.text.trim());
        array.push({
            start: start + offset,
            end: start + ast.text.trim().length + offset,
            type: 'htmlContent'
        });
    }
    if (ast.type == 2) {
        let start = ast.start;
        let offset = calcOffset(templateContent.slice(start), ast.text.trim());
        array.push({
            start: start + offset,
            end: start + ast.text.trim().length + offset,
            tokens: ast.tokens,
            type: 'htmlDynamicContent'
        });
    }
    if (ast.children) {
        ast.children.map(childNode => {
            analysisAst(childNode, array, templateContent);
        });
    }
    if (ast.ifConditions) {
        ast.ifConditions.map((childNode, index) => {
            if (index == 0) return;
            analysisAst(childNode.block, array, templateContent);
        });
    }
}
