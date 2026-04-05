import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../core/prisma/prisma.service';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token?.split(' ')[1] || client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      client.data.userId = userId;
      client.join(userId);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.warn(`Failed connection attempt: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('trade.status_changed')
  async handleTradeStatusChange(payload: { tradeId: string, status: string }) {
    const trade = await this.prisma.trade.findUnique({ where: { id: payload.tradeId } });
    if (trade) {
      this.server.to(trade.buyerId).emit('trade.status_changed', payload);
      this.server.to(trade.sellerId).emit('trade.status_changed', payload);
    }
  }

  @OnEvent('kyc.approved')
  handleKycApproved(payload: { userId: string }) {
    this.server.to(payload.userId).emit('kyc.status_changed', { status: 'APPROVED' });
  }

  @OnEvent('dispute.raised')
  async handleDisputeRaised(payload: { disputeId: string, tradeId: string }) {
    const trade = await this.prisma.trade.findUnique({ where: { id: payload.tradeId } });
    if (trade) {
      this.server.to(trade.buyerId).emit('dispute.status_changed', { status: 'OPEN' });
      this.server.to(trade.sellerId).emit('dispute.status_changed', { status: 'OPEN' });
    }
  }

  @OnEvent('dispute.resolved')
  async handleDisputeResolved(payload: { disputeId: string, tradeId: string, resolution: string }) {
    const trade = await this.prisma.trade.findUnique({ where: { id: payload.tradeId } });
    if (trade) {
      this.server.to(trade.buyerId).emit('dispute.status_changed', { status: 'RESOLVED', resolution: payload.resolution });
      this.server.to(trade.sellerId).emit('dispute.status_changed', { status: 'RESOLVED', resolution: payload.resolution });
    }
  }
}
