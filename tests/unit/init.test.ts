import { initCommand } from '../../src/commands/init';
import { ConfigManager } from '../../src/core/config';

// Mock chalk
jest.mock('chalk', () => ({
  cyan: (str: string) => str,
  red: (str: string) => str,
}));

// Mock ora
jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  };
  return jest.fn(() => spinner);
});

// Mock ConfigManager
jest.mock('../../src/core/config');

describe('initCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize GitConnect successfully', async () => {
    const mockInit = jest.fn().mockResolvedValue(undefined);
    (ConfigManager as jest.Mock).mockImplementation(() => ({
      init: mockInit,
    }));

    await initCommand();

    expect(mockInit).toHaveBeenCalled();
  });
});