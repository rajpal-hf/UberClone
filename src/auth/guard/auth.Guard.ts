import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		const authHeader = request.headers['authorization'];
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException('Authorization header missing or malformed');
		}

		const token = authHeader.split(' ')[1] || request.cookies.token;
		console.log("jinga lala huhu", token);

		try {
			const decoded = await this.jwtService.verifyAsync(token, {
				secret: process.env.JWT_SECRET,
			});
			console.log('Decoded JWT:', decoded);
			request.user = decoded;
			return true;
		} catch (error) {
			console.error('Token verification failed:', error);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}
