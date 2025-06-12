// filename: backend/src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private jwksClient: jwksClient.JwksClient;

  constructor(private configService: ConfigService) {
    const tenantId = configService.get<string>('AZURE_TENANT_ID');
    const clientId = configService.get<string>('AZURE_CLIENT_ID');
    
    if (!tenantId || !clientId) {
      throw new Error('AZURE_TENANT_ID and AZURE_CLIENT_ID must be configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: clientId,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      algorithms: ['RS256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        this.getSigningKey(rawJwtToken)
          .then(key => done(null, key))
          .catch(err => done(err));
      },
    });

    // Initialize JWKS client for Azure AD
    this.jwksClient = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  private async getSigningKey(token: string): Promise<string> {
    try {
      const decoded = this.decodeToken(token);
      const kid = decoded.header.kid;
      
      if (!kid) {
        throw new UnauthorizedException('Token missing kid in header');
      }

      const key = await this.jwksClient.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      throw new UnauthorizedException(`Failed to get signing key: ${error.message}`);
    }
  }

  private decodeToken(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return { header, payload };
    } catch (error) {
      throw new UnauthorizedException('Failed to decode token');
    }
  }

  async validate(payload: any) {
    // Validate required claims
    if (!payload.sub || !payload.aud) {
      throw new UnauthorizedException('Token missing required claims');
    }

    // Check if token audience matches our client ID
    const expectedAudience = this.configService.get<string>('AZURE_CLIENT_ID');
    if (payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      throw new UnauthorizedException('Token has expired');
    }

    // Return user info from token
    return {
      userId: payload.sub,
      email: payload.email || payload.preferred_username,
      name: payload.name,
      roles: payload.roles || [],
      scopes: payload.scp ? payload.scp.split(' ') : [],
    };
  }
}