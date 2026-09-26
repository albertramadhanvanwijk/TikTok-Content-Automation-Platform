import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenerateForm from '../GenerateForm';

jest.mock('@/store/aiStore', () => ({
  useAIStore: () => ({
    generateCarousel: jest.fn().mockResolvedValue({ carousel: { id: 'c1' }, mock: false }),
    isGenerating: false,
    error: null,
  }),
}));

jest.mock('@/store/contentStore', () => ({
  useContentStore: () => ({
    templates: [],
    fetchTemplates: jest.fn(),
  }),
}));

jest.mock('@/store/toastStore', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('GenerateForm', () => {
  it('requires topic min 3 chars', async () => {
    render(<GenerateForm onGenerated={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/topic is required|min 3/i)).toBeTruthy());
  });

  it('renders Generate button', () => {
    render(<GenerateForm onGenerated={jest.fn()} />);
    expect(screen.getByRole('button', { name: /Generate/i })).toBeTruthy();
  });
});
