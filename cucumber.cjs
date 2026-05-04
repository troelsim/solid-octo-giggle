// Cucumber.js runner config.
//
// Files are required in array order, so the JSDOM/Babel bootstrap MUST come
// first — every later support / step file relies on the globals it sets up.
//
// `formatOptions.labels` mirrors the example-mapping board structure into
// the Allure "Behaviors" tree:
//   @epic:<x>   →  Epic   (the workshop topic / theme)
//   @story:<x>  →  Story  (one Rule = one Story = one group of Examples)
// allure-cucumberjs strips the "@<word>:" prefix from a tag and uses the
// rest as the label value, which is why we kebab-case the multi-word
// Rule names (Cucumber tags can't contain whitespace).
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
      labels: [
        { name: 'epic',  pattern: [/^@epic:/] },
        { name: 'story', pattern: [/^@story:/] },
      ],
    },
    publishQuiet: true,
  },
};
