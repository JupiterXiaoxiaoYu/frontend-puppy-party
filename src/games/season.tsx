export interface SeasonData {
  name: string;
  seasonEndDate: string;
  isCurrentSeason: boolean;
  memes: MemeData[];
}

export const emptySeasonData: SeasonData = {
  name: "",
  seasonEndDate: "",
  isCurrentSeason: false,
  memes: [],
};

export interface MemeData {
  id: number;
  name: string;
  avatar: string;
  spriteSheet: string;
}

export const emptyMemeData: MemeData = {
  id: 0,
  name: "",
  avatar: "",
  spriteSheet: "",
};

export interface MemeModel {
  id: number;
  rank: number;
}

export const emptyMemeModel: MemeModel = {
  id: 0,
  rank: 0,
};

export interface MemeProp {
  data: MemeData;
  model: MemeModel;
}

export interface StakeInfo {
  stake: number;
  timestamp: number;
}
