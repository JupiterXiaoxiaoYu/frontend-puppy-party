import { useState } from "react";
import background from "../../images/withdraw_frame.png";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useWalletContext } from "zkwasm-minirollup-browser";
import ConfirmButton from "../buttons/WithdrawConfirmButton";
import CancelButton from "../buttons/WithdrawCancelButton";
import { getWithdrawTransactionParameter } from "../../api";
import "./WithdrawPopup.css";
import {
  selectUIState,
  setPopupDescription,
  setUIState,
  UIState,
} from "../../../data/ui";
import { selectUserState } from "../../../data/state";
import { sendTransaction, queryState } from "zkwasm-minirollup-browser";

const WithdrawPopup = () => {
  const dispatch = useAppDispatch();
  const uIState = useAppSelector(selectUIState);
  const { l1Account, l2Account } = useWalletContext();
  const userState = useAppSelector(selectUserState);
  const [amountString, setAmountString] = useState("");

  async function withdrawRewards(amount: bigint, nonce: bigint) {
    console.log('💸 Starting withdraw transaction:', {
      amount: amount.toString(),
      nonce: nonce.toString(),
      nonceType: typeof nonce,
      l1Account: l1Account?.address,
      l2Account: l2Account?.toString()
    });

    const withdrawParams = getWithdrawTransactionParameter(l1Account!, l2Account!, amount, nonce);
    
    console.log('💸 Withdraw transaction parameters:', withdrawParams);

    dispatch(sendTransaction(withdrawParams)).then((action) => {
      console.log('💸 Withdraw transaction action result:', action);
      
      if (sendTransaction.fulfilled.match(action)) {
        console.log('💸 Withdraw transaction successful:', action.payload);
        
        // 🔄 重新查询用户状态
        if (l2Account) {
          console.log('💸 Refreshing user state after withdraw...');
          dispatch(queryState(l2Account.getPrivateKey()));
        }
        
        dispatch(
          setPopupDescription({
            popupDescription: "Hash Number : (TBD)",
          })
        );
        dispatch(setUIState({ uIState: UIState.ConfirmPopup }));
      } else if (sendTransaction.rejected.match(action)) {
        console.error('💸 Withdraw transaction failed:', action);
        dispatch(setPopupDescription({
          popupDescription: `Withdraw failed: ${action.error?.message || 'Unknown error'}`
        }));
        dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      }
    }).catch(error => {
      console.error('💸 Withdraw transaction error:', error);
    });
  }

  const withdraw = (amountString: string) => {
    try {
      const amount = Number(amountString);
      if (amount > userState.player!.data.balance) {
        dispatch(
          setPopupDescription({
            popupDescription: "Not Enough Balance",
          })
        );
        dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      } else {
        dispatch(setUIState({ uIState: UIState.QueryWithdraw }));
        withdrawRewards(BigInt(amount), userState.player!.nonce);
      }
    } catch (e) {
      console.log("Error at withdraw " + e);
    }
  };

  const onClickConfirm = () => {
    if (uIState == UIState.WithdrawPopup) {
      withdraw(amountString);
    }
  };

  const onClickCancel = () => {
    if (uIState == UIState.WithdrawPopup) {
      dispatch(setUIState({ uIState: UIState.Idle }));
    }
  };

  return (
    <div className="withdraw-popup-container">
      <div onClick={onClickCancel} className="withdraw-popup-mask" />
      <div className="withdraw-popup-main-container">
        <img src={background} className="withdraw-popup-main-background" />
        <p className="withdraw-popup-amount-text">
          Please enter a number between 0 and {userState.player!.data.balance}.
        </p>
        <input
          type="number"
          className="withdraw-popup-amount-input"
          value={amountString}
          onChange={(e) => setAmountString(e.target.value)}
          placeholder="Enter amount"
        />
        <div className="withdraw-popup-confirm-button">
          <ConfirmButton onClick={onClickConfirm} />
        </div>
        <div className="withdraw-popup-cancel-button">
          <CancelButton onClick={onClickCancel} />
        </div>
      </div>
    </div>
  );
};

export default WithdrawPopup;
