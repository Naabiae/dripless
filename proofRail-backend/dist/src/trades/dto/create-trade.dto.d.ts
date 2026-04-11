import { Chain, PaymentMethod } from '@prisma/client';
export declare class CreateTradeDto {
    sellerId: string;
    chain: Chain;
    assetSymbol: string;
    assetAmount: number;
    fiatCurrency: string;
    fiatAmount: number;
    fiatRate: number;
    paymentMethod: PaymentMethod;
}
