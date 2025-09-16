import { useState } from "react";
import background from "../../images/stake_frame.png";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useWalletContext } from "zkwasm-minirollup-browser";
import ConfirmButton from "../buttons/WithdrawConfirmButton";
import CancelButton from "../buttons/WithdrawCancelButton";
import { getStakeTransactionParameter } from "../../api";
import "./StakePopup.css";
import {
  selectTargetMemeIndex,
  selectUIState,
  setPopupDescription,
  setUIState,
  UIState,
} from "../../../data/ui";
import { selectUserState } from "../../../data/state";
import { sendTransaction, queryState } from "zkwasm-minirollup-browser";
import { selectCurrentMemes, setMemeModelMap } from "../../../data/memeDatas";
import { getMemeModelMap } from "../../express";

const StakePopup = () => {
  const dispatch = useAppDispatch();
  const uIState = useAppSelector(selectUIState);
  const { l2Account } = useWalletContext();
  const userState = useAppSelector(selectUserState);
  const currentMemes = useAppSelector(selectCurrentMemes);
  const targetMemeIndex = useAppSelector(selectTargetMemeIndex);

  const [amountString, setAmountString] = useState("");

  async function stakeRewards(amount: number) {
    console.log('💰 Stake:', { amount, memeId: currentMemes[targetMemeIndex].data.id, nonce: userState.player!.nonce.toString() });

    const stakeParams = getStakeTransactionParameter(
      l2Account!,
      currentMemes[targetMemeIndex].data.id,
      amount,
      userState.player!.nonce
    );
    
    console.log('💰 Stake transaction parameters:', stakeParams);

    dispatch(sendTransaction(stakeParams)).then(async (action) => {
      console.log('💰 Stake transaction action result:', action);
      
      if (sendTransaction.fulfilled.match(action)) {
        console.log('💰 Stake transaction successful:', action.payload);
        
        // 🔄 更新meme数据和用户状态
        const memeModelMap = await getMemeModelMap();
        dispatch(setMemeModelMap({ memeModelMap }));
        
        // 🔄 重新查询用户状态以获取最新数据
        if (l2Account) {
          console.log('💰 Refreshing user state after stake...');
          dispatch(queryState(l2Account.getPrivateKey()));
        }
        
        dispatch(setUIState({ uIState: UIState.FinishStake }));
      } else if (sendTransaction.rejected.match(action)) {
        console.error('💰 Stake transaction failed:', action);
        dispatch(setPopupDescription({
          popupDescription: `Stake failed: ${action.error?.message || 'Unknown error'}`
        }));
        dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      }
    }).catch(error => {
      console.error('💰 Stake transaction error:', error);
    });
  }

  const stake = (amountString: string) => {
    try {
      const amount = Number(amountString);
      if (amount > userState.player!.data.ticket) {
        dispatch(
          setPopupDescription({
            popupDescription: "Not Enough Balance",
          })
        );
        dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      } else {
        dispatch(setUIState({ uIState: UIState.QueryStake }));
        stakeRewards(amount);
      }
    } catch (e) {
      console.log("Error at stake " + e);
    }
  };

  const onClickConfirm = () => {
    if (uIState == UIState.StakePopup) {
      stake(amountString);
    }
  };

  const onClickCancel = () => {
    if (uIState == UIState.StakePopup) {
      dispatch(setUIState({ uIState: UIState.Idle }));
    }
  };

  return (
    <div className="stake-popup-container">
      <div onClick={onClickCancel} className="stake-popup-mask" />
      <div className="stake-popup-main-container">
        <img src={background} className="stake-popup-main-background" />
        <p className="stake-popup-amount-text">
          Please enter a number between 0 and {userState.player!.data.ticket}.
        </p>
        <input
          type="number"
          className="stake-popup-amount-input"
          value={amountString}
          onChange={(e) => setAmountString(e.target.value)}
          placeholder="Enter amount"
        />
        <div className="stake-popup-confirm-button">
          <ConfirmButton onClick={onClickConfirm} />
        </div>
        <div className="stake-popup-cancel-button">
          <CancelButton onClick={onClickCancel} />
        </div>
      </div>
    </div>
  );
};

export default StakePopup;
