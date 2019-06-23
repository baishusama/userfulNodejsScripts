const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
module.exports = vuejsi18n;
function vuejsi18n(js, needThis = false) {
    let isJSON = false;
    try {
        if (eval(`typeof ${js}`) == 'object') {
            js = `(${js})`;
            isJSON = true;
        }
    } catch (error) {
        console.log('111');
    }
    let ast = babelParser.parse(js, {
        range: true,
        sourceType: 'module'
    });
    let needTransform = [];
    traverse(ast, {
        enter(path) {
            if (path.isIdentifier({ name: '$t' })) {
                path.stop();
                return;
            }
            if (path.isStringLiteral() || path.isTemplateLiteral() || path.isDirectiveLiteral()) {
                let node = path.node;
                let start = node.start;
                let end = node.end;
                if (isJSON) {
                    start--;
                    end--;
                }
                needTransform.push({
                    start,
                    end
                });
            }
        }
    });
    let transformedContent = '';
    if (needTransform.length) {
        for (let i = 0; i < needTransform.length; i++) {
            let preNode = needTransform[i - 1] || {
                end: 0
            };
            let curNode = needTransform[i];
            let needTransformString = js.slice(curNode.start, curNode.end);
            let isNeedTransform = /[\u4e00-\u9fa5]/;
            if (!isNeedTransform.test(needTransformString)) {
                transformedString = needTransformString;
            } else {
                if (needThis) {
                    transformedString = `this.$t(${needTransformString})`;
                } else {
                    transformedString = `$t(${needTransformString})`;
                }
            }
            if (i != needTransform.length - 1) {
                transformedContent += `${js.slice(preNode.end, curNode.start)}${transformedString}`;
            } else {
                transformedContent += `${js.slice(preNode.end, curNode.start)}${transformedString}${js.slice(
                    curNode.end
                )}`;
            }
        }
    } else {
        transformedContent = js;
    }

    return transformedContent;
}
