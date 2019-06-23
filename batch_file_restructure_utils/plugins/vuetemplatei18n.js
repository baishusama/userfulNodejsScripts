const compiler = require('vue-template-compiler');
const vuejsi18n = require('./vuejsi18n');
module.exports = vuetemplatei18n;

function vuetemplatei18n(templateContent) {
    let { ast } = compiler.compile(templateContent, {
        outputSourceRange: true
    });
    let needTransform = [];
    analysisAst(ast, needTransform, templateContent);
    let transformedContent = '';
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
                            return `{{${vuejsi18n(token['@binding'])}}}`;
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
function calcOffset(whole, child) {
    return whole.indexOf(child);
}
function analysisAst(ast, array, templateContent) {
    ast.attrs &&
        ast.attrs.map(attr => {
            let start = attr.start;
            let end = attr.end;
            let offset = 0;
            while (calcOffset(templateContent.slice(start + offset, end + offset), attr.value) == -1) {
                offset++;
            }
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
        let end = ast.end;
        let offset = calcOffset(templateContent.slice(start), ast.text.trim());
        array.push({
            start: start + offset,
            end: start + ast.text.trim().length + offset,
            type: 'htmlContent'
        });
    }
    if (ast.type == 2) {
        let start = ast.start;
        let end = ast.end;
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
