import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import React from 'react';

import { Space } from '../Space';

const childTestId = 'child-element';
const Child = () => <div data-testid={childTestId}>Item</div>;
const testId = 'space-container';

describe('Space Component', () => {
  test('renders children', () => {
    render(
      <Space dataTestId={testId}>
        <Child />
        <Child />
      </Space>,
    );
    const children = screen.getAllByTestId(childTestId);
    expect(children).toHaveLength(2);
  });

  test('applies horizontal direction by default', () => {
    render(
      <Space dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('flex-row');
  });

  test('applies vertical direction', () => {
    render(
      <Space direction="vertical" dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('flex-col');
  });

  test('applies gap class based on size preset', () => {
    render(
      <Space size="large" dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('gap-6');
  });

  test('applies inline gap style for numeric size', () => {
    render(
      <Space size={10} dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveStyle({ gap: '10px' });
  });

  test('applies wrapping class when wrap is true', () => {
    render(
      <Space wrap dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('flex-wrap');
  });

  test('applies additional className and style props', () => {
    render(
      <Space className="custom-class" style={{ margin: '20px' }} dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveStyle({ margin: '20px' });
  });

  test('applies alignment class based on align prop', () => {
    render(
      <Space align="start" dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('items-start');
  });

  test('applies justify class based on justify prop', () => {
    render(
      <Space justify="between" dataTestId={testId}>
        <Child />
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('justify-between');
  });

  test('defaults to justify-normal when no justify prop is provided', () => {
    render(
      <Space dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('justify-normal');
  });

  test('applies fullWidth class when fullWidth is true', () => {
    render(
      <Space fullWidth dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).toHaveClass('w-full');
  });

  test('does not apply fullWidth class when fullWidth is false', () => {
    render(
      <Space fullWidth={false} dataTestId={testId}>
        <Child />
      </Space>,
    );
    const container = screen.getByTestId(testId);
    expect(container).not.toHaveClass('w-full');
  });
});
