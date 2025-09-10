import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { useBuilderSelector } from '@/store/builder/hooks';
import { GenerationStatus, Source, SourceStatus, SourceType } from '@/types/sources';

import { SourceInput } from '../SourceInput';

jest.mock('react-hook-form', () => ({
  Controller: ({ render }: any) => render({ field: { value: '', onChange: jest.fn() } }),
}));

jest.mock('@/components/common/Loader', () => {
  const Loader = () => <div data-testid="loader" />;
  Loader.displayName = 'Loader';
  return Loader;
});

jest.mock('@/components/builder/common/Tooltip', () => {
  const MockTooltip: React.FC<{ tooltip: string; children: React.ReactNode }> = ({ tooltip, children }) => (
    <div data-testid="tooltip" data-tooltip={tooltip}>
      {children}
    </div>
  );
  MockTooltip.displayName = 'Tooltip';
  return MockTooltip;
});

jest.mock('../SourceInputField', () => ({
  SourceInputField: ({ inputRef, hasError, value, onKeyDown, handleRowSelection, globalSourceName }: any) => (
    <input
      data-testid="source-input-field"
      ref={inputRef}
      data-has-error={hasError}
      data-value={value}
      data-global-name={globalSourceName}
      onKeyDown={e => onKeyDown(e, 0)}
      onClick={() => handleRowSelection(0)}
    />
  ),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

jest.mock('../SourceInputField', () => ({
  SourceInputField: ({ inputRef, hasError, value, onKeyDown, handleRowSelection, globalSourceName }: any) => (
    <input
      data-testid="source-input-field"
      ref={inputRef}
      data-has-error={hasError}
      data-value={value}
      data-global-name={globalSourceName}
      onKeyDown={e => onKeyDown(e, 0)}
      onClick={() => handleRowSelection(0)}
    />
  ),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderSelector: jest.fn(),
}));

type Props = React.ComponentProps<typeof SourceInput>;
const makeProps = (override: Partial<Props> = {}): Props => {
  const defaultField: Source = {
    id: 'field-id',
    type: SourceType.LINK,
    url: 'http://example.com',
    status: undefined,
    in_graph: true,
    status_description: 'desc',
  };
  const defaultProps: Props = {
    index: 0,
    field: defaultField,
    editableIndex: null,
    editMode: 'add',
    hoveredIndex: null,
    selectedRows: [],
    isValid: true,
    errors: { sources: {} } as any,
    generationStatus: GenerationStatus.NOT_STARTED,
    handleKeyDown: jest.fn(),
    handleConfirmEdit: jest.fn(),
    handleConfirmAdd: jest.fn(),
    handleRowSelection: jest.fn(),
    handleCancel: jest.fn(),
    control: { _formValues: { sources: [defaultField] } } as any,
    isAddingModeRef: { current: false },
    inProgressUrls: [],
  };
  return { ...defaultProps, ...override };
};

describe('<SourceInput />', () => {
  beforeEach(() => {
    (useBuilderSelector as jest.Mock).mockReturnValue({});
  });

  it('shows loader when status undefined and not editable', () => {
    const props = makeProps({ editableIndex: null });
    render(<SourceInput {...props} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows loader when status INPROGRESS', () => {
    const props = makeProps({ field: { ...makeProps().field, status: SourceStatus.INPROGRESS } });
    render(<SourceInput {...props} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows loader when url is in inProgressUrls', () => {
    const props = makeProps({ inProgressUrls: ['http://example.com'] });
    render(<SourceInput {...props} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error tooltip when status FAILED', () => {
    const props = makeProps({
      field: { ...makeProps().field, status: SourceStatus.FAILED, status_description: 'Failed!' },
    });
    render(<SourceInput {...props} />);
    const tip = screen.getByTestId('tooltip');
    expect(tip).toHaveAttribute('data-tooltip', 'Failed!');
  });

  it("shows warning tooltip when generationStatus isn't NOT_STARTED and not in_graph", () => {
    const field = { ...makeProps().field, status: SourceStatus.INDEXED, in_graph: false };
    const props = makeProps({ field, generationStatus: GenerationStatus.FINISHED });
    render(<SourceInput {...props} />);
    const tip = screen.getByTestId('tooltip');
    expect(tip).toHaveAttribute(
      'data-tooltip',
      "Hasn't been applied to the graph. The knowledge base has been updated.",
    );
  });

  it('renders warning tooltip when FINISHED and status REMOVED', () => {
    const props = makeProps({
      field: { ...makeProps().field, status: SourceStatus.REMOVED, in_graph: true },
      generationStatus: GenerationStatus.FINISHED,
    });
    render(<SourceInput {...props} />);
    expect(screen.getByTestId('tooltip')).toHaveAttribute(
      'data-tooltip',
      "Hasn't been applied to the graph. The knowledge base has been updated.",
    );
  });

  it('shows no status icon when status is INDEXED and in_graph true and NOT_STARTED', () => {
    const field = { ...makeProps().field, status: SourceStatus.INDEXED, in_graph: true };
    const props = makeProps({ field, generationStatus: GenerationStatus.NOT_STARTED });
    render(<SourceInput {...props} />);
    expect(screen.queryByTestId('loader')).toBeNull();
    expect(screen.queryByTestId('tooltip')).toBeNull();
  });

  it('focuses input if editableIndex matches index', () => {
    const props = makeProps({ editableIndex: 0 });
    render(<SourceInput {...props} />);
    const input = screen.getByTestId('source-input-field');
    expect(document.activeElement).toBe(input);
  });

  it('calls onKeyDown and handleRowSelection from SourceInputField mock', () => {
    const handleKeyDown = jest.fn();
    const handleRowSelection = jest.fn();
    const props = makeProps({ editableIndex: null, handleKeyDown, handleRowSelection });
    render(<SourceInput {...props} />);
    const input = screen.getByTestId('source-input-field');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledWith(expect.any(Object), 0);
    fireEvent.click(input);
    expect(handleRowSelection).toHaveBeenCalledWith(0);
  });

  it('renders confirm and cancel buttons in edit mode and handles clicks', () => {
    const handleConfirmEdit = jest.fn();
    const handleCancel = jest.fn();
    const props = makeProps({ editableIndex: 0, isValid: true, handleConfirmEdit, handleCancel });
    render(<SourceInput {...props} />);
    const confirmWrapper = screen.getAllByTestId('tooltip').find(el => el.getAttribute('data-tooltip') === 'Confirm');
    const cancelWrapper = screen.getAllByTestId('tooltip').find(el => el.getAttribute('data-tooltip') === 'Cancel');
    const confirmBtn = confirmWrapper!.querySelector('button')!;
    const cancelBtn = cancelWrapper!.querySelector('button')!;
    fireEvent.click(confirmBtn);
    expect(handleConfirmEdit).toHaveBeenCalledWith(0);
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalled();
  });

  it('calls handleConfirmAdd when in adding mode', () => {
    const handleConfirmAdd = jest.fn();
    const props = makeProps({ editableIndex: 0, isValid: true, handleConfirmAdd, isAddingModeRef: { current: true } });
    render(<SourceInput {...props} />);
    const confirmWrapper = screen.getAllByTestId('tooltip').find(el => el.getAttribute('data-tooltip') === 'Confirm');
    const confirmBtn = confirmWrapper!.querySelector('button')!;
    fireEvent.click(confirmBtn);
    expect(handleConfirmAdd).toHaveBeenCalledWith(0);
  });

  it('displays error message when errors present', () => {
    const props = makeProps({
      errors: { sources: { 0: { url: { message: 'Invalid URL' } } } } as any,
    });
    render(<SourceInput {...props} />);
    expect(screen.getByText('Invalid URL')).toBeInTheDocument();
  });

  it('passes file name as value for FILE type', () => {
    const fileField = { ...makeProps().field, type: SourceType.FILE, name: 'file.txt', url: '' };
    const props = makeProps({ field: fileField });
    render(<SourceInput {...props} />);
    const input = screen.getByTestId('source-input-field');
    expect(input).toHaveAttribute('data-value', 'file.txt');
  });

  it('passes globalSourceName from selector', () => {
    (useBuilderSelector as jest.Mock).mockReturnValue({ 'field-id': 'MySourceName' });
    const props = makeProps();
    render(<SourceInput {...props} />);
    const input = screen.getByTestId('source-input-field');
    expect(input).toHaveAttribute('data-global-name', 'MySourceName');
  });

  it('renders no globalSourceName when field.id is falsy', () => {
    const fieldNoId = { ...makeProps().field, id: undefined as any };
    render(<SourceInput {...makeProps({ field: fieldNoId })} />);
    const input = screen.getByTestId('source-input-field');
    expect(input.getAttribute('data-global-name')).toBeNull();
  });
});
