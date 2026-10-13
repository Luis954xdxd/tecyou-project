import { compareRecentRecognitions } from './recognitionOrder';
test('newly inserted recognitions stay first even when an older timestamp is in the future', () => {
  const rows = [{ id: 10, created_at: '2099-01-01' }, { id: 11, created_at: '2026-10-13' }];
  expect(rows.sort(compareRecentRecognitions).map(row => row.id)).toEqual([11, 10]);
});
test('recent ordering handles numeric string IDs from the API', () => {
  expect([{ id: '9' }, { id: '10' }].sort(compareRecentRecognitions).map(row => row.id)).toEqual(['10', '9']);
});
