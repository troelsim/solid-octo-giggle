// Cucumber World — one fresh App + driver per Scenario.
//
// The driver is the same Application Driver the Jest feature-tests use
// (src/test-support/WindFarmDriver.js).  Cucumber and Jest can therefore
// share a single domain vocabulary; only the test runner differs.

import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import { cleanup } from '@testing-library/react';
import { story } from 'allure-js-commons';
// Importing the package's index registers the BeforeAll hook that wires the
// global Allure test runtime to Cucumber's `world.attach`.  Without this,
// calls like `story()` from a step would error with "no test runtime found".
import 'allure-cucumberjs';
import { createWindFarm, clearStorage } from '../../src/test-support/WindFarmDriver';

// Extending Cucumber's World gives us `this.attach` — the channel that
// allure-cucumberjs's runtime uses to send labels/links back to the reporter.
class WindFarmWorld extends World {
  /** Boot a fresh App and stash the driver on the world. */
  start({ storage } = {}) {
    this.farm = createWindFarm({ storage });
  }
}

setWorldConstructor(WindFarmWorld);

// Each scenario starts with an empty localStorage and a clean DOM.
//
// We also look at the pickle's tags (which already aggregate Feature + Rule
// + Scenario tags by the time Cucumber calls us) and lift any `@story:<name>`
// onto the Allure result as a Story label.  This makes each Gherkin `Rule:`
// appear as its own Story group in the Allure Behaviors tree — visualising
// the example-mapping board in the report.
Before(async function ({ pickle }) {
  clearStorage();
  const storyTag = (pickle?.tags ?? []).find(t => t.name.startsWith('@story:'));
  if (storyTag) {
    await story(storyTag.name.replace(/^@story:/, '').replace(/-/g, ' '));
  }
});

After(function () {
  cleanup();
  clearStorage();
});
