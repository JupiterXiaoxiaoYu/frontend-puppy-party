import BN from "bn.js";
import { L2AccountInfo, L1AccountInfo } from "zkwasm-minirollup-browser";
import { DanceType } from "./components/Gameplay";
import { createWithdrawCommand, createCommand } from "zkwasm-minirollup-rpc";
import { createAsyncThunk } from '@reduxjs/toolkit';
import { ZKWasmAppRpc } from "zkwasm-minirollup-rpc";
import { LeHexBN, query } from 'zkwasm-minirollup-rpc';

const CREATE_PLAYER = 1n;
const VOTE = 2n;
const STAKE = 3n;
const COLLECT = 4n;
const COMMENT = 5n;
const LOTTERY = 6n;
const INSTALL_MEME = 7n;
const WITHDRAW = 8n;
const DEPOSIT = 9n;
const WITHDRAW_LOTTERY = 10n;

//export const rpcURL = "http://localhost:3000";
export const rpcURL = "https://rpc.memedisco.zkwasm.ai";

function bytesToHex(bytes: Array<number>): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

const rpc = new ZKWasmAppRpc(rpcURL);

async function queryData(url: string) {
  try {
    const data: any = await rpc.queryData(url)
    return data.data;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 500) {
        throw new Error("QueryStateError");
      } else {
        throw new Error("UnknownError");
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw new Error("No response was received from the server, please check your network connection.");
    } else {
      throw new Error("UnknownError");
    }
  }
}


async function queryStakeI(key: string) {
  const pubkey = new LeHexBN(query(key).pkx).toU64Array();
  return await queryData(`position/${pubkey[1]}/${pubkey[2]}`);
}

export const queryStake = createAsyncThunk(
  'client/queryStake',
  async (key: string, { rejectWithValue }) => {
    try {
      const state: any = await queryStakeI(key);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export function getCreatePlayerTransactionParameter(
  l2account: L2AccountInfo,
  nonce: bigint
) {
  return {
    cmd: createCommand(nonce, CREATE_PLAYER, [0n, 0n, 0n]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getDanceTransactionParameter(
  l2account: L2AccountInfo,
  danceType: DanceType,
  memeId: number,
  nonce: bigint
) {
  const danceCommand =
    danceType == DanceType.Vote
      ? VOTE
      : danceType == DanceType.Collect
      ? COLLECT
      : danceType == DanceType.Comment
      ? COMMENT
      : 0n;
  if (danceCommand == 0n) {
    throw new Error("Invalid dance type");
  }

  return {
    cmd: createCommand(nonce, danceCommand, [BigInt(memeId)]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getLotteryransactionParameter(
  l2account: L2AccountInfo,
  nonce: bigint
) {
  return {
    cmd: createCommand(nonce, LOTTERY, []),
    prikey: l2account!.getPrivateKey(),
  };
}

export function getWithdrawTransactionParameter(
  l1account: L1AccountInfo,
  l2account: L2AccountInfo,
  amount: bigint,
  nonce: bigint
) {
  const address = l1account.address.slice(2);
  const cmd = createWithdrawCommand(nonce, WITHDRAW, address, 0n, amount);
  return {
    cmd,
    prikey: l2account.getPrivateKey(),
  };
}

export function getStakeTransactionParameter(
  l2account: L2AccountInfo,
  memeId: number,
  amount: number,
  nonce: bigint
) {
  return {
    cmd: createCommand(nonce, STAKE, [BigInt(memeId), BigInt(amount)]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getWithdrawLotteryTransactionParameter(
  l1account: L1AccountInfo,
  l2account: L2AccountInfo,
  amount: bigint,
  nonce: bigint
) {
  const address = l1account.address.slice(2);
  const cmd = createWithdrawCommand(nonce, WITHDRAW_LOTTERY, address, 1n, amount);
  return {
    cmd,
    prikey: l2account.getPrivateKey(),
  };
}
