import React, { useEffect, useRef, useState } from "react";
import background from "../../images/withdraw_frame.png";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import "./GiftboxPopup.css";
import { useWalletContext } from "zkwasm-minirollup-browser";
import GiftboxConfirmButton from "../buttons/GiftboxConfirmButton";
import giftbox_image from "../../images/animations/giftbox.png";
import giftbox_bonus from "../../images/bonus.png";
import giftbox_title from "../../images/giftbox_title.png";
import note1 from "../../images/note/note1.png";
import note2 from "../../images/note/note2.png";
import note3 from "../../images/note/note3.png";
import note4 from "../../images/note/note4.png";
import note5 from "../../images/note/note5.png";
import note6 from "../../images/note/note6.png";
import note7 from "../../images/note/note7.png";
import note8 from "../../images/note/note8.png";
import note9 from "../../images/note/note9.png";
import note10 from "../../images/note/note10.png";
import GiftboxNotes from "./GiftboxNotes";
import { getLotteryransactionParameter } from "../../api";
import {
  selectUIState,
  setGiftboxShake,
  setProgressReset,
  setUIState,
  UIState,
} from "../../../data/ui";
import { selectUserState } from "../../../data/state";
import { sendTransaction } from "zkwasm-minirollup-browser";

interface GiftboxNoteProps {
  startPosition: { x: number; y: number };
  popupAnimationDelay: number;
  rewardAnimationDelay: number;
  shakeAnimationDelay: number;
  opacity: number;
  noteImagePath: string;
}

const giftboxNotesProps: GiftboxNoteProps[] = [
  {
    startPosition: { x: 17, y: 39 },
    popupAnimationDelay: 0.0,
    rewardAnimationDelay: 0.0,
    shakeAnimationDelay: 0.88,
    opacity: 0.5,
    noteImagePath: note5,
  },
  {
    startPosition: { x: 14, y: 30 },
    popupAnimationDelay: 0.05,
    rewardAnimationDelay: 0.1,
    shakeAnimationDelay: 0.79,
    opacity: 0.54,
    noteImagePath: note6,
  },
  {
    startPosition: { x: 31, y: 40 },
    popupAnimationDelay: 0.1,
    rewardAnimationDelay: 0.2,
    shakeAnimationDelay: 0.75,
    opacity: 0.61,
    noteImagePath: note4,
  },
  {
    startPosition: { x: 0, y: 28 },
    popupAnimationDelay: 0.15,
    rewardAnimationDelay: 0.3,
    shakeAnimationDelay: 0.51,
    opacity: 0.76,
    noteImagePath: note9,
  },
  {
    startPosition: { x: 40, y: 34 },
    popupAnimationDelay: 0.2,
    rewardAnimationDelay: 0.4,
    shakeAnimationDelay: 0.25,
    opacity: 0.8,
    noteImagePath: note3,
  },
  {
    startPosition: { x: 37, y: 33 },
    popupAnimationDelay: 0.25,
    rewardAnimationDelay: 0.5,
    shakeAnimationDelay: 0.75,
    opacity: 0.52,
    noteImagePath: note1,
  },
  {
    startPosition: { x: 20, y: 39 },
    popupAnimationDelay: 0.3,
    rewardAnimationDelay: 0.6,
    shakeAnimationDelay: 0.69,
    opacity: 0.51,
    noteImagePath: note2,
  },
  {
    startPosition: { x: 10, y: 20 },
    popupAnimationDelay: 0.35,
    rewardAnimationDelay: 0.7,
    shakeAnimationDelay: 0.05,
    opacity: 0.77,
    noteImagePath: note10,
  },
  {
    startPosition: { x: 34, y: 34 },
    popupAnimationDelay: 0.4,
    rewardAnimationDelay: 0.8,
    shakeAnimationDelay: 0.03,
    opacity: 0.77,
    noteImagePath: note7,
  },
  {
    startPosition: { x: 7, y: 32 },
    popupAnimationDelay: 0.45,
    rewardAnimationDelay: 0.9,
    shakeAnimationDelay: 0.89,
    opacity: 0.52,
    noteImagePath: note8,
  },
];

const GiftboxPopup = () => {
  const dispatch = useAppDispatch();
  const uIState = useAppSelector(selectUIState);
  const userState = useAppSelector(selectUserState);
  const { l2Account } = useWalletContext();
  const [rewardAnimation, setRewardAnimation] = useState(false);
  const [finishQuery, setFinishQuery] = useState(false);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [preLotteryInfo, setPreLotterInfo] = useState(0);

  const getEndPosition = (parentContainer: HTMLDivElement | null) => {
    return parentContainer == null
      ? {
          x: 0,
          y: 0,
        }
      : {
          x: parentContainer.clientWidth / 2 - 390,
          y: -(parentContainer.clientHeight / 2 + 30),
        };
  };
  const endPosition = getEndPosition(parentRef && parentRef.current);

  const onClickConfirm = () => {
    if (uIState == UIState.GiftboxPopup) {
      setFinishQuery(false);
      setRewardAnimation(true);
      dispatch(setUIState({ uIState: UIState.QueryGiftbox }));
      dispatch(setProgressReset({ progressReset: true }));
      setPreLotterInfo(userState.player!.data.lottery_info);
      dispatch(
        sendTransaction(
          getLotteryransactionParameter(
            l2Account!,
            BigInt(userState.player!.nonce)
          )
        )
      ).then((action) => {
        if (sendTransaction.fulfilled.match(action)) {
          setFinishQuery(true);
        }
      });
    }
  };

  const onAnimationEnd = () => {
    if (rewardAnimation) {
      dispatch(setGiftboxShake({ giftboxShake: true }));
      setRewardAnimation(false);
    }
  };

  useEffect(() => {
    if (!rewardAnimation && finishQuery) {
      if (userState.player!.data.lottery_info > preLotteryInfo) {
        dispatch(setUIState({ uIState: UIState.SponsorPopup }));
      } else {
        dispatch(setUIState({ uIState: UIState.Idle }));
      }
    }
  }, [rewardAnimation, finishQuery]);

  useEffect(() => {
    dispatch(setGiftboxShake({ giftboxShake: true }));
  }, []);

  return (
    <>
      <link rel="preload" href={giftbox_image} as="image" />
      <div ref={parentRef} className="giftbox-popup-container">
        <div className="giftbox-popup-main-container">
          <div className="giftbox-popup-main-animation" />
          <img src={giftbox_bonus} className="giftbox-popup-bonus-image" />
          <img src={giftbox_title} className="giftbox-popup-title-image" />

          <div className="giftbox-popup-notes-animation-container">
            {giftboxNotesProps.map((prop, index) => (
              <GiftboxNotes
                key={index}
                animationIndex={index}
                rewardAnimation={rewardAnimation}
                onAnimationEnd={
                  index == 0
                    ? onAnimationEnd
                    : () => {
                        /* */
                      }
                }
                startPosition={prop.startPosition}
                endPosition={endPosition}
                popupAnimationDelay={prop.popupAnimationDelay}
                rewardAnimationDelay={prop.rewardAnimationDelay}
                shakeAnimationDelay={prop.shakeAnimationDelay}
                opacity={prop.opacity}
                noteImagePath={prop.noteImagePath}
              />
            ))}
          </div>

          <div className="giftbox-popup-confirm-button">
            <GiftboxConfirmButton onClick={onClickConfirm} />
          </div>
        </div>
      </div>
    </>
  );
};

export default GiftboxPopup;
