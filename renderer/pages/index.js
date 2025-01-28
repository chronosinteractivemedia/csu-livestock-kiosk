import styles from "./index.module.scss";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { KeyboardReact as Keyboard } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import ReactDOMServer from "react-dom/server";
import Fuse from "fuse.js";
import {ipcRenderer} from 'electron';

export default function Index({ awards, globalSettings }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortedAwards, setSortedAwards] = useState([]);
  const [currentAwardIndex, setCurrentAwardIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [inlineButton, setInlineButton] = useState(null);

  useEffect(() => {
    let timeout;
    //any interaction with document will turn off auto play and reset a resume timeout
    function resetAutoPlay() {
      if (timeout) clearTimeout(timeout);
      setIsAutoPlaying(false);
      timeout = setTimeout(() => {
        setIsAutoPlaying(true);
        setSearchOpen(false);
      }, 300000);
    }
    document.addEventListener("click", resetAutoPlay);
    document.addEventListener("keydown", resetAutoPlay);
    return () => {
      if (timeout) clearTimeout(timeout);
      document.removeEventListener("click", resetAutoPlay);
      document.removeEventListener("keydown", resetAutoPlay);
    };
  }, []);

  useEffect(() => {
    setSortedAwards(
      awards.sort((a, b) => {
        if (a.year < b.year) return -1;
        if (a.year > b.year) return 1;
        if (a.lastName < b.lastName) return -1;
        if (a.lastName > b.lastName) return 1;
        return 0;
      }),
    );
  }, [awards]);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setTimeout(() => {
        nextAward(false);
      }, 30000);
      return () => clearTimeout(interval);
    }
  }, [isAutoPlaying, currentAwardIndex]);

  useEffect(() => {
    //if next in sorted array has same year, set button to "next"
    // if prev in sorted array has same year, set button to "prev"
    // else set button to null
    const current = sortedAwards[currentAwardIndex];
    const next = sortedAwards[currentAwardIndex + 1];
    const prev = sortedAwards[currentAwardIndex - 1];
    if (next && next.year === current.year) {
      setInlineButton("next");
    } else if (prev && prev.year === current.year) {
      setInlineButton("prev");
    } else {
      setInlineButton(null);
    }
  }, [currentAwardIndex]);

  const currentAward = sortedAwards[currentAwardIndex];

  function nextAward() {
    setCurrentAwardIndex((prev) => {
      if (prev === sortedAwards.length - 1) return 0;
      return prev + 1;
    });
  }

  function prevAward() {
    setCurrentAwardIndex((prev) => {
      if (prev === 0) return sortedAwards.length - 1;
      return prev - 1;
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchToggle} onClick={() => setSearchOpen(true)}>
        <svg
          width="47"
          height="47"
          viewBox="0 0 47 47"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M20.6667 2.58333C10.6795 2.58333 2.58333 10.6795 2.58333 20.6667C2.58333 30.6537 10.6795 38.75 20.6667 38.75C25.4224 38.75 29.7494 36.9141 32.9775 33.9124L33.9124 32.9775C36.9141 29.7494 38.75 25.4224 38.75 20.6667C38.75 10.6795 30.6537 2.58333 20.6667 2.58333ZM36.1651 34.3384C39.3816 30.695 41.3333 25.9088 41.3333 20.6667C41.3333 9.25277 32.0805 0 20.6667 0C9.25277 0 0 9.25277 0 20.6667C0 32.0805 9.25277 41.3333 20.6667 41.3333C25.9088 41.3333 30.695 39.3816 34.3384 36.1651L44.5625 46.3892L46.3892 44.5625L36.1651 34.3384Z"
            fill="#F5F4EE"
          />
        </svg>
        <p>
          Search <br /> by year <br /> or name
        </p>
      </div>
      <div className={styles.inner}>
        <div className={styles.main}>
          <ImgDisplay
            imgUrl={`${currentAward?.photo?.url}`}
            year={currentAward?.year}
            name={`${currentAward?.firstName} ${currentAward?.lastName}`}
          />
          <ContentDisplay
            textSrc={currentAward?.description || []}
            aboutSrc={globalSettings?.awardInfo || []}
            button={inlineButton}
            year={currentAward?.year}
            onClickInline={() => {
              if (inlineButton === "next") {
                nextAward();
              } else if (inlineButton === "prev") {
                prevAward();
              }
            }}
          />
        </div>
        <div className={styles.nav}>
          <div className={styles.navInfo}>
            <img src="/images/logo.svg" alt="Logo" />
            <div className={styles.navText}>
              <p>Department of Animal Sciences</p>
              <p>Livestock Leader</p>
            </div>
          </div>
          <div className={styles.navControls}>
            <div className={styles.prev} onClick={prevAward}>
              <svg
                width="110"
                height="94"
                viewBox="0 0 110 94"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.9165 15.6666H27.4998V78.3333H22.9165V15.6666Z"
                  fill="#E3D7D3"
                />
                <path
                  d="M87.0834 15.9646V78.0352L31.4946 47L87.0834 15.9646Z"
                  fill="#E3D7D3"
                />
              </svg>
            </div>
            <div
              className={styles.playPause}
              onClick={(e) => {
                e.stopPropagation();
                nextAward();
                setIsAutoPlaying(true);
              }}
            >
              {isAutoPlaying ? (
                <svg
                  id="pause"
                  width="110"
                  height="94"
                  viewBox="0 0 110 94"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.3335 11.75V82.25H45.8335V11.75H18.3335Z"
                    fill="#E3D7D3"
                  />
                  <path
                    d="M64.1665 11.75V82.25H91.6665V11.75H64.1665Z"
                    fill="#E3D7D3"
                  />
                </svg>
              ) : (
                <svg
                  width="80"
                  height="94"
                  viewBox="0 0 80 94"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.9166 15.9646V78.0352L78.5054 47L22.9166 15.9646Z"
                    fill="#E3D7D3"
                  />
                </svg>
              )}
            </div>
            <div className={styles.next} onClick={nextAward}>
              <svg
                width="110"
                height="94"
                viewBox="0 0 110 94"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M87.0835 15.6666H82.5002V78.3333H87.0835V15.6666Z"
                  fill="#E3D7D3"
                />
                <path
                  d="M22.9166 15.9646V78.0352L78.5054 47L22.9166 15.9646Z"
                  fill="#E3D7D3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {!!searchOpen && (
        <Osk
          onClose={() => {
            setSearchOpen(false);
          }}
          awards={sortedAwards}
          onSelectIndex={(index) => {
            setCurrentAwardIndex(index);
          }}
        />
      )}
    </div>
  );
}

function ImgDisplay({ imgUrl, year, name }) {
  return (
    <div className={styles.imgContainer}>
      <img src={imgUrl} alt={name} />
      <div className={styles.imgInfo}>
        <span className={styles.year}>{year}</span>
        <span className={styles.name}>{name}</span>
      </div>
    </div>
  );
}

function ContentDisplay({
  textSrc,
  aboutSrc,
  button = null,
  year,
  onClickInline,
}) {
  const [isSingleColumn, setIsSingleColumn] = useState(true);
  const [roomForAbout, setRoomForAbout] = useState(false);
  const [text, setText] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    const renderedText = ReactDOMServer.renderToString(
      <BlocksRenderer content={textSrc} />,
    );
    const renderedAbout = ReactDOMServer.renderToString(
      <BlocksRenderer content={aboutSrc} />,
    );

    // Update the state with the rendered HTML strings
    setText(renderedText);
    setAbout(renderedAbout); //need help here
  }, [textSrc, aboutSrc]);

  const adjButton = () => {
    if (!button) return null;
    return (
      <div
        className={styles.inlineButton}
        data-button-type={button}
        onClick={onClickInline}
      >
        {button === "prev" && (
          <svg
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: "rotate(180deg)", marginRight: "10px" }}
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M14 5.08582L21.4142 12.5L14 19.9142L12.5858 18.5L17.5858 13.5H3V11.5H17.5858L12.5858 6.50003L14 5.08582Z"
              fill="#F5F4EE"
            />
          </svg>
        )}{" "}
        {year} Co-Recipient{" "}
        {button === "next" && (
          <svg
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginLeft: "10px" }}
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M14 5.08582L21.4142 12.5L14 19.9142L12.5858 18.5L17.5858 13.5H3V11.5H17.5858L12.5858 6.50003L14 5.08582Z"
              fill="#F5F4EE"
            />
          </svg>
        )}
      </div>
    );
  };

  useEffect(() => {
    const tempContainer = document.createElement("div");
    tempContainer.classList.add(styles.textContent);
    tempContainer.style.position = "absolute";
    tempContainer.style.visibility = "hidden";
    tempContainer.style.width = "300px"; // Adjust to match your layout width
    tempContainer.style.columnCount = "2";
    document.body.appendChild(tempContainer);
    tempContainer.innerHTML = text + " " + about;
    const totalHeight = tempContainer.clientHeight;
    tempContainer.innerHTML = text;
    const textHeight = tempContainer.clientHeight;
    tempContainer.innerHTML = about;
    const aboutHeight = tempContainer.clientHeight;
    document.body.removeChild(tempContainer);
    setIsSingleColumn(textHeight < 480);
    setRoomForAbout(totalHeight < 960 && !button);
  }, [text, about]);

  return (
    <div className={styles.contentContainer}>
      {!isSingleColumn ? (
        <div className={styles.autoColText}>
          <span
            dangerouslySetInnerHTML={{
              __html: roomForAbout ? text + " " + about : text,
            }}
          />
          {adjButton()}
        </div>
      ) : (
        <div className={styles.forcedSplitText}>
          <div
            className={styles.forceCol}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          <div className={styles.forceCol}>
            <span dangerouslySetInnerHTML={{ __html: about }} />
            {adjButton()}
          </div>
        </div>
      )}
    </div>
  );
}

const kbOpts = {
  layout: {
    default: [
      "1 2 3 4 5 6 7 8 9 0 {bksp}",
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {shift}",
      "{space}",
    ],
    shift: [
      "1 2 3 4 5 6 7 8 9 0 {bksp}",
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {shift}",
      "{space}",
    ],
  },
};

const fuseOptions = {
  keys: [
    { name: "lastName", weight: 0.3 },
    { name: "firstName", weight: 0.3 },
    { name: "year", weight: 0.4 },
  ],
  threshold: 0.2,
  distance: 50, // Lower distance makes the search stricter
  shouldSort: true,
  ignoreLocation: true,
};
function Osk({ onClose, awards, onSelectIndex }) {
  const [value, setValue] = useState("");
  const [raised, setRaised] = useState(false);
  const [layout, setLayout] = useState("default");
  const [fuseInstance, setFuseInstance] = useState(null);
  const [results, setResults] = useState([]);
  const kbRef = useRef(null);

  useEffect(() => {
    setFuseInstance(new Fuse(awards, fuseOptions));
  }, [awards]);

  useEffect(() => {
    if (!fuseInstance) return;
    if (!value) {
      setResults([]);
      return;
    }
    if(value === 'close56623'){
        ipcRenderer.send('close-me');
    }
    const res = fuseInstance.search(value);
    const newResults = res.map((r) => ({...r.item, refIndex: r.refIndex}));
    setResults(newResults);
  }, [value]);

  function onChooseResult(refIndex) {
    onSelectIndex(refIndex);
    onClose();
  }

  return (
    <div className={styles.osk} data-raised={raised}>
      <div className={styles.oskOverlay} onClick={onClose} />
      <div className={styles.oskWrap}>
        <div className={styles.oskClose} onClick={onClose}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10ZM7 6.29289L6.29289 7L9.2929 10L6.29289 13L7 13.7071L10 10.7071L13 13.7071L13.7071 13L10.7071 10L13.7071 7L13 6.29289L10 9.2929L7 6.29289Z"
              fill="#7A564D"
            />
          </svg>
        </div>
        <div className={styles.oskInput}>
          <svg
            width="47"
            height="47"
            viewBox="0 0 47 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M20.6667 2.58333C10.6795 2.58333 2.58333 10.6795 2.58333 20.6667C2.58333 30.6537 10.6795 38.75 20.6667 38.75C25.4224 38.75 29.7494 36.9141 32.9775 33.9124L33.9124 32.9775C36.9141 29.7494 38.75 25.4224 38.75 20.6667C38.75 10.6795 30.6537 2.58333 20.6667 2.58333ZM36.1651 34.3384C39.3816 30.695 41.3333 25.9088 41.3333 20.6667C41.3333 9.25277 32.0805 0 20.6667 0C9.25277 0 0 9.25277 0 20.6667C0 32.0805 9.25277 41.3333 20.6667 41.3333C25.9088 41.3333 30.695 39.3816 34.3384 36.1651L44.5625 46.3892L46.3892 44.5625L36.1651 34.3384Z"
              fill="#7a564d"
            />
          </svg>
          <input value={value} placeholder="Search by year or name" />
          {!!value && <div className={styles.oskbClear} onClick={() => {kbRef.current.clearInput(); setValue('');}}>Clear</div>}
        </div>
        <div className={styles.oskKb}>
          <Keyboard
            onChange={setValue}
            layout={kbOpts.layout}
            layoutName={layout}
            value={value}
            keyboardRef={(r) => (kbRef.current = r)}
            onKeyPress={(button) => {
              if (button === "{shift}") {
                setLayout(layout === "default" ? "shift" : "default");
              } else {
                setLayout("default");
              }
            }}
          />
        </div>
        {!raised && (
          <div className={styles.oskRaise} onClick={() => setRaised(true)}>
            <img src="/images/kb-raise.svg" /> Raise keyboard
          </div>
        )}
        <div className={styles.oskResults}>
          {results.map((r, i) => (
            <div
              key={i}
              className={styles.oskResult}
              onClick={() => onChooseResult(r.refIndex)}
            >
              <img
                src={`https://csu-livestock-award-kiosk-cms.onrender.com${r.photo.url}`}
              />
              <span>{r.year}</span>
              <span>{r.firstName} {r.lastName}</span>
            </div>
          ))}
        </div>
      </div>
      {!!raised && (
        <div className={styles.oskLower} onClick={() => setRaised(false)}>
          <img src="/images/kb-lower.svg" /> Lower keyboard
        </div>
      )}
    </div>
  );
}

export async function getStaticProps() {
  let awards = await axios.get(
    "https://csu-livestock-award-kiosk-cms.onrender.com/api/awards?pagination[page]=1&pagination[pageSize]=250&populate=*",
  );
  let globalSettings = await axios.get(
    "https://csu-livestock-award-kiosk-cms.onrender.com/api/global",
  );
  awards = awards.data?.data;
  globalSettings = globalSettings.data?.data;
  return {
    props: { awards, globalSettings },
  };
}
