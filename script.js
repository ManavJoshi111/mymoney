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
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function doWork(e) {
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
    getSheetData(clientDetails);
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

const getSheetData = async (clientDetails) => {
  console.log("clientDetails: ", clientDetails);
  const { access_token, scope, token_type } = clientDetails;
  const sheetsApi = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/MyMoney`;
  try {
    const response = await fetch(sheetsApi, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const existingExpenses = await response.json();
    const { title, amount, option } = getExpenseDetails();

    // Determine the column to insert based on the selected option
    let columnIndex;
    switch (option) {
      case "cbi":
        columnIndex = 3; // Column index for Central Bank
        break;
      case "sbi":
        columnIndex = 4; // Column index for State Bank
        break;
      case "cash":
        columnIndex = 5; // Column index for Cash
        break;
      default:
        throw new Error("Invalid option");
    }

    // Construct the new row to be inserted
    const newRow = [new Date().toISOString(), title, amount];
    // Fill the columns before the selected option with empty values
    for (let i = 3; i < columnIndex; i++) {
      newRow.push("");
    }
    // Insert the value for the selected option
    newRow.push(amount);

    // Update the Google Sheet with the new row
    await fetch(sheetsApi, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: "MyMoney!A1",
        majorDimension: "ROWS",
        values: [newRow],
      }),
    });

    console.log("Data inserted successfully.");
  } catch (err) {
    console.error("Error: ", err);
  }
};

const getExpenseDetails = () => {
  const title = document.getElementById("title").value;
  const amount = document.getElementById("amount").value;
  const option = document.getElementById("method").value;

  return { title, amount, option };
};
