import { useState } from "react";
import background from "../../images/deposit_frame.png";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import "./DepositPopup.css";
import { useWalletContext } from "zkwasm-minirollup-browser";
import ConfirmButton from "../buttons/WithdrawConfirmButton";
import CancelButton from "../buttons/WithdrawCancelButton";
import {selectUIState, setPopupDescription, setUIState, UIState} from "../../../data/ui";

function getFirst10Words(input: string): string {
  const words = input.split(/\s+/);
  const first10Words = words.slice(0, 10);
  if (words.length > 10) {
    first10Words.push("...");
  }
  return first10Words.join(" ");
}

const DepositPopup = () => {
  const dispatch = useAppDispatch();
  const uIState = useAppSelector(selectUIState);
  const { l1Account, l2Account, deposit: walletDeposit } = useWalletContext();
  const [amountString, setAmountString] = useState("");

  const handleDeposit = async (amount: string) => {
    if (!l1Account || !l2Account) {
      dispatch(setPopupDescription({
        popupDescription: "Please connect your wallet first"
      }));
      dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      return;
    }

    try {
      dispatch(setUIState({ uIState: UIState.QueryDeposit }));
      
      // 使用新的钱包上下文API进行存款
      await walletDeposit({
        tokenIndex: 0,
        amount: parseFloat(amount),
      });
      
      // 存款成功
      dispatch(setPopupDescription({
        popupDescription: "Deposit successful!",
      }));
      dispatch(setUIState({ uIState: UIState.ConfirmPopup }));
      
    } catch (error: any) {
      console.error("Deposit failed:", error);
      
      let errorMessage = "Deposit failed";
      if (error?.message?.includes("User rejected") || 
          error?.message?.includes("User cancelled")) {
        errorMessage = "User rejected action";
      } else if (error?.message) {
        errorMessage = "Deposit Fail: " + getFirst10Words(error.message);
      }
      
      dispatch(setPopupDescription({
        popupDescription: errorMessage,
      }));
      dispatch(setUIState({ uIState: UIState.ErrorPopup }));
    }
  };

  const onClickConfirm = () => {
    if (uIState == UIState.DepositPopup) {
      handleDeposit(amountString);
    }
  };

  const onClickCancel = () => {
    if (uIState == UIState.DepositPopup) {
      dispatch(setUIState({ uIState: UIState.Idle }));
    }
  };

  return (
    <div className="deposit-popup-container">
      <div onClick={onClickCancel} className="deposit-popup-mask" />
      <div className="deposit-popup-main-container">
        <img src={background} className="deposit-popup-main-background" />
        <input
          type="number"
          className="deposit-popup-amount-input"
          value={amountString}
          onChange={(e) => setAmountString(e.target.value)}
          placeholder="Enter amount"
        />
        <div className="deposit-popup-confirm-button">
          <ConfirmButton onClick={onClickConfirm} />
        </div>
        <div className="deposit-popup-cancel-button">
          <CancelButton onClick={onClickCancel} />
        </div>
      </div>
    </div>
  );
};

export default DepositPopup;
