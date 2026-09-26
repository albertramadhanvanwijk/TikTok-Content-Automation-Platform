import { render, screen } from '@testing-library/react';
import GenerateResultView from '../GenerateResult';

jest.mock('@/store/contentStore', () => ({
  useContentStore: () => ({ fetchCarousels: jest.fn() }),
}));
jest.mock('@/store/toastStore', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('GenerateResult mock banner', () => {
  it('renders Mock mode banner when result.mock true', () => {
    const result: any = {
      carousel: { id: 'c1', title: 'T', description: 'desc' },
      slides: [{ id: 's1', slide_number: 1, title: 'Slide 1', content: 'hello' }],
      design: { color_scheme: ['#000'], fonts: ['Inter'], layout: 'centered' },
      hashtags: ['#a'],
      mock: true,
    };
    render(<GenerateResultView result={result} />);
    expect(screen.getByText(/Mock mode/i).textContent).toContain('Mock mode');
  });

  it('does not render Mock banner when not mock', () => {
    const result: any = {
      carousel: { id: 'c1', title: 'T', description: 'desc' },
      slides: [],
      design: null,
      hashtags: [],
      mock: false,
    };
    render(<GenerateResultView result={result} />);
    expect(screen.queryByText(/Mock mode/i)).toBeNull();
  });
});
