# BDD demo — Example Mapping → Gherkin → Allure

This folder is a **single, self-contained example** for a presentation on
behaviour-driven development. It walks the audience through the path from
*conversation* to *living documentation*, the way Matt Wynne and Seb Rose
talk about it in *Discovery: Explore Behaviour Using Example Mapping*.

```
conversation  →  example-mapping board  →  .feature file  →  Allure report
   (talk)            (Post-its)             (executable)      (audience-friendly)
```

## The example-mapping board, frozen as Gherkin

[`customising-turbine-specs.feature`](./customising-turbine-specs.feature)
is the literal output of one example-mapping session. The keywords map to
the cards on the workshop wall:

| Workshop card                | Gherkin keyword                |
|------------------------------|--------------------------------|
| 🟨 Yellow — User story        | `Feature:`                     |
| 🟦 Blue — Business rule       | `Rule:`                        |
| 🟩 Green — Concrete example   | `Example:` (or `Scenario:`)    |
| 🟥 Red — Open question        | `# QUESTION:` comment + tag    |

Open the feature file and read it top-to-bottom — every blue card on the
board has its own `Rule:` block, and each green card hangs underneath
its parent rule as an `Example:`. Two questions raised in the workshop
were deferred rather than answered; they're recorded as `# QUESTION:`
comments next to the rule they apply to, so the red cards aren't lost.

## The same shape in the Allure report

```
Discovery-and-BDD                          ← Epic    (workshop topic)
└── Customising turbine specs              ← Feature (the user story)
    ├── Rule 1 Inheritance                 ← Story   (Rule #1 — blue card)
    │   ├── A freshly placed turbine …     ← Test    (Example — green card)
    │   └── An uncustomised turbine …
    ├── Rule 2 Override decouples
    │   ├── Overriding hub height …
    │   ├── A custom turbine ignores …
    │   └── Sibling turbines stay on …
    ├── Rule 3 Reset to fleet
    │   └── A reset turbine follows …
    └── Rule 4 Promote to fleet
        ├── Promoting a custom turbine …
        └── Promoting clears overrides …
```

The `@epic:` and `@story:` tags in the feature file are what produce that
hierarchy. `@epic:` is read straight off the feature header; `@story:` is
attached to each `Rule:` and lifted onto the scenario in
[`support/world.js`](./support/world.js).

## Running it

```bash
npm run bdd                  # run the suite, write JSON to allure-results/
npm run bdd:report:generate  # convert results into a static HTML report
npm run bdd:report           # generate + open the report (interactive)
```

## How it's wired (one paragraph)

Cucumber-js is bolted onto the existing React app: a tiny CommonJS
[bootstrap file](./support/00-bootstrap.cjs) sets up JSDOM, registers
Babel for JSX, and aliases `src/WindMap.js` to its testable stub (exactly
what `jest.mock('../../WindMap')` does in the unit suite). The step
definitions then delegate every UI action to the same
[Application Driver](../src/test-support/WindFarmDriver.js) the Jest
feature-tests use, so Cucumber and Jest share one domain vocabulary —
only the test runner differs.

## Why this matters for a BDD talk

A common anti-pattern is to dump every `Given/When/Then` for a feature
into one flat list. The audience can see *what* the tests do, but not
*why* there are exactly that many of them. The `Rule:` keyword fixes this:
each blue card from the workshop becomes a visible heading in both the
source file and the report, and each example documents *one* concrete
shape of *one* rule. When a stakeholder asks "what are the rules of this
feature?", you can answer by reading the blue cards aloud.
