const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeUserSearch } = require('../src/services/userSearchNormalization');
test('search treats upper, lower and mixed case names equally', () => {
  assert.equal(normalizeUserSearch('LUIS LÓPEZ'), normalizeUserSearch('luis lópez'));
  assert.equal(normalizeUserSearch('Luis López'), normalizeUserSearch('lUiS lÓpEz'));
});
test('search tolerates missing accents and extra whitespace', () => {
  assert.equal(normalizeUserSearch('  LUIS   LÓPEZ  '), 'luis lopez');
});
test('control numbers remain searchable', () => {
  assert.equal(normalizeUserSearch(' 220113032 '), '220113032');
});
