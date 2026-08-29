import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        holyName: user.holyName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        assignedClassId: user.assignedClassId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email này đã được đăng ký trên hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: registerDto.fullName,
        holyName: registerDto.holyName,
        role: registerDto.role || 'PARENT',
        phone: registerDto.phone,
        assignedClassId: registerDto.assignedClassId,
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Đăng ký tài khoản thành công',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        holyName: user.holyName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        assignedClassId: user.assignedClassId,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        holyName: true,
        role: true,
        phone: true,
        avatar: true,
        assignedClassId: true,
        assignedClass: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản');
    }

    return user;
  }

  async getAllCatechists() {
    return this.prisma.user.findMany({
      where: { role: 'CATECHIST' },
      select: {
        id: true,
        email: true,
        rawPassword: true,
        fullName: true,
        holyName: true,
        role: true,
        phone: true,
        avatar: true,
        assignedClassId: true,
        assignedClass: {
          select: {
            id: true,
            name: true,
            category: true,
            session: true,
            schedule: true,
            catechistLeader: true,
          },
        },
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async syncClassCatechistNames(classId: string | null) {
    if (!classId) return;

    const assignedUsers = await this.prisma.user.findMany({
      where: { assignedClassId: classId, role: 'CATECHIST' },
      orderBy: { createdAt: 'asc' },
    });

    if (assignedUsers.length === 0) {
      await this.prisma.classRoom.update({
        where: { id: classId },
        data: {
          catechistLeader: 'Chưa phân công',
          catechistAssists: [],
        },
      });
      return;
    }

    const displayNames = assignedUsers.map((u) =>
      u.holyName && u.holyName !== 'Giáo Lý Viên'
        ? `${u.holyName} ${u.fullName}`
        : u.fullName
    );

    await this.prisma.classRoom.update({
      where: { id: classId },
      data: {
        catechistLeader: displayNames[0],
        catechistAssists: displayNames.slice(1),
      },
    });
  }

  async assignClassToCatechist(catechistId: string, classId: string | null) {
    const catechist = await this.prisma.user.findUnique({
      where: { id: catechistId },
    });

    if (!catechist) {
      throw new UnauthorizedException('Không tìm thấy Giáo Lý Viên');
    }

    const oldClassId = catechist.assignedClassId;

    // 1. Cập nhật assignedClassId của Giáo lý viên
    const updatedUser = await this.prisma.user.update({
      where: { id: catechistId },
      data: { assignedClassId: classId },
      include: { assignedClass: true },
    });

    // 2. Đồng bộ tên tất cả GLV của lớp mới và lớp cũ
    if (classId) {
      await this.syncClassCatechistNames(classId);
    }
    if (oldClassId && oldClassId !== classId) {
      await this.syncClassCatechistNames(oldClassId);
    }

    return updatedUser;
  }

  async createCatechist(dto: {
    holyName?: string;
    fullName: string;
    phone?: string;
    email?: string;
    password?: string;
    assignedClassId?: string | null;
  }) {
    let email = dto.email ? dto.email.toLowerCase().trim() : '';
    if (!email) {
      const normalized = dto.fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      email = `${normalized}.glv@gxsonloc.vn`;
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`Email ${email} đã tồn tại trong hệ thống`);
    }

    const plainPassword = dto.password?.trim() || 'glv123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        rawPassword: plainPassword,
        fullName: dto.fullName,
        holyName: dto.holyName || 'Giáo Lý Viên',
        phone: dto.phone || '0900 000 000',
        role: 'CATECHIST',
        assignedClassId: dto.assignedClassId || null,
      },
      include: {
        assignedClass: true,
      },
    });

    // Nếu gán lớp ngay khi tạo, đồng bộ tên tất cả GLV của lớp
    if (dto.assignedClassId) {
      await this.syncClassCatechistNames(dto.assignedClassId);
    }

    return user;
  }

  async deleteCatechist(id: string) {
    const catechist = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!catechist) {
      throw new UnauthorizedException('Không tìm thấy Giáo Lý Viên');
    }

    const oldClassId = catechist.assignedClassId;

    const res = await this.prisma.user.delete({
      where: { id },
    });

    if (oldClassId) {
      await this.syncClassCatechistNames(oldClassId);
    }

    return res;
  }

  async changePassword(userId: string, dto: { oldPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy tài khoản người dùng');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword.trim(), salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        rawPassword: dto.newPassword.trim(),
      },
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}


