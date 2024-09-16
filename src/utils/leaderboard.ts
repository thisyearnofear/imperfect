import Web3 from "web3";
import { AbiItem } from "web3-utils";

export const baseSepoliaChainId = 84532;
export const baseSepoliaRpcUrl = "https://sepolia.base.org";

let web3: Web3;
let userAddress: string;
let baseLeaderboardContract: any;

const baseContractAddress = "0x8B62D610c83C42Ea8A8fC10F80581d9B7701cd37";

const baseContractABI: AbiItem[] = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_score",
        type: "uint256",
      },
    ],
    name: "addScore",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FeesWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "score",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "ScoreAdded",
    type: "event",
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "dailyLeaderboard",
    outputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "score",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDailyLeaderboard",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
        ],
        internalType: "struct BaseLeaderboard.Score[10]",
        name: "",
        type: "tuple[10]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LEADERBOARD_LENGTH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MINIMUM_FEE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function initWeb3() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
  } else {
    console.log(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
    web3 = new Web3(new Web3.providers.HttpProvider(baseSepoliaRpcUrl));
  }
  await initContracts();
  await updateLeaderboard();
}

async function initContracts() {
  if (web3) {
    baseLeaderboardContract = new web3.eth.Contract(
      baseContractABI,
      baseContractAddress
    );
    console.log("Contracts initialized");
  } else {
    console.error("Web3 not initialized");
  }
}

async function updateLeaderboard(): Promise<{ user: string; score: number }[]> {
  const fallbackBaseRpcUrls = [
    "https://base-sepolia-rpc.publicnode.com",
    "https://public.stackup.sh/api/v1/node/base-sepolia",
    "https://sepolia.base.org",
  ];

  try {
    const baseLeaderboardData = await fetchLeaderboardData(
      baseLeaderboardContract,
      fallbackBaseRpcUrls
    );

    return baseLeaderboardData
      .map((entry: any) => ({
        user: entry.user,
        score: parseInt(entry.score, 10),
      }))
      .filter(
        (entry: { user: string; score: number }) =>
          entry.user !== "0x0000000000000000000000000000000000000000"
      );
  } catch (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }
}

async function fetchLeaderboardData(
  contract: any,
  fallbackRpcUrls: string[]
): Promise<any[]> {
  for (const rpcUrl of fallbackRpcUrls) {
    try {
      console.log(`Trying to fetch data from ${rpcUrl}`);
      const provider = new Web3.providers.HttpProvider(rpcUrl);
      const web3 = new Web3(provider);
      const contractInstance = new web3.eth.Contract(
        contract.options.jsonInterface,
        contract.options.address
      );
      const data = await contractInstance.methods.getDailyLeaderboard().call();
      console.log(`Successfully fetched data from ${rpcUrl}`);
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${rpcUrl}:`, error);
    }
  }
  throw new Error("All RPC URLs failed");
}

export { initWeb3, updateLeaderboard };
