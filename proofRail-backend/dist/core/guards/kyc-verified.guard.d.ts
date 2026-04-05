import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class KycVerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
