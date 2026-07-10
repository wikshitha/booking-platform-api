import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'A valid JWT access token is required',
})
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service',
    description:
      'Creates a service that customers can select when creating a booking.',
  })
  @ApiCreatedResponse({
    description: 'Service created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid service data',
  })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description:
      'Returns all active and inactive services ordered by creation date.',
  })
  @ApiOkResponse({
    description: 'Services retrieved successfully',
  })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a service by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Service retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
  })
  @ApiOkResponse({
    description: 'Service updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID or update data',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body()
    updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(
      id,
      updateServiceDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a service',
    description:
      'Deletes a service only when it has no associated bookings.',
  })
  @ApiParam({
    name: 'id',
    description: 'Service UUID',
  })
  @ApiOkResponse({
    description: 'Service deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID',
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  @ApiConflictResponse({
    description:
      'Service has associated bookings and cannot be deleted',
  })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.servicesService.remove(id);
  }
}