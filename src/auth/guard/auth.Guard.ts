import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		console.log('Request headers:', request.headers);

		const authHeader = request.headers['authorization'];
		let token = null;

		// 1. Check Bearer token
		if (authHeader && authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1];
		}

		// 2. If no Bearer token, check cookie
		if (!token && request.cookies?.token) {
			token = request.cookies.token;
		}

		if (!token) {
			throw new UnauthorizedException('No authentication token provided');
		}

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
