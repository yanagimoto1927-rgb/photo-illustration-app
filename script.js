const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const changeImageButton = document.getElementById("changeImageButton");

const generateButton = document.getElementById("generateButton");

const progressSection = document.getElementById("progressSection");
const progressMessage = document.getElementById("progressMessage");
const progressBar = document.getElementById("progressBar");
const progressCount = document.getElementById("progressCount");

const resultSection = document.getElementById("resultSection");
const resultGrid = document.getElementById("resultGrid");
const downloadAllButton = document.getElementById("downloadAllButton");

const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");

const illustrationStyles = [
  {
    key: "comic",
    name: "漫画風",
    icon: "🎨"
  },
  {
    key: "anime",
    name: "アニメ風",
    icon: "✨"
  },
  {
    key: "watercolor",
    name: "水彩画",
    icon: "🖌️"
  },
  {
    key: "oil",
    name: "油絵風",
    icon: "🖼️"
  },
  {
    key: "stamp",
    name: "LINEスタンプ風",
    icon: "💬"
  },
  {
    key: "chibi",
    name: "ちびキャラ",
    icon: "😊"
  },
  {
    key: "pop",
    name: "ポップアート",
    icon: "🌈"
  },
  {
    key: "pixel",
    name: "ピクセルアート",
    icon: "👾"
  },
  {
    key: "real",
    name: "リアルイラスト",
    icon: "🧑‍🎨"
  },
  {
    key: "pencil",
    name: "鉛筆画",
    icon: "✏️"
  }
];

let selectedImageBase64 = "";
let generatedImages = [];
let isGenerating = false;


/* --------------------------------
   写真選択
-------------------------------- */

imageInput.addEventListener("change", async function () {
  const file = this.files?.[0];

  if (!file) {
    return;
  }

  await prepareSelectedImage(file);
});


/* --------------------------------
   ドラッグ＆ドロップ
-------------------------------- */

["dragenter", "dragover"].forEach((eventName) => {
  uploadBox.addEventListener(eventName, function (event) {
    event.preventDefault();
    uploadBox.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadBox.addEventListener(eventName, function (event) {
    event.preventDefault();
    uploadBox.classList.remove("drag-over");
  });
});

uploadBox.addEventListener("drop", async function (event) {
  const file = event.dataTransfer.files?.[0];

  if (!file) {
    return;
  }

  await prepareSelectedImage(file);
});


/* --------------------------------
   別の写真を選択
-------------------------------- */

changeImageButton.addEventListener("click", function () {
  imageInput.click();
});


/* --------------------------------
   写真の確認・圧縮
-------------------------------- */

async function prepareSelectedImage(file) {
  clearError();

  if (!file.type.startsWith("image/")) {
    showError("画像ファイルを選択してください。");
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    showError("JPG・PNG・WebP形式の画像を選択してください。");
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showError("画像サイズは15MB以下にしてください。");
    return;
  }

  try {
    selectedImageBase64 = await resizeImage(file, 1600, 0.88);

    previewImage.src = selectedImageBase64;
    previewArea.classList.remove("hidden");
    generateButton.disabled = false;

    resetResults();
  } catch (error) {
    showError("写真の読み込みに失敗しました。");
  }
}


/* --------------------------------
   画像縮小
-------------------------------- */

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = function () {
      reject(new Error("ファイルを読み込めませんでした。"));
    };

    reader.onload = function (event) {
      const image = new Image();

      image.onerror = function () {
        reject(new Error("画像を表示できませんでした。"));
      };

      image.onload = function () {
        let width = image.width;
        let height = image.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(
            maxSize / width,
            maxSize / height
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("画像処理を開始できませんでした。"));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        resolve(
          canvas.toDataURL("image/jpeg", quality)
        );
      };

      image.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}


/* --------------------------------
   10種類を順番に生成
-------------------------------- */

generateButton.addEventListener("click", async function () {
  if (!selectedImageBase64) {
    showError("先に写真を選択してください。");
    return;
  }

  if (isGenerating) {
    return;
  }

  const confirmed = window.confirm(
    "10種類の画像を生成します。\n" +
    "OpenAI API料金も10回分発生します。\n\n" +
    "生成を開始しますか？"
  );

  if (!confirmed) {
    return;
  }

  isGenerating = true;
  generatedImages = [];

  clearError();
  resetResults();

  progressSection.classList.remove("hidden");
  resultSection.classList.remove("hidden");

  generateButton.disabled = true;
  generateButton.textContent = "10種類を生成中...";

  updateProgress(0, "イラスト生成を開始します。");

  for (let index = 0; index < illustrationStyles.length; index++) {
    const style = illustrationStyles[index];

    updateProgress(
      index,
      `${style.icon} ${style.name}を生成しています...`
    );

    const loadingCard = createLoadingCard(style);
    resultGrid.appendChild(loadingCard);

    try {
      const resultImage = await requestIllustration(style.key);

      generatedImages.push({
        styleKey: style.key,
        styleName: style.name,
        imageUrl: resultImage
      });

      replaceLoadingCardWithResult(
        loadingCard,
        style,
        resultImage
      );
    } catch (error) {
      replaceLoadingCardWithError(
        loadingCard,
        style,
        error.message
      );
    }

    updateProgress(
      index + 1,
      `${index + 1}種類の処理が完了しました。`
    );
  }

  finishGeneration();
});


/* --------------------------------
   APIへ送信
-------------------------------- */

async function requestIllustration(styleKey) {
  const response = await fetch("/api/illustrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      imageBase64: selectedImageBase64,
      style: styleKey
    })
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "サーバーから正しい応答を受け取れませんでした。"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.error ||
      `生成に失敗しました（${response.status}）`
    );
  }

  if (!data.resultImage) {
    throw new Error("生成画像が返されませんでした。");
  }

  return data.resultImage;
}


/* --------------------------------
   進捗表示
-------------------------------- */

function updateProgress(completedCount, message) {
  const total = illustrationStyles.length;
  const percentage = Math.round(
    (completedCount / total) * 100
  );

  progressMessage.textContent = message;
  progressCount.textContent = `${completedCount} / ${total}`;
  progressBar.style.width = `${percentage}%`;
}


/* --------------------------------
   生成中カード
-------------------------------- */

function createLoadingCard(style) {
  const card = document.createElement("article");
  card.className = "result-item loading-result";

  const title = document.createElement("h3");
  title.textContent = `${style.icon} ${style.name}`;

  const placeholder = document.createElement("div");
  placeholder.className = "result-placeholder";

  const spinner = document.createElement("div");
  spinner.className = "spinner";

  const text = document.createElement("p");
  text.textContent = "生成中...";

  placeholder.appendChild(spinner);
  placeholder.appendChild(text);

  card.appendChild(title);
  card.appendChild(placeholder);

  return card;
}


/* --------------------------------
   結果カード
-------------------------------- */

function replaceLoadingCardWithResult(
  card,
  style,
  imageUrl
) {
  card.className = "result-item";
  card.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = `${style.icon} ${style.name}`;

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${style.name}の生成結果`;
  image.loading = "lazy";

  const downloadLink = document.createElement("a");
  downloadLink.href = imageUrl;
  downloadLink.download =
    `photo-illustration-${style.key}.png`;
  downloadLink.className = "download-btn";
  downloadLink.textContent = "画像をダウンロード";

  card.appendChild(title);
  card.appendChild(image);
  card.appendChild(downloadLink);
}


/* --------------------------------
   失敗カード
-------------------------------- */

function replaceLoadingCardWithError(
  card,
  style,
  message
) {
  card.className = "result-item result-error";
  card.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = `${style.icon} ${style.name}`;

  const errorText = document.createElement("p");
  errorText.textContent = "生成に失敗しました。";

  const detail = document.createElement("small");
  detail.textContent = message;

  card.appendChild(title);
  card.appendChild(errorText);
  card.appendChild(detail);
}


/* --------------------------------
   生成完了
-------------------------------- */

function finishGeneration() {
  isGenerating = false;

  updateProgress(
    illustrationStyles.length,
    "すべての処理が完了しました。"
  );

  generateButton.disabled = false;
  generateButton.textContent = "10種類をもう一度生成";

  if (generatedImages.length > 0) {
    downloadAllButton.classList.remove("hidden");
  }

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* --------------------------------
   全画像ダウンロード
-------------------------------- */

downloadAllButton.addEventListener("click", async function () {
  if (generatedImages.length === 0) {
    showError("ダウンロードできる画像がありません。");
    return;
  }

  downloadAllButton.disabled = true;
  downloadAllButton.textContent = "ダウンロード中...";

  for (const image of generatedImages) {
    const link = document.createElement("a");

    link.href = image.imageUrl;
    link.download =
      `photo-illustration-${image.styleKey}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    await wait(500);
  }

  downloadAllButton.disabled = false;
  downloadAllButton.textContent = "すべてダウンロード";
});


function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}


/* --------------------------------
   表示リセット
-------------------------------- */

function resetResults() {
  generatedImages = [];

  resultGrid.innerHTML = "";
  resultSection.classList.add("hidden");
  progressSection.classList.add("hidden");
  downloadAllButton.classList.add("hidden");

  progressBar.style.width = "0%";
  progressCount.textContent =
    `0 / ${illustrationStyles.length}`;
}


/* --------------------------------
   エラー表示
-------------------------------- */

function showError(message) {
  errorMessage.textContent = message;
  errorSection.classList.remove("hidden");

  errorSection.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


function clearError() {
  errorMessage.textContent = "";
  errorSection.classList.add("hidden");
}