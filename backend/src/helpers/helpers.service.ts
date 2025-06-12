// filename: backend/src/helpers/helpers.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { HelpersRepository } from './helpers.repository';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { Helper } from '../models/helper.model';

@Injectable()
export class HelpersService {
  constructor(private readonly helpersRepository: HelpersRepository) {}

  async create(createHelperDto: CreateHelperDto, userId: string): Promise<Helper> {
    // Check if helper with same Parkrun ID already exists
    const existingHelpers = await this.helpersRepository.findByParkrunId(createHelperDto.parkrunId);
    if (existingHelpers.length > 0) {
      throw new ConflictException(`Helper with Parkrun ID ${createHelperDto.parkrunId} already exists`);
    }

    return this.helpersRepository.create(createHelperDto, userId);
  }

  async findAll(): Promise<Helper[]> {
    return this.helpersRepository.findAll();
  }

  async findOne(id: string): Promise<Helper> {
    return this.helpersRepository.findById(id);
  }

  async update(id: string, updateHelperDto: UpdateHelperDto, userId: string): Promise<Helper> {
    // If updating Parkrun ID, check for conflicts
    if (updateHelperDto.parkrunId) {
      const existingHelpers = await this.helpersRepository.findByParkrunId(updateHelperDto.parkrunId);
      const conflictingHelper = existingHelpers.find(helper => helper.id !== id);
      
      if (conflictingHelper) {
        throw new ConflictException(`Helper with Parkrun ID ${updateHelperDto.parkrunId} already exists`);
      }
    }

    return this.helpersRepository.update(id, updateHelperDto, userId);
  }

  async remove(id: string): Promise<void> {
    return this.helpersRepository.delete(id);
  }

  async findByParkrunId(parkrunId: string): Promise<Helper[]> {
    return this.helpersRepository.findByParkrunId(parkrunId);
  }
}