document.addEventListener('DOMContentLoaded', () => {
  const shareButton = document.querySelector('.share-button');
  const copyLinkButton = document.querySelector('.copy-link');
  const recipeTitle = document.querySelector('h1').textContent;
  const recipeUrl = window.location.href;

  // Native Web Share API
  if (navigator.share) {
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: recipeTitle,
          url: recipeUrl
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    });
  }

  // Copy link functionality
  copyLinkButton.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(recipeUrl).then(() => {
      alert('Recipe link copied!');
    });
  });

  // QR Code Generation
  function generateQRCode() {
    const qrCodeEl = document.querySelector('.qr-code');
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(recipeUrl)}`;
    qrCodeEl.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code for ${recipeTitle}">`;
  }

  generateQRCode();
});