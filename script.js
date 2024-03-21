const { CLIENT_ID, API_KEY, DISCOVERY_DOC, SCOPES } = require("./config");
let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  doWork();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "", // defined later
  });
  gisInited = true;
  doWork();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function doWork() {
  if (gapiInited && gisInited) {
    try {
      handleAuthClick();
    } catch (err) {
      console.log("Err: ", err);
    }
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
  };
  const token = gapi.client.getToken();
  console.log("Token: ", token);
  if (token) {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({ prompt: "" });
  } else {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  }
}
