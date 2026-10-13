import { fireEvent, render, screen } from '@testing-library/react';
import RecognitionRecipients from './RecognitionRecipients';
test('shows every recipient with their own profile link', () => {
  const onOpen = jest.fn();
  render(<RecognitionRecipients recognition={{ receivers: [{ id: 2, name: 'Ana' }, { id: 3, name: 'Luis' }] }} onOpenProfile={onOpen} />);
  fireEvent.click(screen.getByRole('button', { name: 'Luis' }));
  expect(screen.getByRole('button', { name: 'Ana' })).toBeInTheDocument();
  expect(onOpen).toHaveBeenCalledWith(3);
});
test('keeps older single-person recognitions readable', () => {
  render(<RecognitionRecipients recognition={{ receiver_id: 2, receiver_name: 'Ana' }} />);
  expect(screen.getByRole('button', { name: 'Ana' })).toBeInTheDocument();
});
