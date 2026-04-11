import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleTradeStatusChange(payload: {
        tradeId: string;
        status: string;
    }): Promise<void>;
    handleKycApproved(payload: {
        userId: string;
    }): void;
    handleDisputeRaised(payload: {
        disputeId: string;
        tradeId: string;
    }): Promise<void>;
    handleDisputeResolved(payload: {
        disputeId: string;
        tradeId: string;
        resolution: string;
    }): Promise<void>;
}
