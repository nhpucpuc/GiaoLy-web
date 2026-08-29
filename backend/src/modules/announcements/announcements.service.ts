import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(targetAudience?: string) {
    const where: any = {};
    if (targetAudience) {
      where.OR = [
        { targetAudience: 'Tất cả' },
        { targetAudience: targetAudience },
      ];
    }
    return this.prisma.announcement.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async create(data: {
    title: string;
    content: string;
    author: string;
    targetAudience: string;
    type: string;
    date: string;
  }) {
    return this.prisma.announcement.create({
      data,
    });
  }
}
