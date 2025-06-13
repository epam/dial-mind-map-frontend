import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ToggleSwitch } from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  const handleSwitchMock = jest.fn();

  beforeEach(() => {
    handleSwitchMock.mockClear();
  });

  test('renders toggle switch with default state ON', () => {
    render(<ToggleSwitch isOn={true} handleSwitch={handleSwitchMock} switchOnText="On" switchOFFText="Off" />);

    expect(screen.getByText('On')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('renders toggle switch with default state OFF', () => {
    render(<ToggleSwitch isOn={false} handleSwitch={handleSwitchMock} switchOnText="On" switchOFFText="Off" />);

    expect(screen.getByText('Off')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('fires handleSwitch when toggled', () => {
    render(<ToggleSwitch isOn={false} handleSwitch={handleSwitchMock} switchOnText="On" switchOFFText="Off" />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleSwitchMock).toHaveBeenCalledTimes(1);
  });

  test('does not render switch text if both texts are null', () => {
    render(<ToggleSwitch isOn={false} handleSwitch={handleSwitchMock} switchOnText={null} switchOFFText={null} />);

    expect(screen.queryByText('On')).not.toBeInTheDocument();
    expect(screen.queryByText('Off')).not.toBeInTheDocument();
  });

  test('has correct class depending on isOn state', () => {
    const { rerender, container } = render(
      <ToggleSwitch isOn={true} handleSwitch={handleSwitchMock} switchOnText="On" switchOFFText="Off" />,
    );

    const label = container.querySelector('label');
    expect(label).toHaveClass('flex-row', 'bg-accent-primary');

    rerender(<ToggleSwitch isOn={false} handleSwitch={handleSwitchMock} switchOnText="On" switchOFFText="Off" />);

    expect(label).toHaveClass('flex-row-reverse', 'bg-layer-4');
  });
});
