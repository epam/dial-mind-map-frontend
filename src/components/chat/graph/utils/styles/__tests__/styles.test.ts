import { startPulsate } from '../styles';

describe('startPulsate', () => {
  let node: any;

  beforeEach(() => {
    jest.useFakeTimers();
    node = {
      data: jest.fn(),
      animate: jest.fn((style, options) => {
        setTimeout(() => options.complete?.(), 900);
      }),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('animates with icon', () => {
    node.data.mockImplementation((key: string) => {
      if (key === 'icon') return true;
      if (key === 'pulsating') return false;
    });

    startPulsate(node);

    expect(node.animate).toHaveBeenCalledWith(
      { style: { 'background-image-opacity': [1, 1] } },
      expect.objectContaining({ duration: 900, queue: false, complete: expect.any(Function) }),
    );

    jest.advanceTimersByTime(900);

    expect(node.animate).toHaveBeenCalledWith(
      { style: { 'background-image-opacity': [0.7, 0.3] } },
      expect.objectContaining({ duration: 900, queue: false, complete: expect.any(Function) }),
    );
  });

  test('animates without icon', () => {
    node.data.mockImplementation((key: string) => {
      if (key === 'icon') return false;
      if (key === 'pulsating') return false;
    });

    startPulsate(node);

    expect(node.animate).toHaveBeenCalledWith(
      { style: { 'background-image-opacity': 1 } },
      expect.objectContaining({ duration: 900, queue: false, complete: expect.any(Function) }),
    );

    jest.advanceTimersByTime(900);

    expect(node.animate).toHaveBeenCalledWith(
      { style: { 'background-image-opacity': 0.3 } },
      expect.objectContaining({ duration: 900, queue: false, complete: expect.any(Function) }),
    );
  });

  test('restarts pulsation if pulsating is true', () => {
    node.data.mockImplementation((key: string) => {
      if (key === 'icon') return false;
      if (key === 'pulsating') return true;
    });

    startPulsate(node);

    // simulate 3 full pulse cycles: 2 animate calls per cycle
    jest.advanceTimersByTime(900 * 6 - 1);

    expect(node.animate).toHaveBeenCalledTimes(6); // 3 cycles × 2 animations
  });
});
