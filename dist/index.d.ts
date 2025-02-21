import { ICacheManager, IAgentRuntime, Provider, Action, Plugin } from '@elizaos/core';
import * as viem from 'viem';
import { Hash, Address, Chain, PublicClient, HttpTransport, Account, WalletClient, PrivateKeyAccount } from 'viem';
import { Token } from '@lifi/types';

declare const chains: {
    sepolia: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://sepolia.etherscan.io";
                readonly apiUrl: "https://api-sepolia.etherscan.io/api";
            };
        };
        contracts: {
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 751532;
            };
            readonly ensRegistry: {
                readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
            };
            readonly ensUniversalResolver: {
                readonly address: "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC";
                readonly blockCreated: 5317080;
            };
        };
        id: 11155111;
        name: "Sepolia";
        nativeCurrency: {
            readonly name: "Sepolia Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://sepolia.drpc.org"];
            };
        };
        sourceId?: number | undefined;
        testnet: true;
        custom?: Record<string, unknown> | undefined;
        fees?: viem.ChainFees<undefined> | undefined;
        formatters?: undefined;
        serializers?: viem.ChainSerializers<undefined, viem.TransactionSerializable> | undefined;
    };
    ethereum: {
        blockExplorers: {
            readonly default: {
                readonly name: "Etherscan";
                readonly url: "https://etherscan.io";
                readonly apiUrl: "https://api.etherscan.io/api";
            };
        };
        contracts: {
            readonly ensRegistry: {
                readonly address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
            };
            readonly ensUniversalResolver: {
                readonly address: "0xce01f8eee7E479C928F8919abD53E553a36CeF67";
                readonly blockCreated: 19258213;
            };
            readonly multicall3: {
                readonly address: "0xca11bde05977b3631167028862be2a173976ca11";
                readonly blockCreated: 14353601;
            };
        };
        id: 1;
        name: "Ethereum";
        nativeCurrency: {
            readonly name: "Ether";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://cloudflare-eth.com"];
            };
        };
        sourceId?: number | undefined;
        testnet?: boolean | undefined;
        custom?: Record<string, unknown> | undefined;
        fees?: viem.ChainFees<undefined> | undefined;
        formatters?: undefined;
        serializers?: viem.ChainSerializers<undefined, viem.TransactionSerializable> | undefined;
    };
    lightlink: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://phoenix.lightlink.io";
            };
        };
        contracts: {
            readonly uniswapV3Factory: {
                readonly address: string;
            };
            readonly universalRouter: {
                readonly address: string;
            };
            readonly uniswapV3Quoter: {
                readonly address: string;
            };
        };
        id: 1890;
        name: "Lightlink Phoenix";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        rpcUrls: {
            readonly default: {
                readonly http: readonly [string];
                readonly webSocket: readonly [string];
            };
        };
        sourceId?: number | undefined;
        testnet?: boolean | undefined;
        custom?: Record<string, unknown>;
        fees?: viem.ChainFees<undefined>;
        formatters?: undefined;
        serializers?: viem.ChainSerializers<undefined, viem.TransactionSerializable>;
    };
    lightlinkTestnet: {
        blockExplorers: {
            readonly default: {
                readonly name: "Explorer";
                readonly url: "https://pegasus.lightlink.io";
            };
        };
        contracts: {
            readonly uniswapV3Factory: {
                readonly address: string;
            };
            readonly universalRouter: {
                readonly address: string;
            };
            readonly uniswapV3Quoter: {
                readonly address: string;
            };
        };
        id: 1891;
        name: "Lightlink Pegasus Testnet";
        nativeCurrency: {
            readonly decimals: 18;
            readonly name: "Ether";
            readonly symbol: "ETH";
        };
        rpcUrls: {
            readonly default: {
                readonly http: readonly [string];
                readonly webSocket: readonly [string];
            };
        };
        sourceId?: number | undefined;
        testnet?: boolean | undefined;
        custom?: Record<string, unknown>;
        fees?: viem.ChainFees<undefined>;
        formatters?: undefined;
        serializers?: viem.ChainSerializers<undefined, viem.TransactionSerializable>;
    };
};

declare const _SupportedChainList: Array<keyof typeof chains>;
type SupportedChain = (typeof _SupportedChainList)[number];
interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}
type SwapStep = {
    txHash: string;
    description?: string;
};
interface SwapTransaction {
    hash: Hash;
    fromToken: Address;
    toToken: Address;
    amountIn: bigint;
    minAmountOut: bigint;
    recipient: Address;
    steps: SwapStep[];
}
interface TokenWithBalance {
    token: Token;
    balance: bigint;
    formattedBalance: string;
    priceUSD: string;
    valueUSD: string;
}
interface WalletBalance {
    chain: SupportedChain;
    address: Address;
    totalValueUSD: string;
    tokens: TokenWithBalance[];
}
interface ChainMetadata {
    chainId: number;
    name: string;
    chain: Chain;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}
interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient?: WalletClient;
}
interface TransferParams {
    fromChain: SupportedChain;
    toAddress: string;
    amount: string;
    data?: `0x${string}`;
}
interface SwapParams {
    chain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    slippage?: number;
}
interface BridgeParams {
    fromChain: SupportedChain;
    toChain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    toAddress?: Address;
}
interface SearchParams {
    chain: SupportedChain;
    query: string;
}
interface SearchResult {
    result: string;
}
interface BalanceParams {
    chain: SupportedChain;
    address: Address;
    token: Address | null;
}
interface BalanceResult {
    balance: string;
    formattedBalance: string;
    symbol: string;
}
interface EvmPluginConfig {
    rpcUrl?: {
        ethereum?: string;
        sepolia?: string;
        lightlink?: string;
        lightlinkTestnet?: string;
    };
    secrets?: {
        EVM_PRIVATE_KEY: string;
    };
    testMode?: boolean;
    multicall?: {
        batchSize?: number;
        wait?: number;
    };
}
type LiFiStatus = {
    status: "PENDING" | "DONE" | "FAILED";
    substatus?: string;
    error?: Error;
};
type LiFiRoute = {
    transactionHash: Hash;
    transactionData: `0x${string}`;
    toAddress: Address;
    status: LiFiStatus;
};
interface TokenData extends Token {
    symbol: string;
    decimals: number;
    address: Address;
    name: string;
    logoURI?: string;
    chainId: number;
}
interface TokenPriceResponse {
    priceUSD: string;
    token: TokenData;
}
interface TokenListResponse {
    tokens: TokenData[];
}
interface ProviderError extends Error {
    code?: number;
    data?: unknown;
}

declare class WalletProvider {
    private cacheManager;
    private cache;
    private cacheKey;
    private currentChain;
    private CACHE_EXPIRY_SEC;
    chains: Record<string, Chain>;
    account: PrivateKeyAccount;
    constructor(accountOrPrivateKey: PrivateKeyAccount | `0x${string}`, cacheManager: ICacheManager, chains?: Record<string, Chain>);
    getAddress(): Address;
    getCurrentChain(): Chain;
    getPublicClient(chainName: SupportedChain): PublicClient<HttpTransport, Chain, Account | undefined>;
    getWalletClient(chainName: SupportedChain): WalletClient;
    getChainConfigs(chainName: SupportedChain): Chain;
    getWalletBalance(): Promise<string | null>;
    getWalletBalanceForChain(chainName: SupportedChain): Promise<string | null>;
    addChain(chain: Record<string, Chain>): void;
    switchChain(chainName: SupportedChain, customRpcUrl?: string): void;
    private readFromCache;
    private writeToCache;
    private getCachedData;
    private setCachedData;
    private setAccount;
    private setChains;
    private setCurrentChain;
    private createHttpTransport;
    static validateName(chainName: string): string;
    static genChainFromName(chainName: string, customRpcUrl?: string | null): Chain;
}
declare const initWalletProvider: (runtime: IAgentRuntime) => Promise<WalletProvider>;
declare const evmWalletProvider: Provider;

declare class TransferAction {
    private walletProvider;
    constructor(walletProvider: WalletProvider);
    transfer(params: TransferParams): Promise<Transaction>;
}
declare const transferAction: Action;

declare const lightlinkPlugin: Plugin;

export { type BalanceParams, type BalanceResult, type BridgeParams, type ChainConfig, type ChainMetadata, type EvmPluginConfig, type LiFiRoute, type LiFiStatus, type ProviderError, type SearchParams, type SearchResult, type SupportedChain, type SwapParams, type SwapStep, type SwapTransaction, type TokenData, type TokenListResponse, type TokenPriceResponse, type TokenWithBalance, type Transaction, TransferAction, type TransferParams, type WalletBalance, WalletProvider, lightlinkPlugin as default, evmWalletProvider, initWalletProvider, lightlinkPlugin, transferAction };
