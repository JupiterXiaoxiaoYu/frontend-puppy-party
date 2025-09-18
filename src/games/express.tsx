import axios from "axios";
import { MemeModel } from "./season";

const instance = axios.create({
  baseURL: process.env.REACT_APP_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

export async function getMemeModelMap(): Promise<{ [key: number]: MemeModel }> {
  const res = await getRequest("/data/memes");
  const memeMap = res.data.reduce(
    (
      acc: { [key: number]: MemeModel },
      { id, rank }: { id: number; rank: number }
    ) => {
      acc[id] = { id, rank };
      return acc;
    },
    {} as { [key: number]: MemeModel }
  );
  return memeMap;
}

export async function uploadImage(
  name: string,
  avatarFile: File,
  spriteSheetFile: File
) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("avatar", avatarFile);
  formData.append("spriteSheet", spriteSheetFile);
  return await postRequest("/upload", formData);
}

async function getRequest(path: string) {
  try {
    const response = await instance.get(path);
    if (response.status >= 200 && response.status < 300) {
      const jsonResponse = response.data;
      return jsonResponse;
    } else {
      throw "Get error at " + path + " : " + response.status;
    }
  } catch (error) {
    throw "Unknown error at " + path + " : " + error;
  }
}

async function postRequest(path: string, formData: FormData) {
  try {
    const response = await instance.post(path, formData);
    if (response.status >= 200 && response.status < 300) {
      const jsonResponse = response.data;
      return jsonResponse;
    } else {
      throw "Post error at " + path + " : " + response.status;
    }
  } catch (error) {
    throw "Unknown error at " + path + " : " + error;
  }
}
