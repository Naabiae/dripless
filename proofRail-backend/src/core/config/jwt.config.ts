import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: Buffer.from(process.env.JWT_PRIVATE_KEY || '', 'base64').toString('ascii'),
  publicKey: Buffer.from(process.env.JWT_PUBLIC_KEY || '', 'base64').toString('ascii'),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
