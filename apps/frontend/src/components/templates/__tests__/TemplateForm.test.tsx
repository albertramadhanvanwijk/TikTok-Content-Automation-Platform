import { render, screen, fireEvent } from '@testing-library/react';
import TemplateForm from '../TemplateForm';

jest.mock('@/store/contentStore', () => ({
  useContentStore: () => ({
    createTemplate: jest.fn().mockResolvedValue({ id: 't1', name: 'My Template' }),
  }),
}));

jest.mock('@/store/toastStore', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

test('TemplateForm blocks invalid JSON', async () => {
  render(<TemplateForm onClose={jest.fn()} onCreated={jest.fn()} />);
  const nameInput = screen.getByPlaceholderText(/My Template/i);
  fireEvent.change(nameInput, { target: { value: 'Test Template' } });
  const ta = screen.getByLabelText(/style_data/i);
  fireEvent.change(ta, { target: { value: '{invalid' } });
  fireEvent.click(screen.getByRole('button', { name: /Create/i }));
  expect(await screen.findByText(/Invalid JSON/i)).toBeTruthy();
});
