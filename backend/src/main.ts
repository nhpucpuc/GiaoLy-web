import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình CORS để Frontend React kết nối
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Tự động Validate dữ liệu request DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 3. Tự động tạo Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('GLY - API Giáo Xứ Sơn Lộc')
    .setDescription('Hệ thống API Quản lý Giáo Lý, Lớp học, Điểm số, Chuyên cần và Học bạ')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 GLY Backend Server is running at: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
