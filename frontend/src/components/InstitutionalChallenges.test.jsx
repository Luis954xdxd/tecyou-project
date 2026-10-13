import { render, screen } from '@testing-library/react';
import axios from 'axios';
import InstitutionalChallenges from './InstitutionalChallenges';
jest.mock('axios');
test('renders institutional cards between recognitions while preserving their evidence action', async () => {
  axios.get.mockResolvedValue({ data: { challenges: [{ id: 1, creator_name: 'Institución', content: 'Actividad', points: 10, created_at: '2026-10-13T11:00:00Z' }] } });
  const { container } = render(<InstitutionalChallenges recognitions={[{ id: 2, name: 'Nuevo', created_at: '2026-10-13T12:00:00Z' }, { id: 1, name: 'Anterior', created_at: '2026-10-13T10:00:00Z' }]} renderRecognitionCard={item => <article>{item.name}</article>} />);
  await screen.findByText('Institución');
  const cards = [...container.querySelectorAll('article')];
  expect(cards[0]).toHaveTextContent('Nuevo');
  expect(cards[1]).toHaveTextContent('Actividad');
  expect(cards[2]).toHaveTextContent('Anterior');
  expect(screen.getByRole('button', { name: 'Lo completé' })).toBeInTheDocument();
});
