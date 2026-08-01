import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastProvider';
import i18n from '@/lib/i18n';

beforeAll(() => {
  i18n.addResourceBundle('en', 'common', { common: { dismiss: 'Dismiss' } }, true, true);
});

// AnimatePresence keeps a removed item mounted for its exit transition, which
// runs on real animation timing independent of Jest's fake timers. Strip that
// out here so dismiss/auto-dismiss assertions can check the DOM immediately.
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ initial, animate, exit, transition, ...rest }: any, ref: any) =>
        React.createElement('div', { ...rest, ref }),
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

function Trigger() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.error('Something broke')}>fire-error</button>
      <button onClick={() => toast.success('It worked')}>fire-success</button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders an error toast when toast.error is called', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('fire-error'));

    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders a success toast when toast.success is called', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('fire-success'));

    expect(screen.getByText('It worked')).toBeInTheDocument();
  });

  it('dismisses a toast when its close button is clicked', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('fire-error'));
    expect(screen.getByText('Something broke')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(screen.queryByText('Something broke')).not.toBeInTheDocument();
  });

  it('auto-dismisses a toast after the timeout elapses', () => {
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('fire-error'));
    expect(screen.getByText('Something broke')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Something broke')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('throws a clear error when useToast is used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow('useToast must be used within ToastProvider');
    consoleError.mockRestore();
  });
});
