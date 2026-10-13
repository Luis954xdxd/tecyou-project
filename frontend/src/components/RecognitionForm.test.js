import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import RecognitionForm from './RecognitionForm';

jest.mock('axios');
const ana = { id: 2, display_name: 'Ana', email: 'za220113032@zapopan.tecmm.edu.mx' };
const luis = { id: 3, display_name: 'Luis', email: 'za220113033@zapopan.tecmm.edu.mx' };
const writeMessage = () => fireEvent.change(screen.getByPlaceholderText('Escribe algo inspirador...'), { target: { value: 'Gracias por apoyar al equipo' } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Enviar reconocimiento' }));

beforeEach(() => {
  jest.clearAllMocks();
  Element.prototype.scrollIntoView = jest.fn();
  axios.get.mockResolvedValue({ data: [ana, luis] });
  axios.post.mockResolvedValue({ data: { success: true } });
});

test('adds multiple people, filters existing selections and sends the same message to both', async () => {
  const onSent = jest.fn();
  render(<RecognitionForm senderId={1} preselectedUser={ana} onRecognitionSent={onSent} />);
  fireEvent.change(screen.getByLabelText('Buscar por nombre o número de control'), { target: { value: 'Lu' } });
  fireEvent.click(await screen.findByRole('button', { name: /Luis.*za220113033/ }));
  expect(screen.getByRole('button', { name: 'Quitar a Ana' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Quitar a Luis' })).toBeInTheDocument();
  writeMessage();
  submit();
  await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(JSON.parse(axios.post.mock.calls[0][1].get('receiver_ids'))).toEqual([2, 3]);
  expect(axios.post.mock.calls.every(([, payload]) => payload.get('message') === 'Gracias por apoyar al equipo')).toBe(true);
  expect(onSent).toHaveBeenCalledTimes(1);
});

test('uses the same search field for control numbers and excludes selected people', async () => {
  axios.get.mockResolvedValue({ data: [luis] });
  render(<RecognitionForm senderId={1} />);
  const input = screen.getByLabelText('Buscar por nombre o número de control');
  expect(screen.queryByRole('button', { name: 'Agregar a la lista' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Agregar por número de control')).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: '220113033' } });
  fireEvent.click(await screen.findByRole('button', { name: /Luis.*za220113033/ }));
  expect(axios.get.mock.calls[0][0]).toContain('q=220113033');
  expect(input).toHaveValue('');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  fireEvent.change(input, { target: { value: '220113033' } });
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('button', { name: /Luis.*za220113033/ })).not.toBeInTheDocument());
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  fireEvent.change(input, { target: { value: '' } });
  writeMessage();
  submit();
  await screen.findByText('Reconocimiento enviado a 1 persona(s).');
  expect(JSON.parse(axios.post.mock.calls[0][1].get('receiver_ids'))).toEqual([3]);
});

test('retains every recipient if the grouped send fails, then retries one publication', async () => {
  const onSent = jest.fn();
  axios.post.mockRejectedValueOnce({ response: { data: { error: 'No se pudo guardar' } } });
  render(<RecognitionForm senderId={1} preselectedUser={ana} onRecognitionSent={onSent} />);
  fireEvent.change(screen.getByLabelText('Buscar por nombre o número de control'), { target: { value: 'Lu' } });
  fireEvent.click(await screen.findByRole('button', { name: /Luis.*za220113033/ }));
  writeMessage();
  submit();
  await screen.findByText('No se pudo guardar');
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(onSent).not.toHaveBeenCalled();
  submit();
  await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(JSON.parse(axios.post.mock.calls[1][1].get('receiver_ids'))).toEqual([2, 3]);
});

test('allows removing a preselected person without sending to them', async () => {
  render(<RecognitionForm senderId={1} preselectedUser={ana} />);
  fireEvent.click(screen.getByRole('button', { name: 'Quitar a Ana' }));
  writeMessage();
  submit();
  expect(await screen.findByText(/Selecciona al menos un compañero/)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('shows a refresh failure without repeating a completed recognition', async () => {
  const onSent = jest.fn().mockRejectedValue(new Error('Feed unavailable'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<RecognitionForm senderId={1} preselectedUser={ana} onRecognitionSent={onSent} />);
  writeMessage();
  submit();
  await screen.findByText(/pero no se pudo actualizar el muro/);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Quitar a Ana' })).not.toBeInTheDocument();
  log.mockRestore();
});
