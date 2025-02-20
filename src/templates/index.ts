export const transferTemplate = `You are an AI assistant specialized in processing cryptocurrency transfer requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

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

export const swapTemplate = `Given the recent messages and wallet information below:

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

export const searchTemplate = `Given the recent messages and wallet information below:

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

export const balanceTemplate = `Given the recent messages and wallet information below:

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
