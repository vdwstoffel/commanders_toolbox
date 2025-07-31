import { render, screen, fireEvent } from '@testing-library/react';
import OverlayWrapper from '../OverlayWrapper';

describe('OverlayWrapper', () => {
  it('should render children correctly', () => {
    const hideFn = vi.fn();
    render(
      <OverlayWrapper hideFn={hideFn}>
        <div>Test Child</div>
      </OverlayWrapper>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should call hideFn when clicking outside the content', () => {
    const hideFn = vi.fn();
    render(
      <OverlayWrapper hideFn={hideFn}>
        <div>Test Child</div>
      </OverlayWrapper>
    );
    fireEvent.click(screen.getByTestId('overlay-wrapper'));
    expect(hideFn).toHaveBeenCalledTimes(1);
  });

  it('should not call hideFn when clicking inside the content', () => {
    const hideFn = vi.fn();
    render(
      <OverlayWrapper hideFn={hideFn}>
        <div data-testid="overlay-content">Test Child</div>
      </OverlayWrapper>
    );
    fireEvent.click(screen.getByTestId('overlay-content'));
    expect(hideFn).not.toHaveBeenCalled();
  });

  it('should call hideFn when escape key is pressed', () => {
    const hideFn = vi.fn();
    render(
      <OverlayWrapper hideFn={hideFn}>
        <div>Test Child</div>
      </OverlayWrapper>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(hideFn).toHaveBeenCalledTimes(1);
  });
});