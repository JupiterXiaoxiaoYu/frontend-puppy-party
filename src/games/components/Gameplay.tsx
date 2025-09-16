import React, { useEffect, useRef, useState, MouseEvent } from "react";
import Popups from "./Popups";
import TopMenu from "./TopMenu";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { audioSystem } from "../audio";
import { useWalletContext } from "zkwasm-minirollup-browser";
import { getBeat } from "../draw";
import "./Gameplay.css";
import StageButtons from "./StageButtons";
import ProgressBar from "./ProgressBar";
import {
  getDanceTransactionParameter,
  getLotteryransactionParameter,
} from "../api";
import { sendTransaction, queryState } from "zkwasm-minirollup-browser";
import {
  selectGiftboxShake,
  selectProgressReset,
  selectTargetMemeIndex,
  selectUIState,
  setGiftboxShake,
  setPopupDescription,
  setProgressReset,
  setTargetMemeIndex,
  setUIState,
  UIState,
} from "../../data/ui";
import {
  selectUserState,
  selectNullableUserState,
  setConnectState,
} from "../../data/state";
import { ConnectState } from "zkwasm-minirollup-browser";
import { Scenario } from "../scenario";
import { selectCurrentMemes, setMemeModelMap } from "../../data/memeDatas";
import { MemeData, MemeProp } from "../season";
import { getMemeModelMap } from "../express";

const COOL_DOWN = 2;
const PROGRESS_LOTTERY_THRESHOLD = 1000;
const MIN_PROGRESS_UPDATE = 30;
const PROGRESS_UPDATE_RATE = 0.2;
const PROGRESS_COUNTING_DOWN_SPEED = 10;

const SERVER_TICK_TO_SECOND = 5;

export enum DanceType {
  None,
  Vote,
  Stake,
  Collect,
  Comment,
}

const Gameplay = () => {
  const dispatch = useAppDispatch();
  const { l2Account, playerId } = useWalletContext();
  const uIState = useAppSelector(selectUIState);
  const userStateNullable = useAppSelector(selectNullableUserState);
  const isCountingDownRef = useRef(false);
  
  // Critical: 只有在 UserState 存在时才渲染 Gameplay
  if (!userStateNullable?.player) {
    return <div>Loading user state...</div>;
  }
  
  // 现在可以安全使用 UserState
  const playerProgress = userStateNullable.player.data.progress;
  const playerNonce = BigInt(userStateNullable.player.nonce); // 确保转换为bigint
  const playerTicket = userStateNullable.player.data.ticket;
  const playerBalance = userStateNullable.player.data.balance;
  
  const progressRef = useRef(playerProgress);
  const displayProgressRef = useRef(playerProgress);
  const [displayProgress, setDisplayProgress] = useState(playerProgress);
  const currentMemes = useAppSelector(selectCurrentMemes);
  const currentMemesRef = useRef<MemeProp[]>([]);
  const [scenario, setScenario] = useState(new Scenario(currentMemes));

  const giftboxShake = useAppSelector(selectGiftboxShake);
  const progressReset = useAppSelector(selectProgressReset);
  const targetMemeIndex = useAppSelector(selectTargetMemeIndex);

  const isDanceButtonCoolDownLocalRef = useRef(false);
  const isDanceButtonCoolDownGlobalRef = useRef(false);
  const [isDanceButtonCoolDownLocal, setIsDanceButtonCoolDownLocal] =
    useState(false);
  const danceButtonProgressRef = useRef(0);
  const [danceButtonProgress, setDanceButtonProgress] = useState(0);

  const [currentDanceType, setCurrentDanceType] = useState(DanceType.None);

  const giftboxShakeRef = useRef(false);
  const progressResetRef = useRef(false);

  const canvasRef = React.createRef<HTMLCanvasElement>();

  const updateDisplayProgressRef = () => {
    if (progressRef.current == 0) {
      displayProgressRef.current = 0;
      setDisplayProgress(0);
      return;
    }

    if (isCountingDownRef.current) {
      displayProgressRef.current -= PROGRESS_COUNTING_DOWN_SPEED;
      if (displayProgressRef.current <= 0) {
        handleCancelRewards();
        displayProgressRef.current = 0;
        progressRef.current = 0;
        isCountingDownRef.current = false;
        dispatch(setUIState({ uIState: UIState.Idle }));
      }
    } else {
      if (
        progressResetRef.current == false &&
        progressRef.current > displayProgressRef.current
      ) {
        const progressStep =
          (progressRef.current - displayProgressRef.current) *
          PROGRESS_UPDATE_RATE;
        displayProgressRef.current = Math.min(
          displayProgressRef.current +
            Math.max(progressStep, MIN_PROGRESS_UPDATE),
          PROGRESS_LOTTERY_THRESHOLD
        );
      }
    }

    setDisplayProgress(displayProgressRef.current);
    if (displayProgressRef.current == PROGRESS_LOTTERY_THRESHOLD) {
      isCountingDownRef.current = true;
      dispatch(setUIState({ uIState: UIState.GiftboxPopup }));
    }
  };

  const updateDanceButtonCooldown = () => {
    if (isDanceButtonCoolDownLocalRef.current) {
      const ups = 10;
      const baseProgress = 1 / (COOL_DOWN * SERVER_TICK_TO_SECOND * ups);
      if (danceButtonProgressRef.current >= 1) {
        isDanceButtonCoolDownLocalRef.current = false;
        setIsDanceButtonCoolDownLocal(false);
      } else if (
        danceButtonProgressRef.current < 0.8 ||
        isDanceButtonCoolDownGlobalRef.current == false
      ) {
        danceButtonProgressRef.current += baseProgress;
      } else {
        danceButtonProgressRef.current += Math.min(
          ((1 - danceButtonProgressRef.current) * 0.5) / ups,
          baseProgress
        );
      }
      setDanceButtonProgress(danceButtonProgressRef.current);
    }
  };

  useEffect(() => {
    const draw = async (): Promise<void> => {
      const analyserInfo = await audioSystem.play();
      if (scenario.status === "play" && analyserInfo != null) {
        const ratioArray = getBeat(analyserInfo);

        updateDisplayProgressRef();

        scenario.draw(ratioArray, {
          l2account: l2Account,
          currentMemes: currentMemesRef.current,
          giftboxShake: giftboxShakeRef.current,
        });
        if (giftboxShakeRef.current) {
          dispatch(setGiftboxShake({ giftboxShake: false }));
        }
        scenario.step(ratioArray);

        updateDanceButtonCooldown();
      }
    };

    scenario.init();
    // Set the interval
    const intervalId = setInterval(draw, 100); // 1000ms = 1 second

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    giftboxShakeRef.current = giftboxShake;
  }, [giftboxShake]);

  useEffect(() => {
    currentMemesRef.current = currentMemes;
  }, [currentMemes]);

  useEffect(() => {
    progressResetRef.current = progressReset;
    if (progressReset) {
      isCountingDownRef.current = false;
      displayProgressRef.current = 0;
      setDisplayProgress(0);
    }
  }, [progressReset]);

  // 使用正确的 UserState 初始化游戏状态
  useEffect(() => {
    progressRef.current = playerProgress;
    dispatch(setProgressReset({ progressReset: false }));
    isDanceButtonCoolDownGlobalRef.current = false;
  }, [playerProgress]);

  function handleCancelRewards() {
    // 使用正确的 nonce 值从 UserState
    const nonce = playerNonce;
    console.log('🎰 Lottery:', { nonce: nonce.toString() });
    
    const lotteryParams = getLotteryransactionParameter(
      l2Account!,
      nonce
    );
    
    console.log('🎰 Lottery transaction parameters:', lotteryParams);

    dispatch(sendTransaction(lotteryParams)).then((action) => {
      console.log('🎰 Lottery transaction action result:', action);
      
      if (sendTransaction.fulfilled.match(action)) {
        console.log('🎰 Lottery transaction successful:', action.payload);
        
        // 🔄 重新查询用户状态
        if (l2Account) {
          console.log('🎰 Refreshing user state after lottery...');
          dispatch(queryState(l2Account.getPrivateKey()));
        }
      } else if (sendTransaction.rejected.match(action)) {
        console.error('🎰 Lottery transaction failed:', action);
      }
    }).catch(error => {
      console.error('🎰 Lottery transaction error:', error);
    });
  }

  const checkDanceButtonCoolDownAndTicketAmount = () => {
    if (isDanceButtonCoolDownLocalRef.current) {
      return false;
    }
    // 使用正确的 ticket 检查逻辑从 UserState
    const hasTicket = playerTicket > 0;
    if (!hasTicket) {
      dispatch(
        setPopupDescription({
          popupDescription: "Not Enough Ticket",
        })
      );
      dispatch(setUIState({ uIState: UIState.ErrorPopup }));
      return false;
    }
    return true;
  };

  const startDance = (danceType: DanceType) => {
    isDanceButtonCoolDownLocalRef.current = true;
    setIsDanceButtonCoolDownLocal(true);
    danceButtonProgressRef.current = 0;
    setCurrentDanceType(danceType);

    scenario.focusActor(440, 190, danceType);
    setTimeout(() => {
      scenario.restoreActor();
    }, 8000);
  };

  const onClickVoteButton = () => () => {
    if (checkDanceButtonCoolDownAndTicketAmount()) {
      startDance(DanceType.Vote);

      // 使用正确的 nonce 值从 UserState
      const nonce = playerNonce;
      console.log('🗳️ Vote:', { memeId: currentMemes[targetMemeIndex].data.id, nonce: nonce.toString() });
      
      const voteParams = getDanceTransactionParameter(
        l2Account!,
        DanceType.Vote,
        currentMemes[targetMemeIndex].data.id,
        nonce
      );
      
      // 简化的参数检查
      console.log('🗳️ Vote params:', { nonce: nonce.toString(), memeId: currentMemes[targetMemeIndex].data.id });

      dispatch(sendTransaction(voteParams)).then(async (action) => {
        console.log('🗳️ Vote transaction action result:', action);
        
        if (sendTransaction.fulfilled.match(action)) {
          console.log('🗳️ Vote transaction successful:', action.payload);
          
          // 🔄 更新meme数据和用户状态
          const memeModelMap = await getMemeModelMap();
          dispatch(setMemeModelMap({ memeModelMap }));
          
          // 🔄 重新查询用户状态
          if (l2Account) {
            console.log('🗳️ Refreshing user state after vote...');
            dispatch(queryState(l2Account.getPrivateKey()));
          }
        } else if (sendTransaction.rejected.match(action)) {
          console.error('🗳️ Vote transaction failed:', {
            error: action.error,
            payload: action.payload,
            meta: action.meta
          });
          
          // 尝试获取更多错误信息
          if (action.payload && typeof action.payload === 'object') {
            console.error('🗳️ Detailed error:', (action.payload as any).message || action.payload);
          }
        }
      }).catch(error => {
        console.error('🗳️ Vote transaction catch error:', error);
      });
    }
  };

  const onClickStakeButton = () => () => {
    if (checkDanceButtonCoolDownAndTicketAmount()) {
      dispatch(setUIState({ uIState: UIState.StakePopup }));
    }
  };

  const onClickCollectButton = () => () => {
    if (checkDanceButtonCoolDownAndTicketAmount()) {
      startDance(DanceType.Collect);

      // 使用正确的 nonce 值从 UserState
      const nonce = playerNonce;
      console.log('🎁 Collect:', { memeId: currentMemes[targetMemeIndex].data.id, nonce: nonce.toString() });
      
      const collectParams = getDanceTransactionParameter(
        l2Account!,
        DanceType.Collect,
        currentMemes[targetMemeIndex].data.id,
        nonce
      );
      
      console.log('🎁 Collect transaction parameters:', collectParams);

      dispatch(sendTransaction(collectParams)).then(async (action) => {
        console.log('🎁 Collect transaction action result:', action);
        
        if (sendTransaction.fulfilled.match(action)) {
          console.log('🎁 Collect transaction successful:', action.payload);
          
          // 🔄 更新meme数据和用户状态
          const memeModelMap = await getMemeModelMap();
          dispatch(setMemeModelMap({ memeModelMap }));
          
          // 🔄 重新查询用户状态
          if (l2Account) {
            console.log('🎁 Refreshing user state after collect...');
            dispatch(queryState(l2Account.getPrivateKey()));
          }
        } else if (sendTransaction.rejected.match(action)) {
          console.error('🎁 Collect transaction failed:', action);
        }
      }).catch(error => {
        console.error('🎁 Collect transaction error:', error);
      });
    }
  };

  const onClickCommentButton = () => () => {
    if (checkDanceButtonCoolDownAndTicketAmount()) {
      startDance(DanceType.Comment);

      // 使用正确的 nonce 值从 UserState
      const nonce = playerNonce;
      console.log('💬 Comment:', { memeId: currentMemes[targetMemeIndex].data.id, nonce: nonce.toString() });
      
      const commentParams = getDanceTransactionParameter(
        l2Account!,
        DanceType.Comment,
        currentMemes[targetMemeIndex].data.id,
        nonce
      );
      
      console.log('💬 Comment transaction parameters:', commentParams);

      dispatch(sendTransaction(commentParams)).then(async (action) => {
        console.log('💬 Comment transaction action result:', action);
        
        if (sendTransaction.fulfilled.match(action)) {
          console.log('💬 Comment transaction successful:', action.payload);
          
          // 🔄 更新meme数据和用户状态
          const memeModelMap = await getMemeModelMap();
          dispatch(setMemeModelMap({ memeModelMap }));
          
          // 🔄 重新查询用户状态
          if (l2Account) {
            console.log('💬 Refreshing user state after comment...');
            dispatch(queryState(l2Account.getPrivateKey()));
          }
        } else if (sendTransaction.rejected.match(action)) {
          console.error('💬 Comment transaction failed:', action);
        }
      }).catch(error => {
        console.error('💬 Comment transaction error:', error);
      });
    }
  };

  useEffect(() => {
    if (uIState == UIState.FinishStake) {
      startDance(DanceType.Stake);
      dispatch(setUIState({ uIState: UIState.Idle }));
    }
  }, [uIState]);

  function onHoverCanvas(e: MouseEvent<HTMLCanvasElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const ratio = rect.width / 960;
    //const left = (e.clientX - rect.left) * rect.width / 960;
    //const top = (e.clientY - rect.top) * rect.width / 960;
    const left = ((e.clientX - rect.left) * 960) / rect.width;
    const top = ((e.clientY - rect.top) * 960) / rect.width;
    scenario.hoverMeme(left, top);
    return;
  }

  function onClickCanvas(e: MouseEvent<HTMLCanvasElement>) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const left = ((e.clientX - rect.left) * 960) / rect.width;
    const top = ((e.clientY - rect.top) * 960) / rect.width;
    const memeIndex = scenario.selectMeme(left, top);

    if (memeIndex != null) {
      dispatch(setTargetMemeIndex(memeIndex));
    }
    return;
  }

  return (
    <>
      <Popups />
      <TopMenu targetMemeIndex={targetMemeIndex} />

      <div className="center" id="stage">
        <canvas
          id="canvas"
          onMouseMove={onHoverCanvas}
          onClick={onClickCanvas}
          ref={canvasRef}
        ></canvas>
        <ProgressBar progress={displayProgress / PROGRESS_LOTTERY_THRESHOLD} />
        <StageButtons
          isCoolDown={isDanceButtonCoolDownLocal}
          progress={danceButtonProgress}
          currentDanceType={currentDanceType}
          onClickVoteButton={onClickVoteButton}
          onClickStakeButton={onClickStakeButton}
          onClickCollectButton={onClickCollectButton}
          onClickCommentButton={onClickCommentButton}
        />
      </div>
    </>
  );
};

export default Gameplay;
