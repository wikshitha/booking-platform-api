import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        title: createServiceDto.title.trim(),
        description: createServiceDto.description.trim(),
        duration: createServiceDto.duration,
        price: createServiceDto.price,
        isActive: createServiceDto.isActive ?? true,
      },
    });

    return {
      message: 'Service created successfully',
      data: service,
    };
  }

  async findAll() {
    const services = await this.prisma.service.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Services retrieved successfully',
      data: services,
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: {
        id,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" was not found`);
    }

    return {
      message: 'Service retrieved successfully',
      data: service,
    };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.ensureServiceExists(id);

    const service = await this.prisma.service.update({
      where: {
        id,
      },

      data: {
        ...(updateServiceDto.title !== undefined && {
          title: updateServiceDto.title.trim(),
        }),

        ...(updateServiceDto.description !== undefined && {
          description: updateServiceDto.description.trim(),
        }),

        ...(updateServiceDto.duration !== undefined && {
          duration: updateServiceDto.duration,
        }),

        ...(updateServiceDto.price !== undefined && {
          price: updateServiceDto.price,
        }),

        ...(updateServiceDto.isActive !== undefined && {
          isActive: updateServiceDto.isActive,
        }),
      },
    });

    return {
      message: 'Service updated successfully',
      data: service,
    };
  }

  async remove(id: string) {
    await this.ensureServiceExists(id);

    const bookingCount = await this.prisma.booking.count({
      where: {
        serviceId: id,
      },
    });

    if (bookingCount > 0) {
      throw new ConflictException(
        'This service cannot be deleted because it has existing bookings. Deactivate the service instead.',
      );
    }

    const deletedService = await this.prisma.service.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Service deleted successfully',
      data: deletedService,
    };
  }

  private async ensureServiceExists(id: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" was not found`);
    }
  }
}