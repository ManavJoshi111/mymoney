// Function to update Google Sheet with new expense data
async function updateSheet(expenseTitle, amount, expenseType) {
  try {
    // Authenticate with Google Sheets API (replace with your authentication logic)
    // Get the last row number
    const response = await auth.spreadsheets.values.get({
      spreadsheetId: "1hSs7CVjEvhCSy36E4lglr4Xu3RCNqgNVRseBn8RXJeQ",
      range: "Sheet1!A:A", // Assuming column A contains the date and is always populated
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const lastRow = response.data.values.length + 1;

    // Construct the expense data
    const rowData = [
      new Date().toISOString(), // Date (assuming it's the first column)
      expenseTitle,
      amount,
      expenseType === "cash" ? 0 : amount, // Central Bank
      expenseType === "cash" ? 0 : amount, // State Bank
      expenseType === "cash" ? amount : 0, // Cash
    ];

    // Update the Google Sheet with the new expense data
    await auth.spreadsheets.values.update({
      spreadsheetId: "1hSs7CVjEvhCSy36E4lglr4Xu3RCNqgNVRseBn8RXJeQ",
      range: `Sheet1!A${lastRow}:F${lastRow}`, // Assuming your data is in columns A to F
      valueInputOption: "USER_ENTERED",
      resource: { values: [rowData] },
    });

    console.log("Expense data added successfully.");
  } catch (error) {
    console.error("Error updating Google Sheet:", error);
  }
}
