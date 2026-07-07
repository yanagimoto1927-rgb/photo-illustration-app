const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const generateButton = document.getElementById("generateButton");
const resultGrid = document.getElementById("resultGrid");
const loading = document.getElementById("loading");
const styleButtons = document.querySelectorAll(".style-btn");

let selectedImageBase64 = "";
let selectedStyle = "comic";

const styleNames = {
  comic: "漫画風",
  anime: "アニメ風",
  watercolor: "水彩画",
  oil: "油絵風",
  stamp: "LINEスタンプ風",
  chibi: "デフォルメ",
  pop: "ポップアート",
  pixel: "ピクセルアート",
  real: "リアルイラスト",
  pencil: "鉛筆画"
};

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    selectedImageBase64 = e.target.result;
    previewImage.src = selectedImageBase64;
    previewImage.style.display = "block";
    resultGrid.innerHTML = "";
  };

  reader.readAsDataURL(file);
});

styleButtons.forEach((button) => {
  button.addEventListener("click", function () {
    styleButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    selectedStyle = this.dataset.style;
  });
});

generateButton.addEventListener("click", async function () {
  if (!selectedImageBase64) {
    alert("先に写真を選択してください。");
    return;
  }

  loading.classList.remove("hidden");
  generateButton.disabled = true;
  generateButton.textContent = "生成中...";
  resultGrid.innerHTML = "";

  try {
    const response = await fetch("/api/illustrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageBase64: selectedImageBase64,
        style: selectedStyle
      })
    });

    const data = await response.json();

    if (!response.ok || !data.resultImage) {
      throw new Error(data.detail || data.error || "イラスト化に失敗しました。");
    }

    showResult(data.resultImage, styleNames[selectedStyle]);

  } catch (error) {
    alert("エラーが発生しました。\n" + error.message);
  } finally {
    loading.classList.add("hidden");
    generateButton.disabled = false;
    generateButton.textContent = "選んだスタイルで生成";
  }
});

function showResult(imageUrl, title) {
  const item = document.createElement("div");
  item.className = "result-item";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = title;

  const download = document.createElement("a");
  download.href = imageUrl;
  download.download = `${title}.png`;
  download.className = "download-btn";
  download.textContent = "📥 ダウンロード";

  item.appendChild(heading);
  item.appendChild(img);
  item.appendChild(download);

  resultGrid.appendChild(item);
}