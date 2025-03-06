// src/actions/transfer.ts
import { formatEther, parseEther } from "viem";
import {
  composeContext,
  generateObjectDeprecated,
  ModelClass
} from "@elizaos/core";

// src/providers/wallet.ts
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  elizaLogger
} from "@elizaos/core";

// src/lib/chains.ts
import { defineChain } from "viem";
import { mainnet, sepolia } from "viem/chains";

// src/lib/constants.ts
var CONTRACTS = {
  lightlink: {
    UNIVERSAL_ROUTER: "0x6B3ea22C757BbF9C78CcAaa2eD9562b57001720B",
    UNISWAP_V3_FACTORY_ADDRESS: "0xEE6099234bbdC793a43676D98Eb6B589ca7112D7",
    UNISWAP_V3_QUOTER_ADDRESS: "0x243551e321Dac40508c22de2E00aBECF17F764b5"
  },
  lightlinkTestnet: {
    UNIVERSAL_ROUTER: "0x742d315e929B188e3F05FbC49774474a627b0502",
    UNISWAP_V3_FACTORY_ADDRESS: "0x1F98431c8aD98523631AE4a59f267346364d5Db4",
    UNISWAP_V3_QUOTER_ADDRESS: "0x0000000000000000000000000000000000000000"
  }
};
var blankKzg = () => ({
  blobToKzgCommitment: function(_) {
    throw new Error("Function not implemented.");
  },
  computeBlobKzgProof: function(_blob, _commitment) {
    throw new Error("Function not implemented.");
  }
});

// src/lib/chains.ts
var lightlink = defineChain({
  id: 1890,
  name: "Lightlink Phoenix",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [
        process.env.LIGHTLINK_MAINNET_RPC_URL || "https://replicator-01.phoenix.lightlink.io/rpc/v1"
      ],
      webSocket: [
        process.env.LIGHTLINK_MAINNET_RPC_URL || "wss://replicator-01.phoenix.lightlink.io/rpc/v1"
      ]
    }
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://phoenix.lightlink.io" }
  },
  contracts: {
    uniswapV3Factory: {
      address: CONTRACTS.lightlink.UNISWAP_V3_FACTORY_ADDRESS
    },
    universalRouter: {
      address: CONTRACTS.lightlink.UNIVERSAL_ROUTER
    },
    uniswapV3Quoter: {
      address: CONTRACTS.lightlink.UNISWAP_V3_QUOTER_ADDRESS
    }
  }
});
var lightlinkTestnet = defineChain({
  id: 1891,
  name: "Lightlink Pegasus Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: [
        process.env.LIGHTLINK_TESTNET_RPC_URL || "https://replicator-01.pegasus.lightlink.io/rpc/v1"
      ],
      webSocket: [
        process.env.LIGHTLINK_TESTNET_RPC_URL || "wss://replicator-01.pegasus.lightlink.io/rpc/v1"
      ]
    }
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://pegasus.lightlink.io" }
  },
  contracts: {
    uniswapV3Factory: {
      address: CONTRACTS.lightlinkTestnet.UNISWAP_V3_FACTORY_ADDRESS
    },
    universalRouter: {
      address: CONTRACTS.lightlinkTestnet.UNIVERSAL_ROUTER
    },
    uniswapV3Quoter: {
      address: CONTRACTS.lightlinkTestnet.UNISWAP_V3_QUOTER_ADDRESS
    }
  }
});
var chains = {
  sepolia,
  ethereum: mainnet,
  lightlink,
  lightlinkTestnet
};

// src/providers/wallet.ts
import NodeCache from "node-cache";
import * as path from "path";
var WalletProvider = class _WalletProvider {
  constructor(accountOrPrivateKey, cacheManager, chains2) {
    this.cacheManager = cacheManager;
    this.cacheKey = "evm/wallet";
    this.currentChain = "lightlink";
    this.CACHE_EXPIRY_SEC = 5;
    this.chains = { lightlink: chains.lightlink };
    this.setAccount = (accountOrPrivateKey) => {
      if (typeof accountOrPrivateKey === "string") {
        this.account = privateKeyToAccount(accountOrPrivateKey);
      } else {
        this.account = accountOrPrivateKey;
      }
    };
    this.setChains = (chains2) => {
      if (!chains2) {
        return;
      }
      Object.keys(chains2).forEach((chain) => {
        this.chains[chain] = chains2[chain];
      });
    };
    this.setCurrentChain = (chain) => {
      this.currentChain = chain;
    };
    this.createHttpTransport = (chainName) => {
      const chain = this.chains[chainName];
      if (chain.rpcUrls.custom) {
        return http(chain.rpcUrls.custom.http[0]);
      }
      return http(chain.rpcUrls.default.http[0]);
    };
    this.setAccount(accountOrPrivateKey);
    this.setChains(chains2);
    if (chains2 && Object.keys(chains2).length > 0) {
      this.setCurrentChain(Object.keys(chains2)[0]);
    }
    this.cache = new NodeCache({ stdTTL: this.CACHE_EXPIRY_SEC });
  }
  getAddress() {
    return this.account.address;
  }
  getCurrentChain() {
    return this.chains[this.currentChain];
  }
  getPublicClient(chainName) {
    chainName = _WalletProvider.validateName(chainName);
    if (!this.chains[chainName]?.id) {
      throw new Error("Invalid chain name:" + chainName);
    }
    const transport = this.createHttpTransport(chainName);
    const publicClient = createPublicClient({
      chain: this.chains[chainName],
      transport
    });
    return publicClient;
  }
  getWalletClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const walletClient = createWalletClient({
      chain: this.chains[chainName],
      transport,
      account: this.account
    });
    return walletClient;
  }
  getChainConfigs(chainName) {
    const chain = chains[chainName];
    if (!chain?.id) {
      throw new Error("Invalid chain name:" + chainName);
    }
    return chain;
  }
  async getWalletBalance() {
    const cacheKey = "walletBalance_" + this.currentChain;
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      elizaLogger.log(
        "Returning cached wallet balance for chain: " + this.currentChain
      );
      return cachedData;
    }
    try {
      const client = this.getPublicClient(this.currentChain);
      const balance = await client.getBalance({
        address: this.account.address
      });
      const balanceFormatted = formatUnits(balance, 18);
      this.setCachedData(cacheKey, balanceFormatted);
      elizaLogger.log(
        "Wallet balance cached for chain: ",
        this.currentChain
      );
      return balanceFormatted;
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  }
  async getWalletBalanceForChain(chainName) {
    try {
      const client = this.getPublicClient(chainName);
      const balance = await client.getBalance({
        address: this.account.address
      });
      return formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  }
  addChain(chain) {
    this.setChains(chain);
  }
  switchChain(chainName, customRpcUrl) {
    if (!this.chains[chainName]) {
      const chain = _WalletProvider.genChainFromName(
        chainName,
        customRpcUrl
      );
      this.addChain({ [chainName]: chain });
    }
    this.setCurrentChain(chainName);
  }
  async readFromCache(key) {
    const cached = await this.cacheManager.get(
      path.join(this.cacheKey, key)
    );
    return cached;
  }
  async writeToCache(key, data) {
    await this.cacheManager.set(path.join(this.cacheKey, key), data, {
      expires: Date.now() + this.CACHE_EXPIRY_SEC * 1e3
    });
  }
  async getCachedData(key) {
    const cachedData = this.cache.get(key);
    if (cachedData) {
      return cachedData;
    }
    const fileCachedData = await this.readFromCache(key);
    if (fileCachedData) {
      this.cache.set(key, fileCachedData);
      return fileCachedData;
    }
    return null;
  }
  async setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, data);
    await this.writeToCache(cacheKey, data);
  }
  static validateName(chainName) {
    if (chainName === "phoenix" || chainName === "mainnet") {
      chainName = "lightlink";
    }
    if (chainName === "pegasus" || chainName === "testnet") {
      chainName = "lightlinkTestnet";
    }
    if (chainName === "eth") {
      chainName = "ethereum";
    }
    return chainName;
  }
  static genChainFromName(chainName, customRpcUrl) {
    chainName = _WalletProvider.validateName(chainName);
    const baseChain = chains[chainName];
    if (!baseChain?.id) {
      throw new Error("Invalid chain name: " + chainName);
    }
    const viemChain = customRpcUrl ? {
      ...baseChain,
      rpcUrls: {
        ...baseChain.rpcUrls,
        custom: {
          http: [customRpcUrl]
        }
      }
    } : baseChain;
    return viemChain;
  }
};
var genChainsFromRuntime = (_) => {
  return chains;
};
var initWalletProvider = async (runtime) => {
  const teeMode = runtime.getSetting("TEE_MODE") || "OFF";
  const chains2 = genChainsFromRuntime(runtime);
  if (teeMode !== "OFF") {
    throw new Error("TEE not supported");
  }
  const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("EVM_PRIVATE_KEY is missing");
  }
  return new WalletProvider(privateKey, runtime.cacheManager, chains2);
};
var evmWalletProvider = {
  async get(runtime, _message, state) {
    try {
      const walletProvider = await initWalletProvider(runtime);
      const address = walletProvider.getAddress();
      const balance = await walletProvider.getWalletBalance();
      const chain = walletProvider.getCurrentChain();
      const agentName = state?.agentName || "The agent";
      return `${agentName}'s EVM Wallet Address: ${address}
Balance: ${balance} ${chain.nativeCurrency.symbol}
Chain ID: ${chain.id}, Name: ${chain.name}`;
    } catch (error) {
      console.error("Error in EVM wallet provider:", error);
      return null;
    }
  }
};

// src/templates/index.ts
var transferTemplate = `You are an AI assistant specialized in processing cryptocurrency transfer requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Here's a list of supported chains:
<supported_chains>
{{supportedChains}}
</supported_chains>

Lightlink is a EVM compatible L2 blockchain. It supports hyperfast sub second transactions and ultra low (often free) gas fees.
The Lightlink network the mainnet might also be called Lightlink Phoenix and the testnet sometimes called Lightlink Pegasus.

Your goal is to extract the following information about the requested transfer:
1. Chain to execute on (must be one of the supported chains, if none is specified default to lightlink)
2. Amount to transfer (in ETH, without the coin symbol)
3. Recipient address (must be a valid Ethereum address or a valid ENS name)
4. Token symbol or address (if not a native token transfer)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the chain.
   - Quote the part mentioning the amount.
   - Quote the part mentioning the recipient address.
   - Quote the part mentioning the token (if any).

2. Validate each piece of information:
   - Chain: List all supported chains and check if the mentioned chain is in the list.
   - Amount: Attempt to convert the amount to a number to verify it's valid.
   - Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Token: Note whether it's a native transfer or if a specific token is mentioned.

3. If any information is missing or invalid, prepare an appropriate error message.

4. If all information is valid, summarize your findings.

5. Prepare the JSON structure based on your analysis.

After your analysis, provide the final output in a JSON markdown block. All fields except 'token' are required. The JSON should have this structure:

\`\`\`json
{
    "fromChain": string,
    "amount": string,
    "toAddress": string,
    "token": string | null
}
\`\`\`

Remember:
- The chain name must be a string and must exactly match one of the supported chains.
- The amount should be a string representing the number without any currency symbol.
- The recipient address must be a valid Ethereum address starting with "0x".
- If no specific token is mentioned (i.e., it's a native token transfer), set the "token" field to null.

Now, process the user's request and provide your response.
`;
var swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Input token symbol or address (the token being sold)
- Output token symbol or address (the token being bought)
- Amount to swap: Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1")
- Chain to execute on (If none is specified default to lightlink)
- Slippage: Must be a floating point number between 0 and 1. Where 0 is 0% and 1 is 100%.

Note:
Lightlink is a EVM compatible L2 blockchain. It supports hyperfast sub second transactions and ultra low (often free) gas fees.
The Lightlink network the mainnet might also be called Lightlink Phoenix and the testnet sometimes called Lightlink Pegasus.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "inputToken": string,
    "outputToken": string,
    "amount": string,
    "chain": "sepolia" | "ethereum" | "lightlink" | "lightlinkTestnet",
    "slippage": number
}
\`\`\`
`;
var searchTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested search:
- Query: The search query to be performed on the chain. For example the query could be an address, an ENS name, a token symbol, A contract name, or a transaction hash.
- Chain: The chain to execute on (If none is specified default to lightlink)

For example the query could be an address, a token symbol, or a transaction hash. You might use
search to fund the address of a token, or locate a smart contract.

Note:
Lightlink is a EVM compatible L2 blockchain. It supports hyperfast sub second transactions and ultra low (often free) gas fees.
The Lightlink network the mainnet might also be called Lightlink Phoenix and the testnet sometimes called Lightlink Pegasus.
Searching on Lightlink is only supported on the Lightlink network.

Respond with a JSON markdown block containing only the extracted values. If you dont know the network, default to lightlink.

\`\`\`json
{
    "query": string,
    "chain": "lightlink" | "lightlinkTestnet"
}
\`\`\`
`;
var balanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

<supported_chains>
"sepolia" | "ethereum" | "lightlink" | "lightlinkTestnet"
</supported_chains>

Extract the following information about the requested balance query:
- Address: The address to get the balance of
- Token: The address of the token to get the balance for (if none is specified default to ETH)
- Chain: The chain to fetch the balance on (If none is specified default to "lightlink")

For example the query could be an address, a token symbol, or a transaction hash. You might use
search to fund the address of a token, or locate a smart contract.

Note:
Lightlink is a EVM compatible L2 blockchain. It supports hyperfast sub second transactions and ultra low (often free) gas fees.
The Lightlink mainnet might also be called Lightlink Phoenix and the testnet sometimes called Lightlink Pegasus.

Respond with a JSON markdown block containing only the extracted values. If you dont know the network, default to lightlink.
If you are getting the native balance aka ETH, set the token to null.

The chain variable must be one of the supported chains. e.g. "lightlink", "lightlinkTestnet", "sepolia" or "ethereum"

\`\`\`json
{
    "address": string,
    "token": string | null,
    "chain": "sepolia" | "ethereum" | "lightlink" | "lightlinkTestnet"
}
\`\`\`
`;

// src/actions/transfer.ts
import { resolveEnsDomain } from "@cryptokass/llx";
var TransferAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async transfer(params) {
    console.log(
      `Transferring: ${params.amount} tokens to (${params.toAddress} on ${params.fromChain})`
    );
    if (!params.data) {
      params.data = "0x";
    }
    const toAddress = params.toAddress.startsWith("0x") ? params.toAddress : await resolveEnsDomain(params.toAddress);
    this.walletProvider.switchChain(params.fromChain);
    const walletClient = this.walletProvider.getWalletClient(
      params.fromChain
    );
    try {
      const hash = await walletClient.sendTransaction({
        account: walletClient.account,
        to: toAddress,
        value: parseEther(params.amount),
        data: params.data,
        kzg: {
          blobToKzgCommitment: function(_) {
            throw new Error("Function not implemented.");
          },
          computeBlobKzgProof: function(_blob, _commitment) {
            throw new Error("Function not implemented.");
          }
        },
        chain: void 0
      });
      return {
        hash,
        from: walletClient.account.address,
        to: toAddress,
        value: parseEther(params.amount),
        data: params.data
      };
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }
};
var buildTransferDetails = async (state, runtime, wp) => {
  const chains2 = Object.keys(wp.chains);
  state.supportedChains = chains2.map((item) => `"${item}"`).join("|");
  const context = composeContext({
    state,
    template: transferTemplate
  });
  const transferDetails = await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL
  });
  const existingChain = wp.chains[transferDetails.fromChain];
  if (!existingChain) {
    throw new Error(
      "The chain " + transferDetails.fromChain + " not configured yet. Add the chain or choose one from configured: " + chains2.toString()
    );
  }
  return transferDetails;
};
var transferAction = {
  name: "transfer",
  description: "Transfer tokens between addresses on the same chain",
  handler: async (runtime, message, state, _options, callback) => {
    if (!state) {
      state = await runtime.composeState(message);
    } else {
      state = await runtime.updateRecentMessageState(state);
    }
    console.log("Transfer action handler called");
    const walletProvider = await initWalletProvider(runtime);
    const action = new TransferAction(walletProvider);
    const paramOptions = await buildTransferDetails(
      state,
      runtime,
      walletProvider
    );
    try {
      const transferResp = await action.transfer(paramOptions);
      if (callback) {
        callback({
          text: `Successfully transferred ${paramOptions.amount} tokens to ${paramOptions.toAddress}
Transaction Hash: ${transferResp.hash}`,
          content: {
            success: true,
            hash: transferResp.hash,
            amount: formatEther(transferResp.value),
            recipient: transferResp.to,
            chain: paramOptions.fromChain
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error during token transfer:", error);
      if (callback) {
        callback({
          text: `Error transferring tokens: ${error.message}`,
          content: { error: error.message }
        });
      }
      return false;
    }
  },
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "assistant",
        content: {
          text: "I'll help you transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          action: "SEND_TOKENS"
        }
      },
      {
        user: "user",
        content: {
          text: "Transfer 1 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          action: "SEND_TOKENS"
        }
      }
    ]
  ],
  similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKENS"]
};

// src/types/index.ts
var _SupportedChainList = Object.keys(chains);

// src/actions/swap.ts
import {
  composeContext as composeContext2,
  generateObjectDeprecated as generateObjectDeprecated2,
  ModelClass as ModelClass2
} from "@elizaos/core";
import { elektrik, fetchTokenDecimals } from "@cryptokass/llx";
import { parseUnits } from "viem";
var SwapAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async swap(params) {
    this.walletProvider.switchChain(params.chain);
    const publicClient = this.walletProvider.getPublicClient(params.chain);
    const walletClient = this.walletProvider.getWalletClient(params.chain);
    const chain = this.walletProvider.getChainConfigs(params.chain);
    const [fromAddress] = await walletClient.getAddresses();
    const inputDecimals = await fetchTokenDecimals(
      chain.id,
      params.fromToken
    );
    const amountIn = parseUnits(params.amount, inputDecimals);
    const quote = await elektrik.quoteExactInput(chain.id, {
      fromToken: params.fromToken,
      toToken: params.toToken,
      amountIn,
      fee: 3e3
    });
    const txs = await elektrik.swapExactInput(chain.id, fromAddress, {
      tokenIn: params.fromToken,
      tokenOut: params.toToken,
      amountIn,
      amountOut: quote.amountOut,
      slippage: params.slippage || 0.05,
      fee: 3e3
    });
    const actions = [];
    for (const tx of txs) {
      const hash = await walletClient.sendTransaction({
        chain,
        account: walletClient.account,
        kzg: blankKzg(),
        ...tx
      });
      await publicClient.waitForTransactionReceipt({ hash });
      actions.push({
        txHash: hash,
        description: `Swap:` + tx.description
      });
    }
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: actions[actions.length - 1].txHash
    });
    if (!receipt?.status || receipt.status === "reverted") {
      throw new Error("Transaction failed");
    }
    return {
      hash: receipt.transactionHash,
      fromToken: params.fromToken,
      toToken: params.toToken,
      amountIn,
      minAmountOut: quote.amountOut,
      recipient: fromAddress,
      steps: actions
    };
  }
};
var swapAction = {
  name: "swap",
  description: "Swap tokens on the same chain",
  handler: async (runtime, _message, state, _options, callback) => {
    console.log("Swap action handler called");
    const walletProvider = await initWalletProvider(runtime);
    const action = new SwapAction(walletProvider);
    const swapContext = composeContext2({
      state,
      template: swapTemplate
    });
    const content = await generateObjectDeprecated2({
      runtime,
      context: swapContext,
      modelClass: ModelClass2.LARGE
    });
    const swapOptions = {
      chain: content.chain,
      fromToken: content.inputToken,
      toToken: content.outputToken,
      amount: content.amount,
      slippage: content.slippage
    };
    try {
      const swapResp = await action.swap(swapOptions);
      if (callback) {
        callback({
          text: `Successfully swap ${swapOptions.amount} ${swapOptions.fromToken} tokens to ${swapOptions.toToken}
Transaction Hash: ${swapResp.hash}`,
          content: {
            success: true,
            hash: swapResp.hash,
            recipient: swapResp.recipient,
            chain: content.chain
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in swap handler:", error.message);
      if (callback) {
        callback({ text: `Error: ${error.message}` });
      }
      return false;
    }
  },
  template: swapTemplate,
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "user",
        content: {
          text: "Swap 1 ETH for USDC on Lightlink",
          action: "TOKEN_SWAP"
        }
      }
    ]
  ],
  similes: ["TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS"]
};

// src/actions/search.ts
import { search } from "@cryptokass/llx";
import {
  composeContext as composeContext3,
  generateObjectDeprecated as generateObjectDeprecated3,
  ModelClass as ModelClass3
} from "@elizaos/core";
var SearchAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async search(params) {
    const publicClient = this.walletProvider.getPublicClient(params.chain);
    if (params.chain != "lightlink" && params.chain != "lightlinkTestnet") {
      throw new Error("Chain not supported");
    }
    const results = await search(publicClient.chain.id, params.query);
    return {
      result: JSON.stringify(results, null, 2)
    };
  }
};
var searchAction = {
  name: "search",
  description: "Search block explorer for a specific address, token, or transaction",
  handler: async (runtime, _message, state, _options, callback) => {
    console.log("Search action handler called");
    const walletProvider = await initWalletProvider(runtime);
    const action = new SearchAction(walletProvider);
    const swapContext = composeContext3({
      state,
      template: searchTemplate
    });
    const content = await generateObjectDeprecated3({
      runtime,
      context: swapContext,
      modelClass: ModelClass3.LARGE
    });
    const searchOptions = {
      chain: content.chain,
      query: content.query
    };
    try {
      const searchResp = await action.search(searchOptions);
      if (callback) {
        callback({
          text: `Successfully searched for ${searchOptions.query} on ${searchOptions.chain}
Results: ${searchResp.result}`,
          content: {
            success: true,
            chain: content.chain
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in swap handler:", error.message);
      if (callback) {
        callback({ text: `Error: ${error.message}` });
      }
      return false;
    }
  },
  template: searchTemplate,
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "user",
        content: {
          text: "Search for the address of USDC on Lightlink",
          action: "SEARCH_BLOCKCHAIN"
        }
      }
    ]
  ],
  similes: ["SEARCH_BLOCKCHAIN", "SEARCH_ADDRESS", "SEARCH_TOKEN"]
};

// src/actions/balance.ts
import {
  composeContext as composeContext4,
  generateObjectDeprecated as generateObjectDeprecated4,
  ModelClass as ModelClass4
} from "@elizaos/core";
import { formatEther as formatEther2, formatUnits as formatUnits2 } from "viem";
import {
  fetchBalance,
  fetchTokenDecimals as fetchTokenDecimals2,
  fetchTokenSymbol,
  resolveEnsDomain as resolveEnsDomain2
} from "@cryptokass/llx";
var BalanceAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async balance(params) {
    console.log("Balance action called with params:", params);
    const publicClient = this.walletProvider.getPublicClient(params.chain);
    let address = params.address;
    if (!address.startsWith("0x")) {
      address = await resolveEnsDomain2(address);
    }
    if (isNull(params.token) || params.token.toLowerCase() == "eth") {
      const balance2 = await publicClient.getBalance({ address });
      return {
        balance: balance2.toString(),
        formattedBalance: formatEther2(balance2),
        symbol: "ETH"
      };
    }
    const balance = await fetchBalance(
      publicClient.chain.id,
      params.token,
      address
    );
    const decimals = await fetchTokenDecimals2(
      publicClient.chain.id,
      params.token
    );
    const symbol = await fetchTokenSymbol(publicClient.chain.id, params.token);
    return {
      balance: balance.toString(),
      formattedBalance: formatUnits2(balance, decimals),
      symbol
    };
  }
};
var balanceAction = {
  name: "balance",
  description: "Get the balance for an address and a specific token",
  handler: async (runtime, _message, state, _options, callback) => {
    console.log("Balance action handler called");
    const walletProvider = await initWalletProvider(runtime);
    const action = new BalanceAction(walletProvider);
    const balanceContext = composeContext4({
      state,
      template: balanceTemplate
    });
    const content = await generateObjectDeprecated4({
      runtime,
      context: balanceContext,
      modelClass: ModelClass4.LARGE
    });
    const balanceOptions = {
      chain: content.chain,
      address: content.address,
      token: content.token
    };
    try {
      const balanceResp = await action.balance(balanceOptions);
      if (callback) {
        callback({
          text: `Successfully got the balance for \`${balanceOptions.address}\`
 - Chain: ${balanceOptions.chain}
 - Balance: ${balanceResp.formattedBalance} ${balanceResp.symbol}
         (${balanceResp.balance} Units)`,
          content: {
            success: true,
            chain: content.chain,
            token: isNull(balanceOptions.token) ? "ETH" : balanceOptions.token,
            balance: balanceResp.balance,
            formattedBalance: balanceResp.formattedBalance,
            symbol: balanceResp.symbol
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in balance handler:", error.message);
      if (callback) {
        callback({ text: `Error: ${error.message}` });
      }
      return false;
    }
  },
  template: balanceTemplate,
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "user",
        content: {
          text: "Get the balance of 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Base",
          action: "GET_BALANCE"
        }
      }
    ]
  ],
  similes: ["GET_BALANCE", "GET_TOKEN_BALANCE"]
};
function isNull(value) {
  return value == null || value == "null" || value == "";
}

// src/index.ts
var lightlinkPlugin = {
  name: "lightlink",
  description: "Lightlink blockchain integration plugin",
  providers: [evmWalletProvider],
  evaluators: [],
  services: [],
  actions: [transferAction, swapAction, searchAction, balanceAction]
};
var index_default = lightlinkPlugin;
export {
  TransferAction,
  WalletProvider,
  index_default as default,
  evmWalletProvider,
  initWalletProvider,
  lightlinkPlugin,
  transferAction
};
//# sourceMappingURL=index.js.map