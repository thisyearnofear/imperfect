import React, { useState, useEffect } from "react";
import { initWeb3, updateLeaderboard } from "../utils/leaderboard";

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<
    { user: string; score: number; ensName?: string }[]
  >([]);

  useEffect(() => {
    initWeb3();
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const data = await updateLeaderboard();
    const leaderboardWithENS = await Promise.all(
      data.map(async (entry) => {
        const ensName = await resolveENSNameFallback(entry.user);
        return { ...entry, ensName };
      })
    );
    setLeaderboard(
      leaderboardWithENS.map((entry) => ({
        ...entry,
        ensName: entry.ensName || undefined,
      }))
    );
  };

  return (
    <div className="w-full h-full overflow-auto bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <ul className="space-y-2">
        {leaderboard.map((entry, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-700 p-2 rounded"
          >
            <span className="font-semibold">
              {index + 1}. {entry.ensName || shortenAddress(entry.user)}
            </span>
            <span className="text-yellow-400">{entry.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

async function resolveENSNameFallback(address: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.ensdata.net/${address}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.ens_primary || null;
  } catch (error) {
    console.error("Error resolving ENS name using ENS Data API:", error);
    return null;
  }
}

function shortenAddress(address: string): string {
  return `${address.substr(0, 6)}...${address.substr(-4)}`;
}
