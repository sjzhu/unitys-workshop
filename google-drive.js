/* Google Drive image selection and OAuth lifecycle. */
(function () {
  'use strict';

  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const DRIVE_MIME_TYPE_LIST = Array.from(DRIVE_MIME_TYPES).join(',');
  const MAX_DRIVE_IMAGE_BYTES = 50 * 1024 * 1024;
  const FALLBACK_TOKEN_LIFETIME_SECONDS = 300;
  const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

  let tokenClient = null;
  let oauthClientId = '';
  let accessToken = '';
  let accessTokenExpiresAt = 0;
  let tokenEpoch = 0;
  let tokenRequestPromise = null;
  let nextTokenAttemptId = 1;
  let activeTokenAttemptId = 0;
  let pickerSessionPromise = null;
  let pendingDriveImport = [];
  let nextRetryId = 1;
  const authorizationRetryQueue = new Map();
  let reconnectInProgress = false;
  let driveReady = false;
  let driveReadyError = null;

  class DriveAuthorizationExpiredError extends Error {
    constructor(epoch) {
      super('Google Drive authorization expired.');
      this.name = 'DriveAuthorizationExpiredError';
      this.epoch = epoch;
    }
  }

  function getConfig() { return window.GOOGLE_DRIVE_CONFIG || null; }

  function validateConfig(config) {
    if (!config || typeof config !== 'object') return 'Google Drive configuration is unavailable.';
    if (typeof config.apiKey !== 'string' || !config.apiKey || config.apiKey.includes('YOUR_')) {
      return 'Google Drive API key is not configured.';
    }
    if (typeof config.clientId !== 'string' ||
        !config.clientId.endsWith('.apps.googleusercontent.com') || config.clientId.includes('YOUR_')) {
      return 'Google OAuth client ID is not configured.';
    }
    if (typeof config.appId !== 'string' || !/^\d+$/.test(config.appId) || config.appId.includes('YOUR_')) {
      return 'Google Picker app ID is not configured.';
    }
    return '';
  }

  function describePurpose(input) {
    const label = input.previousElementSibling;
    if (label && label.tagName === 'LABEL') return label.textContent.trim();
    return input.dataset.imagePurpose.replace(/([A-Z])/g, ' $1').trim();
  }

  function createDriveControls() {
    document.querySelectorAll('input[type="file"][data-image-purpose]').forEach(input => {
      const purpose = input.dataset.imagePurpose;
      if (document.querySelector('.googleDriveImageButton[data-image-purpose="' + purpose + '"]')) return;
      const controls = document.createElement('div');
      controls.className = 'googleDriveImageControls';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'googleDriveImageButton';
      button.dataset.imagePurpose = purpose;
      button.disabled = true;
      button.textContent = 'Choose from Google Drive';
      button.setAttribute('aria-label', 'Choose ' + describePurpose(input) + ' from Google Drive');
      const status = document.createElement('span');
      status.className = 'imageSourceStatus';
      status.dataset.imagePurpose = purpose;
      status.setAttribute('aria-live', 'polite');
      status.textContent = 'Loading Google Drive…';
      controls.appendChild(button);
      controls.appendChild(status);
      input.insertAdjacentElement('afterend', controls);
      button.addEventListener('click', function () { chooseDriveImage(purpose, button); });
    });
  }

  function setAllDriveControls(message, isError, enabled) {
    document.querySelectorAll('.googleDriveImageButton').forEach(button => { button.disabled = !enabled; });
    document.querySelectorAll('.imageSourceStatus').forEach(status => {
      if (!getUserImageSource(status.dataset.imagePurpose)) {
        status.textContent = message || '';
        status.classList.toggle('imageSourceStatusError', Boolean(isError));
      }
    });
  }

  function loadExternalScript(src, readyTest) {
    if (readyTest()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let script = document.querySelector('script[src="' + src + '"]');
      const onLoad = function () {
        readyTest() ? resolve() : reject(new Error('A Google library loaded without its expected API.'));
      };
      const onError = function () { reject(new Error('A Google library could not be loaded.')); };
      if (script) {
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
        return;
      }
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    });
  }

  function loadPickerLibrary() {
    return new Promise((resolve, reject) => {
      if (window.google && google.picker) { resolve(); return; }
      if (!window.gapi || typeof gapi.load !== 'function') {
        reject(new Error('Google API loader is unavailable.')); return;
      }
      gapi.load('picker', {
        callback: function () {
          window.google && google.picker ? resolve() : reject(new Error('Google Picker did not initialize.'));
        },
        onerror: function () { reject(new Error('Google Picker could not be loaded.')); },
        timeout: 15000,
        ontimeout: function () { reject(new Error('Google Picker loading timed out.')); }
      });
    });
  }

  function initializeTokenClient(config) {
    oauthClientId = config.clientId;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: DRIVE_SCOPE,
      include_granted_scopes: false,
      callback: function () {},
      error_callback: function () {}
    });
  }

  function initializeGoogleDrive() {
    createDriveControls();
    const config = getConfig();
    const configError = validateConfig(config);
    if (configError) {
      driveReadyError = new Error(configError);
      setAllDriveControls(configError, true, false);
      return Promise.reject(driveReadyError);
    }
    const gisPromise = loadExternalScript('https://accounts.google.com/gsi/client', function () {
      return Boolean(window.google && google.accounts && google.accounts.oauth2);
    });
    const gapiPromise = loadExternalScript('https://apis.google.com/js/api.js', function () {
      return Boolean(window.gapi && typeof gapi.load === 'function');
    }).then(loadPickerLibrary);
    return Promise.all([gisPromise, gapiPromise]).then(function () {
      initializeTokenClient(config);
      driveReady = true;
      setAllDriveControls('', false, true);
      updatePendingImportButton();
    }).catch(function (error) {
      driveReadyError = error;
      setAllDriveControls(error.message, true, false);
      updatePendingImportButton();
      throw error;
    });
  }

  const driveReadyPromise = initializeGoogleDrive();
  driveReadyPromise.catch(function () {});

  function hasUsableAccessToken() {
    return Boolean(accessToken) && Date.now() < accessTokenExpiresAt - 30000;
  }
  function getTokenSnapshot() { return { token: accessToken, epoch: tokenEpoch }; }
  function clearAuthorizationAtEpoch(expectedEpoch) {
    if (tokenEpoch !== expectedEpoch) return false;
    accessToken = '';
    accessTokenExpiresAt = 0;
    tokenEpoch += 1;
    return true;
  }

  function requestDriveAccess(forceRefresh) {
    if (!forceRefresh && hasUsableAccessToken()) return Promise.resolve(getTokenSnapshot());
    if (!driveReady || !tokenClient) {
      return Promise.reject(driveReadyError || new Error('Google Drive is still loading.'));
    }
    if (tokenRequestPromise) return tokenRequestPromise;

    const attemptId = nextTokenAttemptId++;
    const startingEpoch = tokenEpoch;
    activeTokenAttemptId = attemptId;
    tokenRequestPromise = new Promise((resolve, reject) => {
      let settled = false;
      function settle(success, value) {
        if (settled) return;
        settled = true;
        const ownsAttempt = activeTokenAttemptId === attemptId;
        if (ownsAttempt) activeTokenAttemptId = 0;
        if (success) resolve(value);
        else {
          if (ownsAttempt) clearAuthorizationAtEpoch(startingEpoch);
          reject(value);
        }
      }

      const tokenCallback = function (response) {
        if (settled || activeTokenAttemptId !== attemptId) return;
        if (!response || response.error) {
          settle(false, new Error('Google authorization was denied or could not be completed.'));
          return;
        }
        try {
          const oauth2 = window.google && google.accounts && google.accounts.oauth2;
          if (!oauth2 || typeof oauth2.hasGrantedAllScopes !== 'function') {
            throw new Error('Google authorization scope validation is unavailable.');
          }
          if (oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE) !== true) {
            throw new Error('Google Drive file access was not granted.');
          }
          if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
            throw new Error('Google authorization did not return an access token.');
          }
          if (tokenEpoch !== startingEpoch || activeTokenAttemptId !== attemptId) {
            settle(false, new Error('Google authorization was superseded by a newer request.'));
            return;
          }
          const parsedExpiresIn = Number(response.expires_in);
          const expiresIn = Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0
            ? parsedExpiresIn : FALLBACK_TOKEN_LIFETIME_SECONDS;
          accessToken = response.access_token.trim();
          accessTokenExpiresAt = Date.now() + expiresIn * 1000;
          tokenEpoch += 1;
          settle(true, getTokenSnapshot());
        } catch (error) {
          settle(false, error instanceof Error ? error : new Error('Google authorization response validation failed.'));
        }
      };
      const tokenErrorCallback = function (error) {
        const type = error && typeof error.type === 'string' ? error.type : 'popup_failed_to_open';
        const messages = {
          popup_closed: 'Google authorization was closed before it finished.',
          popup_failed_to_open: 'Google authorization could not open. Allow popups and try again.',
          unknown: 'Google authorization could not be completed.'
        };
        settle(false, new Error(messages[type] || messages.unknown));
      };
      try {
        // Use a request-owned client so a late callback from an older popup
        // retains that older attempt's immutable callback/epoch closure.
        const attemptClient = google.accounts.oauth2.initTokenClient({
          client_id: oauthClientId,
          scope: DRIVE_SCOPE,
          include_granted_scopes: false,
          callback: tokenCallback,
          error_callback: tokenErrorCallback
        });
        attemptClient.requestAccessToken({ prompt: '', include_granted_scopes: false });
      } catch (error) {
        settle(false, new Error('Google authorization could not be started.'));
      }
    });
    const sharedPromise = tokenRequestPromise;
    sharedPromise.finally(function () {
      if (tokenRequestPromise === sharedPromise) tokenRequestPromise = null;
    }).catch(function () {});
    return sharedPromise;
  }

  function normalizeDriveSource(source) {
    if (!source || typeof source !== 'object') throw new Error('Google Drive image information is malformed.');
    if (typeof source.fileId !== 'string' || !DRIVE_ID_PATTERN.test(source.fileId)) {
      throw new Error('Google Drive file ID is invalid.');
    }
    if (source.resourceKey !== undefined && source.resourceKey !== '' &&
        (typeof source.resourceKey !== 'string' || !DRIVE_ID_PATTERN.test(source.resourceKey))) {
      throw new Error('Google Drive resource key is invalid.');
    }
    return {
      type: 'google-drive', fileId: source.fileId, resourceKey: source.resourceKey || '',
      name: typeof source.name === 'string' ? source.name : '',
      mimeType: typeof source.mimeType === 'string' ? source.mimeType : ''
    };
  }

  function openPicker(token) {
    if (pickerSessionPromise) return Promise.reject(new Error('Google Picker is already open.'));
    pickerSessionPromise = new Promise((resolve, reject) => {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
      view.setIncludeFolders(true);
      view.setSelectFolderEnabled(false);
      view.setMimeTypes(DRIVE_MIME_TYPE_LIST);
      view.setMode(google.picker.DocsViewMode.LIST);
      const picker = new google.picker.PickerBuilder().addView(view)
        .setSelectableMimeTypes(DRIVE_MIME_TYPE_LIST).setDeveloperKey(getConfig().apiKey)
        .setOAuthToken(token).setAppId(getConfig().appId).setOrigin(window.location.origin)
        .setCallback(function (data) {
          const action = data[google.picker.Response.ACTION];
          if (action === google.picker.Action.PICKED) {
            const info = data[google.picker.Response.DOCUMENTS][0];
            const resourceKeyProperty = google.picker.Document.RESOURCE_KEY;
            resolve(normalizeDriveSource({
              fileId: info[google.picker.Document.ID],
              resourceKey: (resourceKeyProperty && info[resourceKeyProperty]) || info.resourceKey || '',
              name: info[google.picker.Document.NAME] || '',
              mimeType: info[google.picker.Document.MIME_TYPE] || ''
            }));
          } else if (action === google.picker.Action.CANCEL) resolve(null);
          else if (action === google.picker.Action.ERROR) reject(new Error('Google Picker reported an error.'));
        }).build();
      picker.setVisible(true);
    }).finally(function () { pickerSessionPromise = null; });
    return pickerSessionPromise;
  }

  function normalizeResponseMimeType(response) {
    return (response.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  }
  async function readBoundedDriveBlob(response) {
    const mimeType = normalizeResponseMimeType(response);
    if (!DRIVE_MIME_TYPES.has(mimeType)) throw new Error('Google Drive returned an unsupported image type.');
    const declaredLength = Number(response.headers.get('Content-Length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_DRIVE_IMAGE_BYTES) {
      throw new Error('The Google Drive image is larger than 50 MiB.');
    }
    if (!response.body || typeof response.body.getReader !== 'function') {
      throw new Error('This browser cannot safely download bounded Drive images.');
    }
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        received += result.value.byteLength;
        if (received > MAX_DRIVE_IMAGE_BYTES) {
          await reader.cancel();
          throw new Error('The Google Drive image is larger than 50 MiB.');
        }
        chunks.push(result.value);
      }
    } finally { reader.releaseLock(); }
    return new Blob(chunks, { type: mimeType });
  }

  async function fetchDriveImage(source, tokenSnapshot, allowNewerTokenRetry) {
    const headers = new Headers({ Authorization: 'Bearer ' + tokenSnapshot.token });
    if (source.resourceKey) {
      headers.set('X-Goog-Drive-Resource-Keys', source.fileId + '/' + source.resourceKey);
    }
    const url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(source.fileId) +
      '?alt=media&supportsAllDrives=true';
    const response = await fetch(url, { headers: headers });
    if (response.status === 401) {
      if (allowNewerTokenRetry && tokenEpoch !== tokenSnapshot.epoch && hasUsableAccessToken()) {
        return fetchDriveImage(source, getTokenSnapshot(), false);
      }
      clearAuthorizationAtEpoch(tokenSnapshot.epoch);
      throw new DriveAuthorizationExpiredError(tokenSnapshot.epoch);
    }
    if (response.status === 403 || response.status === 404) {
      throw new Error('Google Drive could not access this file. Choose it again through Google Picker.');
    }
    if (!response.ok) throw new Error('Google Drive download failed (' + response.status + ').');
    return readBoundedDriveBlob(response);
  }

  function isRetryEntryCurrent(entry) {
    return isCurrentUserImageGeneration(entry.purpose, entry.generation) &&
      authorizationRetryQueue.get(entry.purpose) === entry;
  }
  async function loadDriveSource(purpose, rawSource, generation, tokenSnapshot, retryEntry) {
    const source = normalizeDriveSource(rawSource);
    if (!isImagePurposeAvailable(purpose)) throw new Error('This image slot is not available on the current card.');
    if (!isCurrentUserImageGeneration(purpose, generation)) return { applied: false, stale: true };
    setImageSourceStatus(purpose, 'Downloading ' + (source.name || 'image') + ' from Google Drive…');
    const blob = await fetchDriveImage(source, tokenSnapshot, true);
    if (!isCurrentUserImageGeneration(purpose, generation) || (retryEntry && !isRetryEntryCurrent(retryEntry))) {
      return { applied: false, stale: true };
    }
    source.mimeType = blob.type;
    return replaceUserImageFromURL(purpose, URL.createObjectURL(blob), source, {
      generation: generation, ownsURL: true, clearFileInput: true,
      loadingMessage: 'Decoding ' + (source.name || 'Google Drive image') + '…',
      successMessage: 'Using ' + (source.name || 'image') + ' from Google Drive'
    });
  }

  function createRetryEntry(entry) {
    return Object.freeze({ retryId: nextRetryId++, purpose: entry.purpose,
      source: normalizeDriveSource(entry.source), generation: entry.generation });
  }
  function queueAuthorizationRetry(entry) {
    if (!isCurrentUserImageGeneration(entry.purpose, entry.generation)) return;
    const retryEntry = entry.retryId ? entry : createRetryEntry(entry);
    authorizationRetryQueue.set(retryEntry.purpose, retryEntry);
    setImageSourceStatus(retryEntry.purpose, 'Google Drive authorization expired. Reconnect to retry.', true);
    updateReconnectControl();
  }
  function removeRetryEntry(entry) {
    if (authorizationRetryQueue.get(entry.purpose) === entry) authorizationRetryQueue.delete(entry.purpose);
    updateReconnectControl();
  }

  async function loadDriveSourceRecords(entries) {
    const active = entries.filter(entry => isCurrentUserImageGeneration(entry.purpose, entry.generation));
    if (!active.length) return [];
    let tokenSnapshot;
    try { tokenSnapshot = await requestDriveAccess(false); }
    catch (error) {
      return active.map(entry => ({ entry: entry, result: { status: 'rejected', reason: error } }));
    }
    return Promise.all(active.map(async entry => {
      try {
        const value = await loadDriveSource(entry.purpose, entry.source, entry.generation, tokenSnapshot);
        return { entry: entry, result: { status: 'fulfilled', value: value } };
      } catch (error) {
        if (error instanceof DriveAuthorizationExpiredError) queueAuthorizationRetry(entry);
        else if (isCurrentUserImageGeneration(entry.purpose, entry.generation)) {
          setImageSourceStatus(entry.purpose, error.message, true);
        }
        return { entry: entry, result: { status: 'rejected', reason: error } };
      }
    }));
  }

  async function chooseDriveImage(purpose, button) {
    if (!driveReady) {
      setImageSourceStatus(purpose, driveReadyError ? driveReadyError.message : 'Google Drive is still loading.',
        Boolean(driveReadyError));
      return;
    }
    const status = document.querySelector('.imageSourceStatus[data-image-purpose="' + purpose + '"]');
    const previousText = status ? status.textContent : '';
    const previousError = status ? status.classList.contains('imageSourceStatusError') : false;
    const generation = nextUserImageGeneration(purpose);
    button.disabled = true;
    try {
      const tokenSnapshot = await requestDriveAccess(false);
      const source = await openPicker(tokenSnapshot.token);
      if (!source) {
        if (isCurrentUserImageGeneration(purpose, generation)) {
          setImageSourceStatus(purpose, previousText, previousError);
        }
        return;
      }
      try { await loadDriveSource(purpose, source, generation, tokenSnapshot); }
      catch (error) {
        if (error instanceof DriveAuthorizationExpiredError) {
          queueAuthorizationRetry({ purpose: purpose, source: source, generation: generation });
          return;
        }
        throw error;
      }
    } catch (error) {
      if (isCurrentUserImageGeneration(purpose, generation)) setImageSourceStatus(purpose, error.message, true);
    } finally { button.disabled = !driveReady; button.focus(); }
  }

  function ensurePendingImportButton() {
    let button = document.getElementById('continueDriveImportButton');
    if (button) return button;
    const jsonInput = document.getElementById('jsonInput');
    if (!jsonInput) return null;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'continueDriveImportButton';
    button.textContent = 'Continue Drive import';
    button.hidden = true;
    button.disabled = true;
    button.addEventListener('click', async function () {
      const entries = pendingDriveImport;
      pendingDriveImport = [];
      updatePendingImportButton();
      button.disabled = true;
      try { await loadDriveSourceRecords(entries); } finally { updatePendingImportButton(); }
    });
    jsonInput.insertAdjacentElement('afterend', button);
    return button;
  }
  function updatePendingImportButton() {
    const button = ensurePendingImportButton();
    if (!button) return;
    button.hidden = pendingDriveImport.length === 0;
    button.disabled = !driveReady || pendingDriveImport.length === 0;
    button.title = driveReadyError ? driveReadyError.message : '';
  }
  function queueDriveSourceRecords(entries) {
    pendingDriveImport = entries.filter(entry => isCurrentUserImageGeneration(entry.purpose, entry.generation));
    updatePendingImportButton();
  }

  function ensureReconnectControl() {
    let button = document.getElementById('reconnectGoogleDriveButton');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'reconnectGoogleDriveButton';
    button.textContent = 'Reconnect to Google Drive and retry';
    button.addEventListener('click', reconnectAndRetry);
    const anchor = document.getElementById('jsonInput') || document.querySelector('.googleDriveImageControls');
    if (anchor) anchor.insertAdjacentElement('afterend', button);
    return button;
  }
  function updateReconnectControl() {
    Array.from(authorizationRetryQueue.entries()).forEach(([purpose, entry]) => {
      if (!isCurrentUserImageGeneration(purpose, entry.generation)) authorizationRetryQueue.delete(purpose);
    });
    const existing = document.getElementById('reconnectGoogleDriveButton');
    if (!authorizationRetryQueue.size) { if (existing) existing.remove(); return; }
    ensureReconnectControl().disabled = reconnectInProgress;
  }
  async function reconnectAndRetry() {
    const button = document.getElementById('reconnectGoogleDriveButton');
    if (!button || !authorizationRetryQueue.size || reconnectInProgress) return;
    reconnectInProgress = true;
    button.disabled = true;
    try {
      let tokenSnapshot;
      try { tokenSnapshot = await requestDriveAccess(true); }
      catch (error) {
        authorizationRetryQueue.forEach(entry => {
          if (isCurrentUserImageGeneration(entry.purpose, entry.generation)) {
            setImageSourceStatus(entry.purpose, error.message, true);
          }
        });
        return;
      }
      const snapshot = Array.from(authorizationRetryQueue.values()).filter(isRetryEntryCurrent);
      await Promise.all(snapshot.map(async entry => {
        try {
          const result = await loadDriveSource(entry.purpose, entry.source, entry.generation,
            tokenSnapshot, entry);
          if (!result.stale) removeRetryEntry(entry);
        } catch (error) {
          if (error instanceof DriveAuthorizationExpiredError) {
            if (isRetryEntryCurrent(entry)) {
              setImageSourceStatus(entry.purpose,
                'Google Drive authorization expired again. Reconnect to retry.', true);
            }
          } else {
            removeRetryEntry(entry);
            if (isCurrentUserImageGeneration(entry.purpose, entry.generation)) {
              setImageSourceStatus(entry.purpose, error.message, true);
            }
          }
        }
      }));
    } finally {
      reconnectInProgress = false;
      updateReconnectControl();
    }
  }

  window.addEventListener('userimagegenerationchange', function (event) {
    const detail = event.detail || {};
    if (typeof detail.purpose !== 'string') return;
    pendingDriveImport = pendingDriveImport.filter(entry =>
      entry.purpose !== detail.purpose || entry.generation === detail.generation);
    const retryEntry = authorizationRetryQueue.get(detail.purpose);
    if (retryEntry && retryEntry.generation !== detail.generation) authorizationRetryQueue.delete(detail.purpose);
    updatePendingImportButton();
    updateReconnectControl();
  });

  window.GoogleDriveImages = Object.freeze({
    isReady: function () { return driveReady; },
    ready: driveReadyPromise,
    validateSource: normalizeDriveSource,
    loadSourceRecords: loadDriveSourceRecords,
    queueSourceRecords: queueDriveSourceRecords
  });
})();
