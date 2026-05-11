// Cucumber.js runner config.
//
// Files are required in array order, so the JSDOM/Babel bootstrap MUST come
// first — every later support / step file relies on the globals it sets up.
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/00-bootstrap.cjs',
      'features/support/world.js',
      'features/step_definitions/**/*.js',
    ],
    format: [
      'summary',
      'progress-bar',
      'allure-cucumberjs/reporter',
    ],
    formatOptions: {
      resultsDir: 'allure-results',
    },
    publishQuiet: true,
  },
};
