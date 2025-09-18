import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../app/store";
import {
  emptySeasonData,
  emptyMemeData,
  MemeData,
  MemeModel,
  SeasonData,
  emptyMemeModel,
  MemeProp,
} from "../games/season";

interface MemeDatasState {
  seasonData: SeasonData;
  memeDataMap: { [key: number]: MemeData };
  memeModelMap: { [key: number]: MemeModel };
  currentMemeIds: number[];
}

const initialState: MemeDatasState = {
  seasonData: emptySeasonData,
  memeDataMap: {},
  memeModelMap: {},
  currentMemeIds: Array(12).fill(0),
};

export const memeDatasSlice = createSlice({
  name: "memeDatas",
  initialState,
  reducers: {
    setSeasonData: (state, action) => {
      state.seasonData = action.payload.seasonData;
      state.memeDataMap = action.payload.seasonData.memes.reduce(
        (acc: { [key: number]: MemeData }, data: MemeData) => {
          acc[data.id] = data;
          return acc;
        },
        {} as { [key: number]: MemeData }
      );
    },
    setMemeModelMap: (state, action) => {
      state.memeModelMap = action.payload.memeModelMap;
    },
    addCurrentMemeId: (state, action) => {
      const currentNotEmptyMemeIds = state.currentMemeIds
        .filter((id) => id !== 0)
        .concat(action.payload.memeId)
        .slice(0, 12);
      state.currentMemeIds = currentNotEmptyMemeIds.concat(
        Array(12 - currentNotEmptyMemeIds.length).fill(0)
      );
    },
    removeCurrentMemeId: (state, action) => {
      const currentNotEmptyMemeIds = state.currentMemeIds
        .filter((id) => id !== 0 && id !== action.payload.memeId)
        .slice(0, 12);
      state.currentMemeIds = currentNotEmptyMemeIds.concat(
        Array(12 - currentNotEmptyMemeIds.length).fill(0)
      );
    },
    fillCurrentMemeIds: (state, action) => {
      // 默认选择所有可用的memes
      const allMemeIds = state.seasonData.memes.map((memeData) => memeData.id);
      allMemeIds.sort(() => Math.random() - 0.5);
      state.currentMemeIds = allMemeIds.slice(0, 12);
    },
  },
});

export const selectAllMemes = (state: RootState) => {
  if (!state.memeDatas?.seasonData?.memes) {
    return [];
  }
  
  return state.memeDatas.seasonData.memes
    .filter((data: MemeData) => state.memeDatas.currentMemeIds.includes(data.id))
    .concat(state.memeDatas.seasonData.memes.filter((data: MemeData) => !state.memeDatas.currentMemeIds.includes(data.id)))
    .map((data: MemeData) => ({
      data: data,
      model: state.memeDatas.memeModelMap
        ? state.memeDatas.memeModelMap[data.id] ?? emptyMemeModel
        : emptyMemeModel,
    } as MemeProp));
};

export const selectCurrentMemes = (state: RootState) => {
  if (!state.memeDatas?.currentMemeIds) {
    return [];
  }
  
  return state.memeDatas.currentMemeIds.map((id: number) => ({
    data: state.memeDatas.memeDataMap?.[id] ?? emptyMemeData,
    model: state.memeDatas.memeModelMap?.[id] ?? emptyMemeModel,
  } as MemeProp));
};

export const { setSeasonData, setMemeModelMap, addCurrentMemeId, removeCurrentMemeId, fillCurrentMemeIds } =
  memeDatasSlice.actions;
export default memeDatasSlice.reducer;
