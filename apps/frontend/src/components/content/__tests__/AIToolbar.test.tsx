import { render, screen } from '@testing-library/react';
import AIToolbar from '../AIToolbar';

jest.mock('@/store/aiStore', () => ({
  useAIStore: () => ({
    generateCarousel: jest.fn(),
    suggestDesign: jest.fn(),
    generateHashtags: jest.fn(),
    isGenerating: false,
    mock: false,
    lastDesign: null,
    lastHashtags: [],
  }),
}));
jest.mock('@/store/contentStore', () => ({
  useContentStore: Object.assign(() => ({ slides: [], fetchSlides: jest.fn(), updateSlide: jest.fn() }), {
    getState: () => ({ slides: [], fetchSlides: jest.fn(), updateSlide: jest.fn() }),
  }),
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/store/toastStore', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

test('AIToolbar disables Enhance when isNew', () => {
  render(<AIToolbar carouselId={null} title="" />);
  expect((screen.getByRole('button', { name: /Enhance/i }) as HTMLButtonElement).disabled).toBe(true);
});
