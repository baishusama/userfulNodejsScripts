const querystring = require('querystring');

const got = require('got');
const safeEval = require('safe-eval');

const token = require('./token.js');
const languages = require('./languages');

function translate(text, opts) {
  opts = opts || {};

  let e;
  [opts.from, opts.to].forEach(function(lang) {
    if (lang && !languages.isSupported(lang)) {
      e = new Error();
      e.code = 400;
      e.message = "The language '" + lang + "' is not supported";
    }
  });
  if (e) {
    return new Promise(function(resolve, reject) {
      reject(e);
    });
  }

  opts.from = opts.from || 'auto';
  opts.to = opts.to || 'zh-cn';

  opts.from = languages.getCode(opts.from);
  opts.to = languages.getCode(opts.to);

  return token
    .get(text)
    .then(function({ name, value, cookie }) {
      const url = 'https://translate.google.cn/translate_a/single';
      const data = {
        client: 'webapp',
        sl: opts.from,
        tl: opts.to,
        hl: opts.to,
        dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
        ie: 'UTF-8',
        oe: 'UTF-8',
        otf: 1,
        ssel: 0,
        tsel: 0,
        kc: 7,
        q: text
      };
      data[name] = value;

      return {
        url: url + '?' + querystring.stringify(data),
        cookie
      };
    })
    .then(function({ url, cookie }) {
      return got(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36',
          referer: 'https://translate.google.cn/',
          cookie
        }
      }).then(function(res) {
        var result = {
          text: '',
          from: {
            language: {
              didYouMean: false,
              iso: ''
            },
            text: {
              autoCorrected: false,
              value: '',
              didYouMean: false
            }
          },
          raw: ''
        };

        if (opts.raw) {
          result.raw = res.body;
        }

        var body = safeEval(res.body);
        body[0].forEach(function(obj) {
          if (obj[0]) {
            result.text += obj[0];
          }
        });

        if (body[2] === body[8][0][0]) {
          result.from.language.iso = body[2];
        } else {
          result.from.language.didYouMean = true;
          result.from.language.iso = body[8][0][0];
        }

        if (body[7] && body[7][0]) {
          let str = body[7][0];

          str = str.replace(/<b><i>/g, '[');
          str = str.replace(/<\/i><\/b>/g, ']');

          result.from.text.value = str;

          if (body[7][5] === true) {
            result.from.text.autoCorrected = true;
          } else {
            result.from.text.didYouMean = true;
          }
        }

        return result;
      });
    });
}

module.exports = translate;
module.exports.languages = languages;