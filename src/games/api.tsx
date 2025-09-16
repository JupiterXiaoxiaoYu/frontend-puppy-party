import BN from "bn.js";
import { DanceType } from "./components/Gameplay";
import { createCommand } from "zkwasm-minirollup-rpc";
import { L2AccountInfo, L1AccountInfo } from "zkwasm-minirollup-browser";

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

function bytesToHex(bytes: Array<number>): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function getCreatePlayerTransactionParameter(
  l2account: L2AccountInfo,
  nonce: bigint | number
) {
  return {
    cmd: createCommand(BigInt(nonce), CREATE_PLAYER, [0n, 0n, 0n]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getDanceTransactionParameter(
  l2account: L2AccountInfo,
  danceType: DanceType,
  memeId: number,
  nonce: bigint | number
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

  const nonceAsBigInt = BigInt(nonce);
  const memeIdAsBigInt = BigInt(memeId);
  const cmd = createCommand(nonceAsBigInt, danceCommand, [memeIdAsBigInt]);

  return {
    cmd,
    prikey: l2account.getPrivateKey(),
  };
}

export function getLotteryransactionParameter(
  l2account: L2AccountInfo,
  nonce: bigint | number
) {
  return {
    cmd: createCommand(BigInt(nonce), LOTTERY, []),
    prikey: l2account!.getPrivateKey(),
  };
}

export function getWithdrawTransactionParameter(
  l1account: L1AccountInfo,
  l2account: L2AccountInfo,
  amount: bigint,
  nonce: bigint | number
) {
  const address = l1account.address.slice(2);
  const addressBN = new BN(address, 16);
  const addressBE = addressBN.toArray("be", 20); // 20 bytes = 160 bits and split into 4, 8, 8
  const firstLimb = BigInt("0x" + bytesToHex(addressBE.slice(0, 4).reverse()));
  const sndLimb = BigInt("0x" + bytesToHex(addressBE.slice(4, 12).reverse()));
  const thirdLimb = BigInt(
    "0x" + bytesToHex(addressBE.slice(12, 20).reverse())
  );

  return {
    cmd: createCommand(BigInt(nonce), WITHDRAW, [
      (firstLimb << 32n) + amount,
      sndLimb,
      thirdLimb,
    ]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getStakeTransactionParameter(
  l2account: L2AccountInfo,
  memeId: number,
  amount: number,
  nonce: bigint | number
) {
  return {
    cmd: createCommand(BigInt(nonce), STAKE, [BigInt(memeId), BigInt(amount)]),
    prikey: l2account.getPrivateKey(),
  };
}

export function getWithdrawLotteryTransactionParameter(
  l1account: L1AccountInfo,
  l2account: L2AccountInfo,
  amount: bigint,
  nonce: bigint | number
) {
  const address = l1account.address.slice(2);
  const addressBN = new BN(address, 16);
  const addressBE = addressBN.toArray("be", 20); // 20 bytes = 160 bits and split into 4, 8, 8
  const firstLimb = BigInt("0x" + bytesToHex(addressBE.slice(0, 4).reverse()));
  const sndLimb = BigInt("0x" + bytesToHex(addressBE.slice(4, 12).reverse()));
  const thirdLimb = BigInt(
    "0x" + bytesToHex(addressBE.slice(12, 20).reverse())
  );

  return {
    cmd: createCommand(BigInt(nonce), WITHDRAW_LOTTERY, [
      (firstLimb << 32n) + amount,
      sndLimb,
      thirdLimb,
    ]),
    prikey: l2account.getPrivateKey(),
  };
}
