import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  selectNullableConfig,
  selectNullableUserState,
} from "../data/state";
import {
  getConfig,
  queryInitialState,
  queryState,
  sendTransaction,
  useWalletContext,
  useConnectModal,
  L2AccountInfo,
} from "zkwasm-minirollup-browser";
import { getCreatePlayerTransactionParameter } from "./api";
import { createCommand } from "zkwasm-minirollup-rpc";
import { getMemeModelMap } from "./express";
import sanityClient from "./sanityClient";
import { SeasonData } from "./season";
import { setSeasonData, setMemeModelMap, fillCurrentMemeIds } from "../data/memeDatas";
import { loadAudio } from "./audio";
import WelcomePage from "./components/WelcomePage";
import Gameplay from "./components/Gameplay";
import LoadingPage from "./components/LoadingPage";
import "./style.scss";

const CREATE_PLAYER = 1n;

interface Props {
  imageUrls: string[];
}

export function ModernLoadingController() {
  const dispatch = useAppDispatch();
  const userState = useAppSelector(selectNullableUserState);
  const config = useAppSelector(selectNullableConfig);
  
  // 🎯 简化的状态管理 - 不依赖 ConnectState
  const [gameState, setGameState] = useState<{
    isInitializing: boolean;
    isLoadingData: boolean;
    isGameReady: boolean;
    error: string | null;
  }>({
    isInitializing: true,
    isLoadingData: false,
    isGameReady: false,
    error: null,
  });
  
  const [progress, setProgress] = useState(0);
  const [seasonData, setLocalSeasonData] = useState<SeasonData | null>(null);
  const [audioLoaded, setAudioLoaded] = useState<boolean>(false);
  
  const {
    isConnected,
    isL2Connected,
    l1Account,
    l2Account,
    connectL1,
    connectL2,
    disconnect,
  } = useWalletContext();
  
  const l2AccountRef = useRef<L2AccountInfo | undefined>(l2Account);
  
  // RainbowKit connect modal hook
  const { openConnectModal } = useConnectModal();

  // Collect all required image URLs from the project
  const imageUrls: string[] = [
    // Add your actual image URLs here
  ];

  // 音乐现在由 WelcomePage 中使用 audio.ts 的 startAudio 函数统一处理

  // 🎯 简化的连接流程 - 自动处理 L1→L2 连接（音乐现在由WelcomePage统一处理）
  useEffect(() => {
    if (isConnected && !l1Account) {
      console.log('🔗 L1 wallet connected, connecting L1 account');
      connectL1();
    }
  }, [isConnected, l1Account]);

  useEffect(() => {
    if (l1Account && !isL2Connected) {
      console.log('🔗 L1 account ready, connecting L2');
      connectL2();
    }
  }, [l1Account, isL2Connected]);

  useEffect(() => {
    if (l2Account) {
      console.log('🔗 L2 account connected, checking player status...');
      checkPlayerExists();
    }
  }, [l2Account]);

  // 🎮 检查玩家是否存在（参考frontend-automata模式）
  const checkPlayerExists = async () => {
    if (!l2Account) return;
    
    try {
      console.log('🎮 Querying player state...');
      const action = await dispatch(queryState(l2Account.getPrivateKey()));
      
      if (queryState.fulfilled.match(action)) {
        console.log('🎮 Player already exists, ready to play');
        setGameState(prev => ({ ...prev, isLoadingData: false }));
      } else if (queryState.rejected.match(action)) {
        console.log('🎮 Player does not exist, creating new player...');
        await createNewPlayer();
      }
    } catch (error) {
      console.error('🎮 Error checking player state:', error);
      setGameState(prev => ({ ...prev, isLoadingData: false }));
    }
  };

  // 🎮 创建新玩家
  const createNewPlayer = async () => {
    if (!l2Account) return;
    
    try {
      console.log('🎮 Creating new player...');
      const createPlayerAction = await dispatch(sendTransaction(
        getCreatePlayerTransactionParameter(l2Account, 0n)
      ));
      
      if (sendTransaction.fulfilled.match(createPlayerAction)) {
        console.log('🎮 Player created successfully!');
        // 创建成功后重新查询状态
        await dispatch(queryState(l2Account.getPrivateKey()));
        setGameState(prev => ({ ...prev, isLoadingData: false }));
      } else if (sendTransaction.rejected.match(createPlayerAction)) {
        console.error('🎮 Player creation failed:', createPlayerAction.payload);
        // 检查是否是玩家已存在的错误
        const errorMessage = String(createPlayerAction.payload);
        if (errorMessage.includes('already exists') || errorMessage.includes('AlreadyExists')) {
          console.log('🎮 Player already exists, querying state...');
          await dispatch(queryState(l2Account.getPrivateKey()));
        }
        setGameState(prev => ({ ...prev, isLoadingData: false }));
      }
    } catch (error) {
      console.error('🎮 Error creating player:', error);
      setGameState(prev => ({ ...prev, isLoadingData: false }));
    }
  };

  // Image preloading following frontend-automata pattern
  async function preloadImages(imageUrls: string[]): Promise<void> {
    let loadedCount = 0;
    const loadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedCount++;
          setProgress(Math.ceil((loadedCount / imageUrls.length) * 8000) / 100);
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      });
    };

    const promises = imageUrls.map((url) => loadImage(url));
    await Promise.all(promises);
  }

  // Load images wrapper
  const loadImages = async () => {
    try {
      await preloadImages(imageUrls);
      console.log(`${imageUrls.length} images loaded`);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  };

  // Load season data
  const loadSeasonData = async (): Promise<SeasonData> => {
    const query = `*[_type == "season"] | order(_createdAt desc)[0]{
      _id,
      season,
      memes[]->{
        _id,
        id,
        name,
        description,
        "avatarUrl": avatar.asset->url,
        "spriteSheetUrl": spriteSheet.asset->url
      }
    }`;

    const data = await sanityClient.fetch(query);
    if (!data) {
      throw new Error("No season data found");
    }

    return {
      name: data.season || 'Current Season',
      seasonEndDate: data.seasonEndDate || '2025-01-30',
      isCurrentSeason: true,
      memes: (data.memes || []).map((meme: any) => ({
        id: meme.id,
        name: meme.name,
        avatar: meme.avatarUrl || '',
        spriteSheet: meme.spriteSheetUrl || '',
        description: meme.description
      }))
    };
  };

  // 🎯 简化的数据加载 - 应用启动时加载所有必需数据
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setGameState(prev => ({ ...prev, isLoadingData: true }));
        
        // 加载季节数据和模型映射
        await onStart();
        
        // 加载图片
        await loadImages();
        
        // 获取配置
        await dispatch(getConfig()).unwrap();
        
        setGameState(prev => ({ 
          ...prev, 
          isInitializing: false,
          isLoadingData: false 
        }));
        
      } catch (error) {
        console.error("App initialization failed:", error);
        setGameState(prev => ({ 
          ...prev, 
          isInitializing: false,
          isLoadingData: false,
          error: error instanceof Error ? error.message : "Initialization failed"
        }));
      }
    };
    
    if (gameState.isInitializing) {
      initializeApp();
    }
  }, [gameState.isInitializing]);

  // 🎯 L2Account reference tracking
  useEffect(() => {
    l2AccountRef.current = l2Account;
  }, [l2Account]);

  const onStart = async () => {
    try {
      // Load season data and meme model map
      console.log("Loading season data...");
      const seasonData = await loadSeasonData();
      setLocalSeasonData(seasonData);
      
      dispatch(setSeasonData({ seasonData }));
      
      console.log("Loading meme model map...");
      const memeModelMap = await getMemeModelMap();
      dispatch(setMemeModelMap({ memeModelMap }));
      
      // 🎯 自动选择所有可用的 memes
      console.log("Auto-selecting all memes...");
      dispatch(fillCurrentMemeIds({}));
    } catch (error) {
      console.error("Start failed:", error);
    }
  };

  const onLogin = async () => {
    console.log("🔗 Login requested");
    console.log("Current state - isConnected:", isConnected, "isL2Connected:", isL2Connected);
    console.log("l1Account:", l1Account, "l2Account:", l2Account);
    
    if (!isConnected && openConnectModal) {
      console.log("🔗 Opening connect modal for L1 connection");
      openConnectModal();
    } else if (isConnected && !isL2Connected) {
      console.log("🔗 L1 connected, connecting L2...");
      try {
        await connectL2();
      } catch (error) {
        console.error("L2 connection failed:", error);
      }
    } else {
      console.log("🔗 Already connected to both L1 and L2");
    }
  };

  // 🎯 简化的游戏启动逻辑 - 直接基于数据可用性判断
  const onStartGame = async () => {
    if (!l2Account) {
      console.log("🎮 No L2 account available");
      return;
    }

    // 音乐现在由 WelcomePage 统一处理

    try {
      // 尝试查询用户状态
      console.log("🎮 Querying user state...");
      const action = await dispatch(queryState(l2Account.getPrivateKey()));
      
      if (queryState.fulfilled.match(action) && action.payload.player) {
        console.log("🎮 Player exists - starting gameplay");
        // 确保所有memes被选中
        dispatch(fillCurrentMemeIds({}));
        setGameState(prev => ({ ...prev, isGameReady: true }));
      } else {
        // 用户不存在或查询失败，创建新玩家
        console.log("🎮 Player not found - creating new player...");
        
        const createAction = await dispatch(sendTransaction(
          getCreatePlayerTransactionParameter(l2Account, 0n)
        ));
        
        if (sendTransaction.fulfilled.match(createAction)) {
          // 玩家创建成功，重新查询状态
          await dispatch(queryState(l2Account.getPrivateKey()));
          console.log("🎮 Player created - starting gameplay");
          // 确保所有memes被选中
          dispatch(fillCurrentMemeIds({}));
          setGameState(prev => ({ ...prev, isGameReady: true }));
        } else {
          throw new Error("Failed to create player");
        }
      }
    } catch (error) {
      console.error("🎮 Failed to start game:", error);
      setGameState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to start game"
      }));
    }
  };

  // 🎯 简化的渲染逻辑 - 基于数据状态而非ConnectState
  if (gameState.error) {
    return <LoadingPage message={`Error: ${gameState.error}`} progress={0} />;
  }
  
  if (gameState.isInitializing) {
    return <LoadingPage message={"Initializing"} progress={0} />;
  }
  
  if (gameState.isLoadingData) {
    return <LoadingPage message={"Loading Data"} progress={progress} />;
  }
  
  // 🎮 如果游戏已准备就绪且有必要数据，显示 Gameplay
  if (gameState.isGameReady && config && userState?.player && seasonData) {
    return <Gameplay />;
  }
  
  // 🔗 否则显示 WelcomePage 让用户连接或开始游戏
  return (
    <WelcomePage
      isLogin={isL2Connected}
      onLogin={onLogin}
      onStartGame={onStartGame}
    />
  );
}