import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  );
});

test('renderiza la aplicación y muestra la marca en la barra de navegación', async () => {
  render(<App />);
  const marcas = await screen.findAllByText('ProFruit');
  expect(marcas.length).toBeGreaterThanOrEqual(1);
  const logo = screen.getByRole('link', { name: 'ProFruit' });
  expect(logo.getAttribute('href')).toBe('#inicio');
});
