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
    callback: "",
  });
  gisInited = true;
  console.log("Token Client: ", tokenClient);
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
const handleAuthClick = () => {
  let clientDetails;
  tokenClient.callback = (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    localStorage.setItem("myMoneyToken", resp.access_token);
    clientDetails = resp;
    updateSheet(clientDetails);
  };

  const acessToken = localStorage.getItem("myMoneyToken");
  if (acessToken == null) {
    console.log("Token doens't exist");
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
};

const updateSheet = async (clientDetails) => {
  const { access_token, scope, token_type } = clientDetails;
  const sheetsApi = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/MyMoney`;
  try {
    // Include the access token in the authorization header
    const response = await fetch(sheetsApi, {
      method: "GET", // Assuming you want to fetch data (change to POST for updates)
      headers: {
        Authorization: `Bearer ${access_token}`, // Authorization header with access token
        "Content-Type": "application/json", // Optional, depending on API requirements
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const ExistingExpenses = await response.json();
    console.log("Userdata: ", ExistingExpenses);
    const newLength = ++ExistingExpenses.values.length;
  } catch (err) {
    console.error("Error: ", err);
  }
};
