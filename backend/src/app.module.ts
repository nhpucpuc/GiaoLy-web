import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassesModule } from './modules/classes/classes.module';
import { StudentsModule } from './modules/students/students.module';
import { GradesModule } from './modules/grades/grades.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClassesModule,
    StudentsModule,
    GradesModule,
    AttendanceModule,
    AnnouncementsModule,
  ],
})
export class AppModule {}
