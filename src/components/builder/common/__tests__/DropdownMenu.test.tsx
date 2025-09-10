import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

// Mock @floating-ui/react to simplify positioning and interactions
jest.mock('@floating-ui/react', () => {
  const noop = () => {};
  return {
    useFloating: () => ({
      context: {},
      refs: { setReference: noop, setFloating: noop },
      floatingStyles: {},
    }),
    autoUpdate: noop,
    offset: () => noop,
    flip: noop,
    shift: noop,
    size: () => ({ apply: noop }),
    useHover: () => ({}),
    useClick: () => ({}),
    useRole: () => ({}),
    useDismiss: () => ({}),
    useListNavigation: () => ({}),
    useTypeahead: () => ({}),
    useInteractions: () => ({
      getReferenceProps: (props: any) => props,
      getFloatingProps: (props: any) => props,
      getItemProps: (props: any) => props,
    }),
    useFloatingTree: () => ({ events: { on: noop, off: noop, emit: noop } }),
    useFloatingNodeId: () => 'node-1',
    useFloatingParentNodeId: () => null,
    useListItem: () => ({ ref: noop, index: 0 }),
    useMergeRefs: () => () => noop,
    FloatingTree: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FloatingNode: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FloatingList: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FloatingPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    FloatingFocusManager: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    safePolygon: () => noop,
  };
});

import { Menu, MenuItem } from '../DropdownMenu';

describe('Menu and MenuItem components', () => {
  it('renders trigger but no menu initially', () => {
    const { container } = render(
      <Menu trigger={<button>Open Menu</button>}>
        <MenuItem label="First" />
        <MenuItem label="Second" />
      </Menu>,
    );
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
    expect(container.querySelector('[data-qa="dropdown-menu"]')).toBeNull();
  });

  it('shows menu items when isMenuOpen is true', () => {
    const { container } = render(
      <Menu trigger={<button>Open</button>} isMenuOpen>
        <MenuItem label="Item A" />
        <MenuItem label="Item B" />
      </Menu>,
    );
    const menu = container.querySelector('[data-qa="dropdown-menu"]');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('calls onClick handler of MenuItem when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Menu trigger={<button>Menu</button>} isMenuOpen>
        <MenuItem label="ClickMe" onClick={handleClick} />
      </Menu>,
    );
    const item = screen.getByText('ClickMe');
    fireEvent.click(item);
    expect(handleClick).toHaveBeenCalled();
  });
});
