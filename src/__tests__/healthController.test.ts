import { Request, Response } from 'express';
import { health } from '../controllers/healthController';

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response methods
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    mockRequest = {};
  });

  it('should return health status ok', async () => {
    await health(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('should be a function', () => {
    expect(typeof health).toBe('function');
  });
}); 