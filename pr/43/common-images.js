/*
============================================================================
Shared user-image loading and lifecycle
============================================================================
*/

const USER_IMAGE_PURPOSES = new Set([
  MAIN_ART,
  NEMESIS_ICON,
  BACKGROUND_ART,
  FOREGROUND_ART,
  NAME_LOGO,
  BACK_TOP_ART,
  BACK_LEFT_ART,
  BACK_RIGHT_ART,
  BACK_BOTTOM_ART
]);

const JSON_USER_IMAGE_PURPOSES = new Set([
  MAIN_ART,
  NEMESIS_ICON,
  BACKGROUND_ART,
  FOREGROUND_ART,
  NAME_LOGO
]);

// 64 megapixels is far above the card canvas resolution while still bounding
// the decoded-memory cost of unexpectedly large or malicious images.
const MAX_USER_IMAGE_PIXELS = 64 * 1024 * 1024;

const userImageSources = Object.create(null);
const userImageGenerations = Object.create(null);
const ownedUserImageObjectURLs = Object.create(null);

function getImageInputForPurpose(purpose) {
  return Array.from(document.querySelectorAll('input[type="file"][data-image-purpose]'))
    .find(input => input.dataset.imagePurpose === purpose) || null;
}

function isImagePurposeAvailable(purpose) {
  return USER_IMAGE_PURPOSES.has(purpose) && getImageInputForPurpose(purpose) !== null;
}

function isJSONImagePurposeAvailable(purpose) {
  return JSON_USER_IMAGE_PURPOSES.has(purpose) && isImagePurposeAvailable(purpose);
}

function nextUserImageGeneration(purpose) {
  const nextGeneration = (userImageGenerations[purpose] || 0) + 1;
  userImageGenerations[purpose] = nextGeneration;
  window.dispatchEvent(new CustomEvent('userimagegenerationchange', {
    detail: { purpose: purpose, generation: nextGeneration }
  }));
  return nextGeneration;
}

function isCurrentUserImageGeneration(purpose, generation) {
  return userImageGenerations[purpose] === generation;
}

function setImageSourceStatus(purpose, message, isError = false) {
  document.querySelectorAll('.imageSourceStatus[data-image-purpose]').forEach(status => {
    if (status.dataset.imagePurpose === purpose) {
      status.textContent = message || '';
      status.classList.toggle('imageSourceStatusError', Boolean(isError));
    }
  });
}

function getRenderedUserImage(purpose) {
  if (purpose === MAIN_ART) {
    return window.cardArtImage || null;
  }
  return loadedUserImages[purpose] || null;
}

function setRenderedUserImage(purpose, image) {
  if (purpose === MAIN_ART) {
    window.cardArtImage = image;
  } else {
    loadedUserImages[purpose] = image;
  }
}

function redrawAfterUserImageChange() {
  if (typeof drawCardCanvas === 'function') {
    drawCardCanvas();
  }
}

function revokeOwnedUserImageURL(purpose, exceptURL = '') {
  const oldURL = ownedUserImageObjectURLs[purpose];
  if (oldURL && oldURL !== exceptURL) {
    URL.revokeObjectURL(oldURL);
    delete ownedUserImageObjectURLs[purpose];
  }
}

function validateDecodedUserImage(image) {
  const width = Number(image.naturalWidth || image.width);
  const height = Number(image.naturalHeight || image.height);
  const pixels = width * height;
  if (!width || !height || !Number.isFinite(pixels)) {
    throw new Error('The selected file could not be decoded as an image.');
  }
  if (pixels > MAX_USER_IMAGE_PIXELS) {
    throw new Error('The selected image dimensions are too large.');
  }
}

function decodeUserImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(url)) {
      image.crossOrigin = 'Anonymous';
    }
    image.onload = function () {
      try {
        validateDecodedUserImage(image);
        resolve(image);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = function () {
      reject(new Error('The selected file could not be decoded as an image.'));
    };
    image.src = url;
  });
}

async function replaceUserImageFromURL(purpose, url, source, options = {}) {
  if (!isImagePurposeAvailable(purpose)) {
    throw new Error('This image slot is not available on the current card.');
  }

  const generation = options.generation || nextUserImageGeneration(purpose);
  const ownsURL = Boolean(options.ownsURL);
  const loadingMessage = options.loadingMessage || 'Loading image…';
  setImageSourceStatus(purpose, loadingMessage);

  try {
    const decodedImage = await decodeUserImage(url);
    if (!isCurrentUserImageGeneration(purpose, generation)) {
      if (ownsURL) {
        URL.revokeObjectURL(url);
      }
      return { applied: false, stale: true };
    }

    const previousOwnedURL = ownedUserImageObjectURLs[purpose] || '';
    setRenderedUserImage(purpose, decodedImage);
    userImageSources[purpose] = Object.assign({}, source);

    if (ownsURL) {
      ownedUserImageObjectURLs[purpose] = url;
    } else {
      delete ownedUserImageObjectURLs[purpose];
    }

    if (options.clearFileInput) {
      const fileInput = getImageInputForPurpose(purpose);
      if (fileInput) {
        fileInput.value = '';
      }
    }

    if (previousOwnedURL && previousOwnedURL !== url) {
      URL.revokeObjectURL(previousOwnedURL);
    }

    setImageSourceStatus(purpose, options.successMessage || '');
    redrawAfterUserImageChange();
    return { applied: true, stale: false };
  } catch (error) {
    if (ownsURL) {
      URL.revokeObjectURL(url);
    }
    if (isCurrentUserImageGeneration(purpose, generation)) {
      setImageSourceStatus(purpose, error.message, true);
    }
    throw error;
  }
}

async function loadLocalUserImage(purpose, file) {
  if (!file || !file.type || !file.type.toLowerCase().startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  const generation = nextUserImageGeneration(purpose);
  const objectURL = URL.createObjectURL(file);
  return replaceUserImageFromURL(
    purpose,
    objectURL,
    {
      type: 'local-file',
      name: file.name || '',
      mimeType: file.type || ''
    },
    {
      generation,
      ownsURL: true,
      loadingMessage: 'Loading ' + (file.name || 'local image') + '…',
      successMessage: 'Using ' + (file.name || 'local image') + ' from this device'
    }
  );
}

async function loadLegacyUserImageURL(purpose, url) {
  const generation = nextUserImageGeneration(purpose);
  return replaceUserImageFromURL(
    purpose,
    url,
    { type: 'url', url: url },
    {
      generation,
      ownsURL: false,
      loadingMessage: 'Loading image from URL…',
      successMessage: 'Using image from URL'
    }
  );
}

function clearUserImage(purpose, options = {}) {
  if (!USER_IMAGE_PURPOSES.has(purpose)) {
    return;
  }
  nextUserImageGeneration(purpose);
  setRenderedUserImage(purpose, null);
  delete userImageSources[purpose];
  revokeOwnedUserImageURL(purpose);

  if (options.clearFileInput !== false) {
    const fileInput = getImageInputForPurpose(purpose);
    if (fileInput) {
      fileInput.value = '';
    }
  }
  setImageSourceStatus(purpose, options.statusMessage || '');
  if (options.redraw !== false) {
    redrawAfterUserImageChange();
  }
}

function setUnavailableLocalImageSource(purpose, source) {
  if (!isJSONImagePurposeAvailable(purpose)) {
    return;
  }
  clearUserImage(purpose, {
    redraw: false,
    statusMessage: 'Reselect ' + (source.name || 'the local image') + ' from this device'
  });
  userImageSources[purpose] = {
    type: 'local-file',
    name: typeof source.name === 'string' ? source.name : '',
    mimeType: typeof source.mimeType === 'string' ? source.mimeType : ''
  };
}

function getUserImageSource(purpose) {
  return Object.prototype.hasOwnProperty.call(userImageSources, purpose)
    ? userImageSources[purpose]
    : null;
}

function serializeUserImageSources() {
  const serialized = {};
  Object.keys(userImageSources).forEach(purpose => {
    if (!isJSONImagePurposeAvailable(purpose)) {
      return;
    }
    const source = userImageSources[purpose];
    if (source.type === 'google-drive') {
      serialized[purpose] = {
        type: 'google-drive',
        fileId: source.fileId,
        name: source.name || '',
        mimeType: source.mimeType || ''
      };
      if (source.resourceKey) {
        serialized[purpose].resourceKey = source.resourceKey;
      }
    } else if (source.type === 'local-file') {
      serialized[purpose] = {
        type: 'local-file',
        name: source.name || '',
        mimeType: source.mimeType || ''
      };
    }
  });
  return serialized;
}

document.querySelectorAll('input[type="file"][data-image-purpose]').forEach(input => {
  input.addEventListener('input', function () {
    const file = this.files && this.files[0];
    if (!file) {
      return;
    }
    loadLocalUserImage(this.dataset.imagePurpose, file).catch(() => {
      // The shared status element already contains the actionable error.
    });
  });
});
