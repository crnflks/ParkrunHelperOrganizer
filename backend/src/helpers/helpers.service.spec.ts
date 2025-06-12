import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { HelpersService } from './helpers.service';
import { HelpersRepository } from './helpers.repository';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { Helper } from '../models/helper.model';

describe('HelpersService', () => {
  let service: HelpersService;
  let repository: jest.Mocked<HelpersRepository>;

  const mockHelper: Helper = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    parkrunId: 'A123456',
    phone: '123-456-7890',
    createdBy: 'user1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockRepository = {
    findByParkrunId: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HelpersService,
        {
          provide: HelpersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HelpersService>(HelpersService);
    repository = module.get<jest.Mocked<HelpersRepository>>(HelpersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createHelperDto: CreateHelperDto = {
      name: 'John Doe',
      email: 'john@example.com',
      parkrunId: 'A123456',
      phone: '123-456-7890',
    };

    it('should create a helper successfully', async () => {
      repository.findByParkrunId.mockResolvedValue([]);
      repository.create.mockResolvedValue(mockHelper);

      const result = await service.create(createHelperDto, 'user1');

      expect(repository.findByParkrunId).toHaveBeenCalledWith('A123456');
      expect(repository.create).toHaveBeenCalledWith(createHelperDto, 'user1');
      expect(result).toEqual(mockHelper);
    });

    it('should throw ConflictException when helper with same Parkrun ID exists', async () => {
      repository.findByParkrunId.mockResolvedValue([mockHelper]);

      await expect(service.create(createHelperDto, 'user1')).rejects.toThrow(
        ConflictException
      );
      expect(repository.findByParkrunId).toHaveBeenCalledWith('A123456');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      repository.findByParkrunId.mockRejectedValue(error);

      await expect(service.create(createHelperDto, 'user1')).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all helpers', async () => {
      const helpers = [mockHelper];
      repository.findAll.mockResolvedValue(helpers);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(helpers);
    });

    it('should return empty array when no helpers exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a helper by id', async () => {
      repository.findById.mockResolvedValue(mockHelper);

      const result = await service.findOne('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockHelper);
    });

    it('should handle non-existent helper', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findOne('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateHelperDto: UpdateHelperDto = {
      name: 'John Updated',
      email: 'john.updated@example.com',
    };

    it('should update a helper successfully', async () => {
      const updatedHelper = { ...mockHelper, ...updateHelperDto };
      repository.update.mockResolvedValue(updatedHelper);

      const result = await service.update('1', updateHelperDto, 'user1');

      expect(repository.update).toHaveBeenCalledWith('1', updateHelperDto, 'user1');
      expect(result).toEqual(updatedHelper);
    });

    it('should update helper with new Parkrun ID when no conflict exists', async () => {
      const updateWithParkrunId = { ...updateHelperDto, parkrunId: 'B654321' };
      repository.findByParkrunId.mockResolvedValue([]);
      repository.update.mockResolvedValue({ ...mockHelper, ...updateWithParkrunId });

      const result = await service.update('1', updateWithParkrunId, 'user1');

      expect(repository.findByParkrunId).toHaveBeenCalledWith('B654321');
      expect(repository.update).toHaveBeenCalledWith('1', updateWithParkrunId, 'user1');
      expect(result.parkrunId).toBe('B654321');
    });

    it('should throw ConflictException when updating to existing Parkrun ID', async () => {
      const conflictingHelper = { ...mockHelper, id: '2' };
      const updateWithParkrunId = { ...updateHelperDto, parkrunId: 'B654321' };
      
      repository.findByParkrunId.mockResolvedValue([conflictingHelper]);

      await expect(service.update('1', updateWithParkrunId, 'user1')).rejects.toThrow(
        ConflictException
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow updating same helper with same Parkrun ID', async () => {
      const updateWithSameParkrunId = { ...updateHelperDto, parkrunId: 'A123456' };
      repository.findByParkrunId.mockResolvedValue([mockHelper]);
      repository.update.mockResolvedValue({ ...mockHelper, ...updateWithSameParkrunId });

      const result = await service.update('1', updateWithSameParkrunId, 'user1');

      expect(repository.findByParkrunId).toHaveBeenCalledWith('A123456');
      expect(repository.update).toHaveBeenCalledWith('1', updateWithSameParkrunId, 'user1');
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a helper successfully', async () => {
      repository.delete.mockResolvedValue(undefined);

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should handle repository errors during deletion', async () => {
      const error = new Error('Database error');
      repository.delete.mockRejectedValue(error);

      await expect(service.remove('1')).rejects.toThrow(error);
    });
  });

  describe('findByParkrunId', () => {
    it('should return helpers by Parkrun ID', async () => {
      const helpers = [mockHelper];
      repository.findByParkrunId.mockResolvedValue(helpers);

      const result = await service.findByParkrunId('A123456');

      expect(repository.findByParkrunId).toHaveBeenCalledWith('A123456');
      expect(result).toEqual(helpers);
    });

    it('should return empty array when no helpers found', async () => {
      repository.findByParkrunId.mockResolvedValue([]);

      const result = await service.findByParkrunId('NOTFOUND');

      expect(result).toEqual([]);
    });
  });
});