import { render, screen } from '@testing-library/react';
import AccountCard from '../AccountCard';

test('AccountCard renders disconnect when account present', () => {
  render(
    <AccountCard
      account={{ id: 'a1', username: 'test_user', connected_at: new Date().toISOString(), status: 'active' }}
      onDisconnect={jest.fn()}
    />
  );
  expect(screen.getByText(/Disconnect/i)).toBeTruthy();
  expect(screen.getByText(/@test_user/)).toBeTruthy();
});
