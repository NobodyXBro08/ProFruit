import { render, screen } from '@testing-library/react';
import App from './App.jsx';

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    const path = String(url);
    if (path.includes('/api/me')) {
      return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ error: 'No auth' }) });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });
});

test('renderiza la aplicación y muestra la marca en la barra de navegación', async () => {
  render(<App />);
  const marcas = await screen.findAllByText('ProFruit');
  expect(marcas.length).toBeGreaterThanOrEqual(1);
  const logo = screen.getByRole('link', { name: /ProFruit mercado en línea/i });
  expect(logo.getAttribute('href')).toBe('/');
});
