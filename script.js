const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const resultImage = document.getElementById("resultImage");
const generateButton = document.getElementById("generateButton");
const downloadBtn = document.getElementById("downloadBtn");


let selectedImageBase64 = "";

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    selectedImageBase64 = e.target.result;
    previewImage.src = selectedImageBase64;
    previewImage.style.display = "block";
  };

  reader.readAsDataURL(file);
});

generateButton.addEventListener("click", async function () {
  if (!selectedImageBase64) {
    alert("先に写真を選択してください。");
    return;
  }

  generateButton.textContent = "イラスト化中...";
  generateButton.disabled = true;

  try {
    const response = await fetch("/api/illustrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageBase64: selectedImageBase64
      })
    });

    const data = await response.json();

    if (data.resultImage) {
      resultImage.src = data.resultImage;
      resultImage.style.display = "block";
      downloadBtn.href = data.resultImage;
downloadBtn.style.display = "inline-block";
    } else {
      downloadBtn.style.display = "none";  
      alert((data.error || "イラスト化に失敗しました。") + "\n" + (data.detail || ""));
    }
  } catch (error) {
    alert("通信エラーが発生しました。");
  }

  generateButton.textContent = "イラスト化";
  generateButton.disabled = false;
});
