import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loadAudio } from "../audio";
import background from "../images/welcome/welcome_bg.png";
import titleImage from "../images/welcome/welcome_title.png";
import peopleBackground from "../images/welcome/people.png";
import stageBackground from "../images/welcome/stage_bg.png";
import dog1 from "../images/welcome/dog1.png";
import dog2 from "../images/welcome/dog2.png";
import speakerGreenLeft from "../images/animations/welcome/green.png";
import speakerGreenRight from "../images/animations/welcome/green1.png";
import speakerPinkLeft from "../images/animations/welcome/pink.png";
import speakerPinkRight from "../images/animations/welcome/pink1.png";
import speakerYellowLeft from "../images/animations/welcome/yellow.png";
import speakerYellowRight from "../images/animations/welcome/yellow1.png";
import "./WelcomePage.css";
import PlayButton from "./buttons/PlayButton";
import Grid from "./Grid";
import MemeRankingIcon from "./MemeRankingIcon";
import {
  addCurrentMemeId,
  removeCurrentMemeId,
  selectAllMemes,
  selectCurrentMemes,
} from "../../data/memeDatas";
import { MemeProp } from "../season";
import WelcomeMeme from "./WelcomeMeme";
import PageSelector from "./PageSelector";
import ConnectWalletButton from "./buttons/ConnectWalletButton";
import JoinButton from "./buttons/JoinButton";
import UploadMemePopup from "./popups/UploadMemePopup";

interface Props {
  isLogin: boolean;
  onLogin: () => void;
  onStartGame: () => void;
}

const memeRankingGridColumnCount = 8;
const memeRankingGridRowCount = 3;
const amountPerPage = memeRankingGridColumnCount * memeRankingGridRowCount;

const WelcomePage = ({ isLogin, onLogin, onStartGame }: Props) => {
  const dispatch = useAppDispatch();
  const allMemeProps = useAppSelector(selectAllMemes);
  const currentMemeProps = useAppSelector(selectCurrentMemes);
  const rankingContainerRef = useRef<HTMLDivElement>(null);
  const [memeRankingIconElementWidth, setMemeRankingIconElementWidth] =
    useState<number>(0);
  const textRef = useRef<HTMLParagraphElement>(null);
  const titleTextRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState<number>(0);
  const [titleFontSize, setTitleFontSize] = useState<number>(0);
  const animationContainerRef = useRef<HTMLDivElement>(null);
  const [scaleSize, setScaleSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageCount = Math.ceil(allMemeProps.length / amountPerPage);
  const [openUploadMemePopup, setOpenUploadMemePopup] =
    useState<boolean>(false);

  const adjustSize = () => {
    if (textRef.current) {
      const parentWidth = textRef.current.offsetWidth;
      setFontSize(parentWidth / 25);
    }
    if (titleTextRef.current) {
      const parentWidth = titleTextRef.current.offsetWidth;
      setTitleFontSize(parentWidth / 8);
    }
    if (rankingContainerRef.current) {
      setMemeRankingIconElementWidth(
        rankingContainerRef.current.offsetWidth / 8
      );
    }
    if (animationContainerRef.current) {
      setScaleSize(animationContainerRef.current.offsetWidth / 300);
    }
  };

  useEffect(() => {
    adjustSize();

    window.addEventListener("resize", adjustSize);
    return () => {
      window.removeEventListener("resize", adjustSize);
    };
  }, []);

  const onClickPrevPageButton = () => {
    setCurrentPage((currentPage) => currentPage - 1);
  };

  const onClickNextPageButton = () => {
    setCurrentPage((currentPage) => currentPage + 1);
  };

  const onClickMeme = (memeId: number) => {
    if (currentMemeProps.find((memeProp: MemeProp) => memeProp.data.id == memeId)) {
      dispatch(removeCurrentMemeId({ memeId }));
    } else {
      dispatch(addCurrentMemeId({ memeId }));
    }
  };

  function startGame() {
    loadAudio((ele) => {
      return ele;
    });
    onStartGame();
  }

  const onClickPlay = () => {
    startGame();
  };

  const onClickJoinMeme = () => {
    setOpenUploadMemePopup(true);
  };

  return (
    <div className="welcome-page-container">
      <img className="welcome-page-background" src={background} />
      <div className="welcome-page-stage-container">
        <img className="welcome-page-title" src={titleImage} />
        <img
          className="welcome-page-people-background"
          src={peopleBackground}
        />
        <img className="welcome-page-stage-background" src={stageBackground} />
        <img className="welcome-page-stage-dog-1-image" src={dog1} />
        <img className="welcome-page-stage-dog-2-image" src={dog2} />
        <div className="welcome-page-panel-container">
          <p
            ref={textRef}
            className="welcome-page-panel-text"
            style={{
              fontSize: `${fontSize}px`,
            }}
          >
            Current season runs until Jan 30, 2025
          </p>
          {isLogin ? (
            <>
              <div className="welcome-page-panel-join-meme-button">
                <JoinButton onClick={onClickJoinMeme} />
              </div>
              <div className="welcome-page-panel-play-button">
                <PlayButton onClick={onClickPlay} />
              </div>
            </>
          ) : (
            <div className="welcome-page-panel-connect-wallet-button">
              <ConnectWalletButton onClick={onLogin} />
            </div>
          )}
        </div>
        <div
          ref={rankingContainerRef}
          className="welcome-page-ranking-container"
        >
          <p
            ref={titleTextRef}
            className="welcome-page-ranking-text"
            style={{
              fontSize: `${titleFontSize}px`,
            }}
          >
            Pick Your Memes
          </p>
          <div className="welcome-page-selector">
            <PageSelector
              currentPage={currentPage}
              pageCount={pageCount}
              fontSize={fontSize * 1.5}
              onClickPrevPageButton={onClickPrevPageButton}
              onClickNextPageButton={onClickNextPageButton}
            />
          </div>
          <div className="welcome-page-ranking-grid">
            <Grid
              elementWidth={memeRankingIconElementWidth}
              elementHeight={memeRankingIconElementWidth}
              columnCount={memeRankingGridColumnCount}
              rowCount={memeRankingGridRowCount}
              elements={allMemeProps
                .slice(
                  currentPage * amountPerPage,
                  (currentPage + 1) * amountPerPage
                )
                .map((memeProp: MemeProp, index: number) => (
                  <MemeRankingIcon
                    key={index}
                    height={memeRankingIconElementWidth}
                    width={memeRankingIconElementWidth}
                    fontSize={fontSize}
                    image={memeProp.data.avatar}
                    rank={memeProp.model.rank}
                    isSelect={
                      currentMemeProps.find(
                        (meme: MemeProp) => meme.data.id == memeProp.data.id
                      )
                        ? true
                        : false
                    }
                    onClick={() => onClickMeme(memeProp.data.id)}
                  />
                ))}
            />
          </div>
        </div>
        <div className="welcome-page-meme-grid">
          {currentMemeProps.map((memeProp: MemeProp, index: number) => (
            <WelcomeMeme key={index} index={index} meme={memeProp} />
          ))}
        </div>
        <img
          className="welcome-page-speaker-green-left-image"
          src={speakerGreenLeft}
        />
        <img
          className="welcome-page-speaker-green-right-image"
          src={speakerGreenRight}
        />
        <img
          className="welcome-page-speaker-pink-left-image"
          src={speakerPinkLeft}
        />
        <img
          className="welcome-page-speaker-pink-right-image"
          src={speakerPinkRight}
        />
        <img
          className="welcome-page-speaker-yellow-left-image"
          src={speakerYellowLeft}
        />
        <img
          className="welcome-page-speaker-yellow-right-image"
          src={speakerYellowRight}
        />
        <div
          ref={animationContainerRef}
          className="welcome-page-left-white-light-left-animation-container"
        >
          <div
            className="welcome-page-left-white-light-left-animation"
            style={{
              transform: `translate(-50%, -50%) scale(${scaleSize * 100}%)`,
            }}
          />
        </div>
        <div className="welcome-page-left-white-light-right-animation-container">
          <div
            className="welcome-page-left-white-light-right-animation"
            style={{
              transform: `translate(-50%, -50%) scale(${scaleSize * 100}%)`,
            }}
          />
        </div>
      </div>
      {openUploadMemePopup && (
        <UploadMemePopup onClose={() => setOpenUploadMemePopup(false)} />
      )}
    </div>
  );
};

export default WelcomePage;
