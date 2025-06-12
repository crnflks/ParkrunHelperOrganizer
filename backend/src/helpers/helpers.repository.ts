// filename: backend/src/helpers/helpers.repository.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Helper } from '../models/helper.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HelpersRepository {
  private container: Container;

  constructor(
    @Inject('COSMOS_CLIENT') private cosmosClient: CosmosClient,
    @Inject('DATABASE_NAME') private databaseName: string,
  ) {
    this.container = this.cosmosClient.database(this.databaseName).container('helpers');
  }

  async create(helper: Omit<Helper, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string): Promise<Helper> {
    const newHelper = new Helper({
      ...helper,
      id: uuidv4(),
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { resource } = await this.container.items.create(newHelper);
    return resource as Helper;
  }

  async findAll(): Promise<Helper[]> {
    const { resources } = await this.container.items
      .query('SELECT * FROM c')
      .fetchAll();
    
    return resources.map(item => new Helper(item));
  }

  async findById(id: string): Promise<Helper> {
    try {
      const { resource } = await this.container.item(id, id).read();
      if (!resource) {
        throw new NotFoundException(`Helper with ID ${id} not found`);
      }
      return new Helper(resource);
    } catch (error) {
      if (error.code === 404) {
        throw new NotFoundException(`Helper with ID ${id} not found`);
      }
      throw error;
    }
  }

  async update(id: string, updateData: Partial<Helper>, userId: string): Promise<Helper> {
    const existingHelper = await this.findById(id);
    
    const updatedHelper = new Helper({
      ...existingHelper,
      ...updateData,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
      createdBy: existingHelper.createdBy, // Preserve original creator
    });

    const { resource } = await this.container.item(id, id).replace(updatedHelper);
    return new Helper(resource);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.container.item(id, id).delete();
    } catch (error) {
      if (error.code === 404) {
        throw new NotFoundException(`Helper with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByParkrunId(parkrunId: string): Promise<Helper[]> {
    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.parkrunId = @parkrunId',
        parameters: [{ name: '@parkrunId', value: parkrunId }],
      })
      .fetchAll();
    
    return resources.map(item => new Helper(item));
  }
}