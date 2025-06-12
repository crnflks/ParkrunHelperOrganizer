// filename: backend/src/helpers/helpers.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HelpersService } from './helpers.service';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Helper } from '../models/helper.model';

@ApiTags('Helpers')
@Controller('helpers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class HelpersController {
  constructor(private readonly helpersService: HelpersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new helper' })
  @ApiResponse({ status: 201, description: 'Helper created successfully', type: Helper })
  @ApiResponse({ status: 409, description: 'Helper with this Parkrun ID already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createHelperDto: CreateHelperDto, @Request() req): Promise<Helper> {
    return this.helpersService.create(createHelperDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all helpers' })
  @ApiResponse({ status: 200, description: 'List of all helpers', type: [Helper] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(): Promise<Helper[]> {
    return this.helpersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a helper by ID' })
  @ApiParam({ name: 'id', description: 'Helper ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Helper found', type: Helper })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<Helper> {
    return this.helpersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a helper' })
  @ApiParam({ name: 'id', description: 'Helper ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Helper updated successfully', type: Helper })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  @ApiResponse({ status: 409, description: 'Helper with this Parkrun ID already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Param('id') id: string,
    @Body() updateHelperDto: UpdateHelperDto,
    @Request() req,
  ): Promise<Helper> {
    return this.helpersService.update(id, updateHelperDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a helper' })
  @ApiParam({ name: 'id', description: 'Helper ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Helper deleted successfully' })
  @ApiResponse({ status: 404, description: 'Helper not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Param('id') id: string): Promise<void> {
    return this.helpersService.remove(id);
  }

  @Get('search/parkrun-id/:parkrunId')
  @ApiOperation({ summary: 'Search helpers by Parkrun ID' })
  @ApiParam({ name: 'parkrunId', description: 'Parkrun ID', example: 'A1234567' })
  @ApiResponse({ status: 200, description: 'Helpers found', type: [Helper] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByParkrunId(@Param('parkrunId') parkrunId: string): Promise<Helper[]> {
    return this.helpersService.findByParkrunId(parkrunId);
  }
}