// -------------------------------------------------------------
// Navigation
// -------------------------------------------------------------
function switchTab(tabId, sourceEl) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.nav-link').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById(tabId).classList.add('active');
  if (sourceEl) sourceEl.classList.add('active');

  // Close the mobile drawer after a selection
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('mobileToggle');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
}

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
});

// Toast Helper Function
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// -------------------------------------------------------------
// SECTION 1: Text Repeater
// -------------------------------------------------------------
function generateRepeatedText() {
  const text = document.getElementById('repeatText').value;
  const count = parseInt(document.getElementById('repeatCount').value, 10);
  const addNewline = document.getElementById('addNewline').checked;

  if (!text) {
    showToast('Enter some text to repeat.');
    return;
  }
  if (!Number.isFinite(count) || count < 1) {
    showToast('Enter a repeat count of 1 or more.');
    return;
  }

  const separator = addNewline ? '\n' : ' ';
  let result = '';

  for (let i = 0; i < count; i++) {
    result += text + (i === count - 1 ? '' : separator);
  }

  document.getElementById('repeatOutput').value = result;
  showToast(`Repeated ${count} times.`);
}

function copyRepeatedText() {
  const output = document.getElementById('repeatOutput');
  if (!output.value) return;

  output.select();
  navigator.clipboard.writeText(output.value);
  showToast('Copied to clipboard.');
}

// -------------------------------------------------------------
// SECTION 2: Custom Link Generator & Decoder
// -------------------------------------------------------------
function generateSecretLink() {
  const text = document.getElementById('secretText').value;
  if (!text) {
    showToast('Enter text to turn into a link.');
    return;
  }

  // Base64 encode the string to form a custom URI link
  const encodedText = btoa(encodeURIComponent(text));
  const dummyLink = `omni://decode?data=${encodedText}`;

  document.getElementById('generatedLink').value = dummyLink;
  showToast('Link created.');
}

function copyGeneratedLink() {
  const linkInput = document.getElementById('generatedLink');
  if (!linkInput.value) return;

  linkInput.select();
  navigator.clipboard.writeText(linkInput.value);
  showToast('Link copied.');
}

function decodeSecretLink() {
  const inputLink = document.getElementById('inputLinkToDecode').value.trim();
  const outputDiv = document.getElementById('decodedOutput');

  if (!inputLink) {
    showToast('Paste a link first.');
    return;
  }

  try {
    const urlParams = new URLSearchParams(inputLink.split('?')[1]);
    const data = urlParams.get('data');

    if (!data) throw new Error();

    const decodedText = decodeURIComponent(atob(data));
    outputDiv.style.display = 'block';
    outputDiv.style.color = '';
    outputDiv.innerText = `Decoded content: "${decodedText}"`;
    showToast('Text revealed.');
  } catch (err) {
    outputDiv.style.display = 'block';
    outputDiv.innerText = 'Invalid link format.';
    outputDiv.style.color = '#f87171';
  }
}

// -------------------------------------------------------------
// SECTION 3: Password Protected QR Code Studio
// -------------------------------------------------------------
let qrcodeInstance = null;

function generateEncryptedQR() {
  const text = document.getElementById('qrText').value;
  const password = document.getElementById('qrPass').value;
  const qrContainer = document.getElementById('qrcode');

  if (!text || !password) {
    showToast('Enter both text and a password.');
    return;
  }

  // AES Encryption
  const encryptedData = CryptoJS.AES.encrypt(text, password).toString();

  // Clear previous QR code
  qrContainer.innerHTML = '';

  qrcodeInstance = new QRCode(qrContainer, {
    text: encryptedData,
    width: 160,
    height: 160,
    colorDark: '#12161f',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  const downloadBtn = document.getElementById('downloadQrBtn');
  if (downloadBtn) downloadBtn.disabled = false;

  showToast('Encrypted QR code generated.');
}

function downloadQRCode() {
  const qrContainer = document.getElementById('qrcode');
  // QRCode.js renders both a <canvas> and an <img> inside the container;
  // the canvas gives the most reliable data URL across browsers.
  const canvas = qrContainer.querySelector('canvas');
  const img = qrContainer.querySelector('img');

  let dataUrl = null;
  if (canvas) {
    dataUrl = canvas.toDataURL('image/png');
  } else if (img && img.src) {
    dataUrl = img.src;
  }

  if (!dataUrl) {
    showToast('Generate a QR code first.');
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'omniutils-encrypted-qr.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('QR code downloaded.');
}

function decryptUploadedQR() {
  const fileInput = document.getElementById('qrFileInput');
  const password = document.getElementById('qrDecryptPass').value;
  const resultDisplay = document.getElementById('qrDecryptedResult');

  if (fileInput.files.length === 0) {
    showToast('Upload a QR code image.');
    return;
  }
  if (!password) {
    showToast('Enter the decryption password.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          // AES Decryption
          const decryptedBytes = CryptoJS.AES.decrypt(code.data, password);
          const originalText = decryptedBytes.toString(CryptoJS.enc.Utf8);

          if (originalText) {
            resultDisplay.innerText = originalText;
            resultDisplay.style.color = '#a7f3d0';
            showToast('Decrypted successfully.');
          } else {
            throw new Error();
          }
        } catch (err) {
          resultDisplay.innerText = 'Incorrect password, or the data is unreadable.';
          resultDisplay.style.color = '#f87171';
        }
      } else {
        resultDisplay.innerText = 'No valid QR code detected in the image.';
        resultDisplay.style.color = '#f87171';
      }
    };
  };

  reader.readAsDataURL(file);
}
