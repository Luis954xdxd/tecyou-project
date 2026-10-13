import { mergeFeed } from './mergeFeed';
const posts = [{ id: 2, created_at: '2026-10-13T12:00:00Z' }, { id: 1, created_at: '2026-10-13T10:00:00Z' }];
const challenges = [{ id: 2, created_at: '2026-10-13T11:00:00Z' }];
test('institutional posts occupy their chronological position between recognitions', () => {
  expect(mergeFeed(posts, challenges).map(entry => entry.type)).toEqual(['recognition', 'institutional', 'recognition']);
});
test('a newer recognition pushes an institutional post down naturally', () => {
  expect(mergeFeed([...posts, { id: 3, created_at: '2026-10-13T13:00:00Z' }], challenges).map(entry => entry.item.created_at)).toEqual(['2026-10-13T13:00:00Z', '2026-10-13T12:00:00Z', '2026-10-13T11:00:00Z', '2026-10-13T10:00:00Z']);
});
test('oldest ordering also includes both kinds of post', () => {
  expect(mergeFeed(posts, challenges, 'oldest').map(entry => entry.item.created_at)).toEqual(['2026-10-13T10:00:00Z', '2026-10-13T11:00:00Z', '2026-10-13T12:00:00Z']);
});
