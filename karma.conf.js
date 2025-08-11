/* global require, Buffer, process, module */

const fs = require('fs');
const { firefox, chromium, webkit } = require('playwright');
process.env.CHROME_BIN = chromium.executablePath();
process.env.FIREFOX_BIN = firefox.executablePath();
process.env.WEBKIT_HEADLESS_BIN = webkit.executablePath();

// karma does not recognise the file as binary and automatically converts it to utf8 to apply preprocessors.
// Using a middleware to load the file prevents the transformation and preserves the charset information.
function charsets_middleware() {
  return function (request, response, next) {
    const match = request.url.match(/[/\w+]*charsets/);
    if (match && request.method === 'GET') {
      const path = match[0].replace(/\/base/, './');
      // eslint-disable-next-line no-undef
      const data = Buffer.from(fs.readFileSync(path));
      response.setHeader('Content-Type', 'application/octet-stream');
      response.setHeader('Content-Length', data.length);
      response.writeHead(200);
      return response.end(data);
    }
    next();
  }
}

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['mocha', 'webpack'],

    plugins: [
      'karma-mocha',
      'karma-webpack',
      'karma-mocha-reporter',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-webkit-launcher',
      {'middleware:charsets': ['factory', charsets_middleware]}
    ],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/test*', watched: false },
      {pattern: 'test/data/**', watched: false, included: false, served: true},
    ],

    beforeMiddleware: ['charsets'],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
        'test/test*': 'webpack'
    },

    webpack: {
      resolve: {
        extensions: ['', '.js']
      }
    },

    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['mocha'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },
        browsers: ['ChromeHeadlessCI', 'FirefoxHeadless', 'WebkitHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: Infinity
  });
};
