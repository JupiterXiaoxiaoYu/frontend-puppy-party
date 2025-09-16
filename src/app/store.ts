import { ThunkAction, Action } from '@reduxjs/toolkit';
import { createDelphinusStore } from 'zkwasm-minirollup-browser';
import stateReducer from "../data/state";
import uiReducer from "../data/ui";
import memeDatasReducer from "../data/memeDatas";

// 使用 createDelphinusStore，让它自动处理 account reducer
export const store = createDelphinusStore(
  {
    // zkwasm 会自动添加 account reducer，我们只需要添加自定义的
    state: stateReducer,
    uiux: uiReducer,
    memeDatas: memeDatasReducer,
  },
  [], // preloadedState
  [], // middleware
  ["state.lastError.payload"], // ignoredActions - 忽略 lastError.payload 的序列化检查
  [] // ignoredPaths
);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
