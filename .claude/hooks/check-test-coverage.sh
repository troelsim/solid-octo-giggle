#!/usr/bin/env bash
# Stop hook: warn when source files changed but no tests were updated.
# Outputs JSON with systemMessage + additionalContext when triggered.

cd /home/user/solid-octo-giggle || exit 0

# Collect all modified/new files (staged, unstaged, untracked)
changed=$(
  git diff --name-only HEAD 2>/dev/null
  git ls-files --others --exclude-standard 2>/dev/null
)

# Source files under src/ (exclude test infrastructure)
src=$(echo "$changed" \
  | grep -E '^src/.+\.js$' \
  | grep -vE '(/__tests__/|/__mocks__/|/test-support/)')

# Test files
tests=$(echo "$changed" \
  | grep -E '^src/__tests__/.+\.test\.js$')

if [ -n "$src" ] && [ -z "$tests" ]; then
  echo '{"systemMessage":"Source files changed without test updates \u2014 test coverage is the highest design objective.","hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"WARNING: Source files were modified but no tests were added or updated. Test coverage is the highest design objective for this project. Add or update tests in src/__tests__/features/ before finishing."}}'
fi
