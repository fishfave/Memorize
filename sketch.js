function getWordList(string) {
  let _arr = string.trim().split(" ");
  return _arr;
}

function getWordSet(arr, index, setSize) {
  let count = min(setSize, arr.length);
  const chosen = arr[index];
  const rest = arr.filter((_, i) => i !== index);

  // shuffle
  for (let i = rest.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  const _set = rest.slice(0, count - 1);
  const insertAt = floor(random(_set.length + 1));
  _set.splice(insertAt, 0, chosen);

  return _set;
}

function startMemorize() {
  currentWordIndex = 0;
  currentWordList = getWordList(
    getVerse(cBook, cChap, cVerse, cVerse + VC - 1)
  );
  currentWordChoices = getWordSet(currentWordList, currentWordIndex, 5);
  createWordButtons();
}

function createWordButtons() {
  buttons = [
    new Button(
      backButtonM.x + backButtonM.w / 2,
      backButtonM.y + backButtonM.h / 2,
      backButtonM.w,
      backButtonM.h,
      "Home",
      () => {
        switchPage("Home");
      },
      {
        cornerRadius: 8, textSize: 14,
        bgColor: PALETTE.surface, hoverColor: PALETTE.surfaceRaised,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.ink,
      }
    ),
  ];

  let buttonGap = 10;
  let buttonH = textLeading() + 20;
  let maxRowWidth = wordArea.w - buttonGap * 2;

  // --- Pass 1: figure out which words go in which row ---
  let rows = [];
  let currentRow = [];
  let rowWidth = 0;

  for (let i = 0; i < currentWordChoices.length; i++) {
    let word = currentWordChoices[i];
    let buttonW = textWidth(word) + 60;

    // would this word overflow the row?
    if (
      rowWidth + buttonW + (currentRow.length > 0 ? buttonGap : 0) >
        maxRowWidth &&
      currentRow.length > 0
    ) {
      rows.push(currentRow);
      currentRow = [];
      rowWidth = 0;
    }

    currentRow.push({ word, buttonW });
    rowWidth += buttonW + (currentRow.length > 1 ? buttonGap : 0);
  }
  if (currentRow.length > 0) rows.push(currentRow);

  // --- Pass 2: place each row, centered horizontally ---
  let y = 0;

  for (let row of rows) {
    let totalW =
      row.reduce((sum, b) => sum + b.buttonW, 0) + buttonGap * (row.length - 1);
    let startX = wordArea.x + (wordArea.w - totalW) / 2;
    let x = startX;

    for (let { word, buttonW } of row) {
      buttons.push(
        new Button(
          x + buttonW / 2,
          wordArea.y + buttonGap + y + buttonH / 2,
          buttonW,
          buttonH,
          word,
          () => {
            checkWord(word);
          },
          {
            cornerRadius: 10, textSize: 17,
            bgColor: PALETTE.surface, hoverColor: PALETTE.accentSoft,
            stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.ink,
          }
        )
      );
      x += buttonW + buttonGap;
    }

    y += buttonH + buttonGap;
  }
}

function checkWord(word) {
  if (word === currentWordList[currentWordIndex]) {
    nextWord();
  } else {
    console.log("Incorrect", word);
  }
}

function nextWord() {
  currentWordIndex++;
  if (currentWordIndex == currentWordList.length) {
    endGame();
  } else {
    currentWordChoices = getWordSet(currentWordList, currentWordIndex, 5);
    createWordButtons();
  }
}

function endGame() {
  buttons = [
    new Button(
      backButtonM.x + backButtonM.w / 2,
      backButtonM.y + backButtonM.h / 2,
      backButtonM.w,
      backButtonM.h,
      "Home",
      () => {
        switchPage("Home");
      },
      {
        cornerRadius: 8, textSize: 14,
        bgColor: PALETTE.surface, hoverColor: PALETTE.surfaceRaised,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.ink,
      }
    ),
  ];
  buttons.push(
    new Button(width / 2, wordArea.y + wordArea.h / 2 + 18, 130, 40, "Try again", () => {
      startMemorize();
    }, {
      cornerRadius: 10, textSize: 15,
      bgColor: PALETTE.accentSoft, hoverColor: PALETTE.accent,
      stroke: PALETTE.accent, strokeWeight: 1, textColor: PALETTE.ink,
    })
  );
}

let currentWordIndex = 0;
let currentWordList = [];
let currentWordChoices = [];

//=====================================================================
//                   Sketch Stuff
//=====================================================================

let cBook = "Genesis",
  cChap = 1,
  cVerse = 1,
  VC = 1;

let state = "Home"; //"Home" "Selecting" "Favorites" "Reading" "Memorize"
let currentMode = "Reading";
let buttons = [];

const PALETTE = {
  bg: [10, 12, 15],
  divider: [40, 45, 51],
  ink: [227, 230, 233],
  wordColor: [227, 230, 233],
  reference: [86, 197, 193],
  menuBg: [19, 22, 26],
  menuBgAlt: [23, 27, 32],
  menuStroke: [40, 45, 51],
  menuSelected: [40, 84, 83],
  accentBg: [27, 31, 36],
  accentHover: [37, 43, 49],
  accent: [69, 179, 176],
  accentSoft: [39, 110, 108],
  textSecondary: [140, 148, 156],
  surface: [19, 22, 26],
  surfaceRaised: [27, 31, 36],
  border: [40, 45, 51]
};

function setup() {
  buildIndex();
  loadSavedVerses();
  createCanvas(windowWidth, windowHeight);
  setupMemorize();
  switchPage("Home");
  verseY = height / 2;
  _buttonMode = CENTER;                 // CENTER or CORNER
  _buttonTextAlign = [CENTER, CENTER]; 
}

function draw() {
  background(...PALETTE.bg);

  switch (state) {
    case "Home":
      drawHome();
      break;
    case "Selecting":
      drawSelecting();
      break;
    case "Reading":
      drawReading();
      break;
    case "Memorize":
      drawMemorize();
      break;
    case "Favorites":
      drawFavorites();
      break;
  }

  for (let btn of buttons) {
    btn.draw();
  }
}

let homeLayout = {};

function buildHomeLayout() {
  const marginX = max(24, width * 0.08);
  const cardW = width - marginX * 2;
  const cardH = 74;
  const titleY = height * 0.14;
  const cardY = titleY + 56;
  const navH = 54;
  const nav1Y = cardY + cardH + 26;
  const nav2Y = nav1Y + navH;
  const toggleW = 168, toggleH = 30;

  homeLayout = {
    titleY,
    card: { x: marginX, y: cardY, w: cardW, h: cardH },
    nav: [
      { y: nav1Y, h: navH, label: "New Verse", action: () => switchPage("Selecting") },
      { y: nav2Y, h: navH, label: "Saved Verses", action: () => switchPage("Favorites") },
    ],
    navX: marginX,
    navW: cardW,
    toggle: { x: width - marginX - toggleW, y: 24, w: toggleW, h: toggleH },
  };
}

function drawHome() {
  push();

  // Wordmark
  noStroke();
  fill(...PALETTE.ink);
  textFont('Georgia, "Times New Roman", serif');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("Scripture", width / 2, homeLayout.titleY);

  fill(...PALETTE.textSecondary);
  textFont("Helvetica, Arial, sans-serif");
  textStyle(NORMAL);
  textSize(13);
  text("Read a little. Remember it well.", width / 2, homeLayout.titleY + 28);

  // Continue-reading card — the one bold element on this screen
  const c = homeLayout.card;
  rectMode(CORNER);
  stroke(...PALETTE.border);
  strokeWeight(1);
  fill(...PALETTE.surface);
  rect(c.x, c.y, c.w, c.h, 10);

  noStroke();
  fill(...PALETTE.accent);
  rect(c.x, c.y, 4, c.h, 6, 0, 0, 6);

  textAlign(LEFT, TOP);
  fill(...PALETTE.textSecondary);
  textFont("Helvetica, Arial, sans-serif");
  textSize(12);
  text("Continue where you left off", c.x + 24, c.y + 14);

  let ref = `${cBook} ${cChap}:${cVerse}` + (VC > 1 ? `\u2013${cVerse + VC - 1}` : "");
  fill(...PALETTE.ink);
  textFont('Georgia, "Times New Roman", serif');
  textSize(19);
  text(ref, c.x + 24, c.y + 32);

  textAlign(RIGHT, CENTER);
  fill(...PALETTE.accent);
  textFont("Helvetica, Arial, sans-serif");
  textSize(13);
  text("Resume \u2192", c.x + c.w - 22, c.y + c.h / 2 + 2);

  // Dividers under the nav list (editorial list, not boxed cards)
  stroke(...PALETTE.border);
  strokeWeight(1);
  for (const row of homeLayout.nav) {
    line(homeLayout.navX, row.y + row.h, homeLayout.navX + homeLayout.navW, row.y + row.h);
  }
  pop();
}

function drawSelecting() {
  stroke(...PALETTE.menuStroke);
  fill(...PALETTE.menuBg);
  menu.show();

  let displayText = "";
  if (selecting == "book") {
    displayText = bookNumberToName(menu.options[menu.selectedIndex]);
  } else if (selecting == "chapter") {
    displayText = cBook + " " + menu.options[menu.selectedIndex];
  } else if (selecting == "verse") {
    displayText =
      cBook + " " + cChap + " : " + menu.options[menu.selectedIndex];
  } else if (selecting == "verseCount") {
    displayText =
      cBook +
      " " +
      cChap +
      " : " +
      cVerse +
      " - " +
      (cVerse - 1 + menu.options[menu.selectedIndex]);
  }

  noStroke();
  fill(...PALETTE.reference);
  textFont('Georgia, "Times New Roman", serif');
  textStyle(BOLD);
  textSize(16);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  text(displayText, width / 2, height / 2, 150);
  textAlign(CENTER, TOP);
  text(displayText, width / 2, 16, 150);
  textStyle(NORMAL);
}

function drawReading() {
  displayVerse(cBook, cChap, cVerse, cVerse + VC - 1);
}

let gap = 20;
let textLayout = [];
let textArea, backButtonM;
function setupMemorize() {
  textArea = { x: gap, y: gap * 3 + 36, w: width - gap * 2, h: height * 0.6 };
  wordArea = {
    x: gap,
    y: gap * 5 + 36 + height * 0.6,
    w: width - gap * 2,
    h: height - (gap * 5 + 36 + height * 0.6) - gap,
  };
  backButtonM = {
    x: width - gap - (width - gap * 2) * 0.2,
    y: gap,
    w: (width - gap * 2) * 0.2,
    h: 36,
  };
}

function drawMemorize() {
  push();
  rectMode(CORNER);
  strokeWeight(3);
  fill(...PALETTE.menuBg);
  stroke(...PALETTE.menuStroke);
  //Title
  rect(gap, gap, (width - gap * 2) * 0.75, 36, 3);

  //Text Area
  rect(textArea.x, textArea.y, textArea.w, textArea.h, 10);
  //Word Area
  //rect(wordArea.x, wordArea.y, wordArea.w, wordArea.h, 10);

  let ref = `${cBook} ${cChap} : ${cVerse}`;
  if (VC > 1) ref += " - " + (cVerse + VC - 1);
  textAlign(CENTER, CENTER);
  fill(...PALETTE.reference);
  noStroke();
  textSize(20);
  textFont('Georgia, "Times New Roman", serif');
  text(ref, gap + ((width - gap * 2) * 0.75) / 2, gap + 18);

  // Progress bar + counter
  let total = max(currentWordList.length, 1);
  let progress = currentWordIndex / total;
  let barX = gap, barY = gap + 36 + 10, barW = (width - gap * 2) * 0.75, barH = 6;
  noStroke();
  fill(...PALETTE.border);
  rect(barX, barY, barW, barH, 3);
  fill(...PALETTE.accent);
  rect(barX, barY, barW * progress, barH, 3);

  fill(...PALETTE.textSecondary);
  textFont("Helvetica, Arial, sans-serif");
  textAlign(RIGHT, TOP);
  textSize(11);
  text(`${currentWordIndex} / ${currentWordList.length}`, barX + barW, barY + 10);

  if (currentWordList.length > 0 && currentWordIndex === currentWordList.length) {
    noStroke();
    fill(...PALETTE.accent);
    textFont("Helvetica, Arial, sans-serif");
    textAlign(CENTER, CENTER);
    textSize(15);
    text("Memorized \u2014 well done.", width / 2, wordArea.y + 20);
  }

  if (currentWordIndex > 0) {
    let correctWords = currentWordList.slice(0, currentWordIndex);
    textAlign(LEFT, TOP);
    textSize(32);
    fill(...PALETTE.ink);
    if (textLayout.length != correctWords.length) {
      updateLayout(correctWords);
      console.log("Updating layout");
    }

    for (let item of textLayout) {
      text(item.word, item.x + textArea.x + gap, item.y + textArea.y + gap);
    }
  }
  pop();
}

function updateLayout(list) {
  textLayout = [];
  let x = 0,
    y = 0,
    row = 0;
  let lineHeight = textLeading();
  let spaceWidth = textWidth("a a") - textWidth("aa");

  for (let word of list) {
    let wWidth = textWidth(word);
    if (x + wWidth > width - gap * 4 && x > 0) {
      row++;
      x = 0;
      y += lineHeight;
    }

    textLayout.push({
      word,
      x, // x pos relative to rect's left edge
      y, // y pos relative to rect's top edge (unscrolled)
      row,
    });

    x += wWidth + spaceWidth;
  }
}
function drawFavorites() {
  if (savedVerses.length === 0) {
    textAlign(CENTER, CENTER);
    textSize(20);
    text("Save verses while\nin reading mode", width / 2, height / 2);
  }
}

function switchPage(newState) {
  if (newState === "Home") {
    state = newState;
    buildHomeLayout();
    buttons = [];

    for (const row of homeLayout.nav) {
      buttons.push(
        new Button(
          homeLayout.navX, row.y, homeLayout.navW, row.h,
          row.label,
          row.action,
          {
            mode: CORNER,
            cornerRadius: 6,
            strokeWeight: 0,
            bgColor: PALETTE.bg,
            hoverColor: PALETTE.surface,
            textColor: PALETTE.ink,
            textAlign: [LEFT, CENTER],
            textSize: 17,
          }
        )
      );
    }

    // Segmented Reading/Memorize toggle, tucked in the corner
    const t = homeLayout.toggle;
    const halfW = t.w / 2;
    const segStyle = (mode) => ({
      mode: CORNER,
      cornerRadius: 0,
      strokeWeight: 1,
      stroke: PALETTE.border,
      textSize: 12,
      bgColor: currentMode === mode ? PALETTE.accentSoft : PALETTE.surface,
      hoverColor: currentMode === mode ? PALETTE.accentSoft : PALETTE.surfaceRaised,
      textColor: currentMode === mode ? PALETTE.ink : PALETTE.textSecondary,
    });
    buttons.push(
      new Button(t.x, t.y, halfW, t.h, "Reading", () => {
        currentMode = "Reading";
        switchPage("Home");
      }, segStyle("Reading"))
    );
    buttons.push(
      new Button(t.x + halfW, t.y, halfW, t.h, "Memorize", () => {
        currentMode = "Memorize";
        switchPage("Home");
      }, segStyle("Memorize"))
    );

  } else if (newState === "Selecting") {
    getNewMenu();
    state = newState;
    buttons = [];
  } else if (newState === "Reading") {
    verseY = height / 2;
    state = newState;
    buttons = [
      new Button(64, 26, 96, 34, "\u2039 Back", () => {
        switchPage("Home");
      }, {
        cornerRadius: 8, textSize: 14,
        bgColor: PALETTE.surface, hoverColor: PALETTE.surfaceRaised,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.ink,
      }),
      new Button(width - 46, 26, 76, 34, "Save", () => {
        saveCurrentVerse();
        buttons[1].label = "Saved";
        buttons[1].style.bgColor = PALETTE.accentSoft;
        buttons[1].style.hoverColor = PALETTE.accentSoft;
        buttons[1].style.textColor = PALETTE.ink;
      }, {
        cornerRadius: 8, textSize: 14,
        bgColor: PALETTE.surface, hoverColor: PALETTE.surfaceRaised,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.ink,
      }),
      new Button(46, height - 44, 44, 44, "\u2039", () => {
        goToPrevRange();
      }, {
        cornerRadius: 22, textSize: 20,
        bgColor: PALETTE.surface, hoverColor: PALETTE.accentSoft,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.accent,
      }),
      new Button(width - 46, height - 44, 44, 44, "\u203A", () => {
        goToNextRange();
      }, {
        cornerRadius: 22, textSize: 20,
        bgColor: PALETTE.surface, hoverColor: PALETTE.accentSoft,
        stroke: PALETTE.border, strokeWeight: 1, textColor: PALETTE.accent,
      }),
    ];
  } else if (newState === "Memorize") {
    state = newState;
    startMemorize();
  } else if (newState === "Favorites") {
    state = newState;
    buttons = [
      new Button(55, 26, 90, 32, "Go Back", () => {
        switchPage("Home");
      }),
    ];
    for (let i = 0; i < savedVerses.length; i++) {
      let ref = savedVerses[i];
      let refText = `${ref.book} ${ref.chap} : ${ref.verse}`;
      if (ref.vc > 1) {
        refText += ` - ${ref.verse + ref.vc - 1}`;
      }

      buttons.push(
        new Button(width / 2, 30 + 40 * i, 200, 30, refText, () => {
          setCurrentVerse(ref);
          switchPage(currentMode);
        }),
        new Button(width / 2 + 130, 30 + 40 * i, 20, 20, "X", () => {
          removeVerse(i);
          switchPage("Favorites");
        })
      );
    }
  }
}

//=============================================================
//       clicking
//=============================================================

function mouseClicked() {
  if (state === "Home") {
    clickHome();
  } else if (state === "Selecting") {
    clickSelecting();
  } else if (state === "Reading") {
    clickReading();
  } else if (state === "Memorize") {
    clickMemorize();
  }
  for (let btn of buttons) {
    btn.handleClick();
  }
}

function clickHome() {
  const c = homeLayout.card;
  if (mouseX > c.x && mouseX < c.x + c.w && mouseY > c.y && mouseY < c.y + c.h) {
    switchPage(currentMode);
  }
}

function clickSelecting() {
  menu.handleClick();
}

function clickReading() {}

function clickMemorize() {}

function mouseMoved() {
  for (let btn of buttons) {
    btn.update();
  }
}

let verseY;
let offsetY = 0;
let dragging = true;
function mousePressed() {
  if (state === "Reading") offsetY = verseY - mouseY;
}

function mouseDragged() {
  if (state === "Reading") {
    verseY = mouseY + offsetY;
  }
  return false;
}

//=============================================================
//       verse storage
//=============================================================

let savedVerses = []; // list of saved references

// Call this whenever you want to save the current selection
function saveCurrentVerse() {
  let verseRef = {
    book: cBook,
    chap: cChap,
    verse: cVerse,
    vc: VC,
  };

  if (isDuplicate(verseRef)) {
    console.log("Verse already saved");
    return; // skip adding it again
  }

  savedVerses.push(verseRef);
  storeItem("savedVerses", savedVerses);
}

function isDuplicate(ref) {
  return savedVerses.some(
    (v) =>
      v.book === ref.book &&
      v.chap === ref.chap &&
      v.verse === ref.verse &&
      v.vc === ref.vc
  );
}

// Move forward/back by the current verse-range size (VC), rolling into the
// next/previous chapter or book at the edges.
function goToNextRange() {
  let bookNum = bookNameToNumber(cBook);
  let chapterVerseCount = Object.keys(bible[bookNum][cChap]).length;
  let nextStart = cVerse + VC;

  if (nextStart <= chapterVerseCount) {
    cVerse = nextStart;
  } else {
    let chapters = Object.keys(bible[bookNum]).map(Number);
    let maxChapter = max(chapters);
    if (cChap < maxChapter) {
      cChap++;
      cVerse = 1;
    } else {
      let bookNumbers = Object.keys(bible).map(Number);
      let idx = bookNumbers.indexOf(bookNum);
      if (idx < bookNumbers.length - 1) {
        bookNum = bookNumbers[idx + 1];
        cBook = bookNumberToName(bookNum);
        cChap = 1;
        cVerse = 1;
      }
    }
  }
  verseY = height / 2;
}

function goToPrevRange() {
  let bookNum = bookNameToNumber(cBook);
  let prevStart = cVerse - VC;

  if (prevStart >= 1) {
    cVerse = prevStart;
  } else if (cChap > 1) {
    cChap--;
    let chapterVerseCount = Object.keys(bible[bookNum][cChap]).length;
    cVerse = max(1, chapterVerseCount - VC + 1);
  } else {
    let bookNumbers = Object.keys(bible).map(Number);
    let idx = bookNumbers.indexOf(bookNum);
    if (idx > 0) {
      bookNum = bookNumbers[idx - 1];
      cBook = bookNumberToName(bookNum);
      let chapters = Object.keys(bible[bookNum]).map(Number);
      cChap = max(chapters);
      let chapterVerseCount = Object.keys(bible[bookNum][cChap]).length;
      cVerse = max(1, chapterVerseCount - VC + 1);
    }
  }
  verseY = height / 2;
}

function setCurrentVerse(ref) {
  cBook = ref.book;
  cChap = ref.chap;
  cVerse = ref.verse;
  VC = ref.vc;
}

// Call this once, e.g. in setup(), to load previously saved verses
function loadSavedVerses() {
  let loaded = getItem("savedVerses");
  if (loaded !== null) {
    savedVerses = loaded;
  }
}

function removeVerse(index) {
  savedVerses.splice(index, 1);
  storeItem("savedVerses", savedVerses); // re-save the updated list
}

//=============================================================
//       radial menu setup
//=============================================================

let menu;
let selecting = "book";

function getNewMenu() {
  selecting = "book";
  menu = new RadialMenu(Object.keys(bible), (n) => {
    setBook(n);
    selecting = "chapter";
    menu = new RadialMenu(Object.keys(bible[n]), (n2) => {
      setChapter(n2);
      selecting = "verse";
      menu = new RadialMenu(
        Object.keys(bible[bookNameToNumber(cBook)][cChap]),
        (n3) => {
          setVerse(n3);
          selecting = "verseCount";
          let count =
            Object.keys(bible[bookNameToNumber(cBook)][cChap]).length +
            1 -
            cVerse;
          let tempList = [...Array(count).keys()].map((i) => i + 1);
          menu = new RadialMenu(tempList, (n4) => {
            VC = n4;
            switchPage(currentMode);
          });
        }
      );
    });
  });
}

//=====================================================================
//                   Get Verse Stuff
//=====================================================================

//Return a set of verses or verse from a chapter in a book
function getVerse(book, chapter, startVerse, endVerse = startVerse) {
  let bookNum = typeof book === "number" ? book : bookNameToNumber(book);

  if (!bookNum || !bookNames[bookNum - 1]) {
    console.warn(`Unknown book: ${book}`);
    return undefined;
  }

  let results = "";

  for (let v = startVerse; v <= endVerse; v++) {
    // verse text
    let vt = bible[bookNum]?.[chapter]?.[v];

    if (vt === undefined) {
      //console.warn(`Verse not found: ${bookNumberToName(bookNum)} ${chapter}:${v}`);
      continue; // skip missing verses rather than failing the whole range
    }

    results += vt;
    if (v != endVerse) results += " ";
  }

  return results.replace(/<\/?i>/g, "").replace(/ +/g, " ");
}

//return whole book as a string
function getBook(book) {
  let bookNum = typeof book === "number" ? book : bookNameToNumber(book);

  if (!bookNum || !bookNames[bookNum - 1]) {
    console.warn(`Unknown book: ${book}`);
    return undefined;
  }

  let verses = [];
  for (let chapter of Object.values(bible[bookNum])) {
    for (let v of Object.values(chapter)) {
      verses.push(v);
    }
  }
  return verses
    .join(" ")
    .replace(/<\/?i>/g, "")
    .replace(/ +/g, " ");
}

//return whole Bible as string
function getBible() {
  let output = [];
  for (let i = 1; i < 67; i++) {
    output.push(getBook(i));
  }
  return output.join(" ");
}
function setBook(n) {
  cBook = bookNumberToName(n);
  setChapter(1);
}

function setChapter(n) {
  cChap = parseInt(n);
  setVerse(1);
}

function setVerse(n) {
  cVerse = parseInt(n);
}

function displayVerse(b, c, sv, lv = sv) {
  let ref = b + " " + c + ": " + sv;

  //no overflow
  if (Object.keys(bible[bookNameToNumber(b)][c]).length < lv) {
    lv = Object.keys(bible[bookNameToNumber(b)][c]).length;
  }
  // add second verse to ref
  if (sv != lv) {
    ref += " - " + lv;
  }

  let verseText = getVerse(b, c, sv, lv);

  // Panel behind the verse text
  push();
  rectMode(CORNER);
  stroke(...PALETTE.border);
  strokeWeight(1);
  fill(...PALETTE.surface);
  rect(28, 74, width - 56, height - 74 - 74, 14);
  pop();

  noStroke();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  // Reference line: small, accent-colored, sans-serif
  fill(...PALETTE.reference);
  textFont("Helvetica, Arial, sans-serif");
  textStyle(BOLD);
  textSize(15);
  text(ref, width / 2, 54, width - 40);

  // Verse body: larger, soft ink color, serif
  fill(...PALETTE.ink);
  textFont('Georgia, "Times New Roman", serif');
  textStyle(NORMAL);
  textSize(20);
  text(verseText, width / 2, verseY, 0.8 * width);
}

//=====================================================================
//                   Building Stuff
//=====================================================================

let bible = {};

function buildIndex() {
  for (let [book, chapter, verse, text] of bibleArray) {
    if (!bible[book]) bible[book] = {};
    if (!bible[book][chapter]) bible[book][chapter] = {};
    bible[book][chapter][verse] = text;
  }
}

const bookNames = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const nameToNumber = {};
bookNames.forEach((name, i) => {
  nameToNumber[name.toLowerCase()] = i + 1; // book numbers are 1-indexed
});

function bookNumberToName(num) {
  return bookNames[num - 1];
}

function bookNameToNumber(name) {
  return nameToNumber[name.toLowerCase()];
}