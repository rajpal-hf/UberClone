import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	
	app.enableCors({
		origin: 'http://localhost:5173',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true
	})
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		transform :true
	}))

	app.useWebSocketAdapter(new WsAdapter(app));
	const config = new DocumentBuilder()
		.setTitle('Uber')
		.setDescription('The Uber Clone')
		.setVersion('1.0')
		.addTag('uber')
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory, {
		swaggerOptions: {
			persistAuthorization : true
		}
	});
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
