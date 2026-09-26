import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

jest.mock('next/navigation', () => ({ usePathname: () => '/ai' }));
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: { full_name: 'Test User', email: 'test@example.com' }, logout: jest.fn() }),
}));
jest.mock('@/store/uiStore', () => ({
  useUIStore: (selector: any) => selector({ sidebarOpen: true }),
}));

test('Sidebar shows AI Studio and TikTok', () => {
  render(<Sidebar />);
  expect(screen.getByText('AI Studio')).toBeTruthy();
  expect(screen.getByText('TikTok')).toBeTruthy();
  expect(screen.getByText('Templates')).toBeTruthy();
});

test('Sidebar shows Dashboard and Content', () => {
  render(<Sidebar />);
  expect(screen.getByText('Dashboard')).toBeTruthy();
  expect(screen.getByText('Content')).toBeTruthy();
});
