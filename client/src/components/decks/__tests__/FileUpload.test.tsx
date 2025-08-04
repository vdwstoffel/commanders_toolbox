import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../FileUpload';
import { useSendFileToBackEnd, useSendTextToBackEnd } from '../useDeckQuery';
import { parseImportDeckList } from '@/utils/helperFunctions';
import toast from 'react-hot-toast';

vi.mock('../useDeckQuery', () => ({
  useSendFileToBackEnd: vi.fn(),
  useSendTextToBackEnd: vi.fn(),
}));

vi.mock('@/utils/helperFunctions', () => ({
  parseImportDeckList: vi.fn(),
}));

vi.mock('react-hot-toast');

vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) => <div data-testid="tabs">{children}</div>,
    TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ children, value }: { children: React.ReactNode, value: string }) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
    TabsContent: ({ children, value }: { children: React.ReactNode, value: string }) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  }));

describe('FileUpload', () => {
  const mockSendCardText = vi.fn();
  const mockDeckFileUpload = vi.fn();
  const mockCloseFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSendTextToBackEnd as jest.Mock).mockReturnValue({ sendCardText: mockSendCardText });
    (useSendFileToBackEnd as jest.Mock).mockReturnValue({ deckFileUpload: mockDeckFileUpload });
  });

  it('should render file upload and text input tabs', () => {
    render(<FileUpload />);
    expect(screen.getByText('Upload file')).toBeInTheDocument();
    expect(screen.getByText('Enter Text')).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<FileUpload />);
    const file = new File(['content'], 'deck.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
  });

  it('should call deckFileUpload on file submission', async () => {
    render(<FileUpload closeFn={mockCloseFn} />);
    const file = new File(['content'], 'deck.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockDeckFileUpload).toHaveBeenCalled();
      expect(mockCloseFn).toHaveBeenCalled();
    });
  });

  it('should show error if no file is selected', () => {
    render(<FileUpload />);
    fireEvent.click(screen.getByText('Submit'));
    expect(toast.error).toHaveBeenCalledWith('No file selected');
  });

  it('should handle text input and submission', async () => {
    (parseImportDeckList as jest.Mock).mockReturnValue(['parsed deck']);
    render(<FileUpload closeFn={mockCloseFn} />);
    fireEvent.click(screen.getByText('Enter Text'));

    const textarea = screen.getByPlaceholderText('1 Muldrotha the Gravetide');
    fireEvent.change(textarea, { target: { value: '1 Sol Ring' } });

    fireEvent.click(screen.getByText('Submit deck'));

    await waitFor(() => {
      expect(parseImportDeckList).toHaveBeenCalledWith('1 Sol Ring');
      expect(mockSendCardText).toHaveBeenCalledWith(['parsed deck']);
      expect(mockCloseFn).toHaveBeenCalled();
    });
  });

  it('should show error if more than 99 entries are submitted', () => {
    (parseImportDeckList as jest.Mock).mockReturnValue(new Array(100));
    render(<FileUpload />);
    fireEvent.click(screen.getByText('Enter Text'));

    const textarea = screen.getByPlaceholderText('1 Muldrotha the Gravetide');
    fireEvent.change(textarea, { target: { value: 'a lot of cards' } });

    fireEvent.click(screen.getByText('Submit deck'));

    expect(toast.error).toHaveBeenCalledWith('A maximum of 99 entries can be added');
  });
});