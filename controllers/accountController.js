// Import necessary modules
import { pool } from "../libs/database.js";


// Define getAccount function to fetch account details
export const getAccount = async (req, res) => {
  try {

    const { userId } = req.body.user;

    const accounts = await pool.query({
      text: `SELECT * FROM tblaccount WHERE user_id = $1`,
      values: [userId]
    });

    res.status(200).json({
      status: "Success",
      message: "Account fetched successfully.",
      data: accounts.rows
    });
    
  }
  catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message || "An error occurred while fetching the account."
    });
  }
}


// Define createAccount function to create a new account
export const createAccount = async (req, res) => {
  try {
    // Logic to create an 
    
    const { userId } = req.body.user;

    const { name, amount, account_number } = req.body;
    
    
    const accountExistsQuery = {
      text: `SELECT * FROM tblaccount WHERE user_id = $1 AND account_name = $2`,
      values: [userId, name],
    };

    const accountExistsResult = await pool.query(accountExistsQuery);

    const accountExists = accountExistsResult.rows[0];


    if (accountExists) {
      return res.status(400).json({
        status: "Failed",
        message: "Account with this name already exists."
      });
    };

    const createAccountResult = await pool.query({
      text: `INSERT INTO tblaccount (user_id, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *`,
      values: [userId, name, account_number, amount],
      
    });

    const account = createAccountResult.rows[0];

    const userAccounts = Array.isArray(name) ? name : [name];
    
    const updateUserAccountsQuery = {
      text: `UPDATE tbluser SET accounts = array_cat(accounts, $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      values: [userAccounts, userId],
    };

    await pool.query(updateUserAccountsQuery);

    // Add initial deposit to the account

    const description = account.account_name + " (Initial Deposit)";

    const initialDepositQuery = {
      text:`INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      values: [
        userId,
        description,
        "income",
        "completed",
        amount,
        account.account_number
      ],
    }

    await pool.query(initialDepositQuery);
    res.status(201).json({
      status: "Success",
      message: account.account_name + " " + "Account created successfully.",
      data: account
    });

  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message || "An error occurred while creating th e account."
    });
  }
}


// Define addMoneyToAccount function to add money to an account
export const addMoneyToAccount = async (req, res) => {
  try {

    const { userId } = req.body.user;
    const { id } = req.params;
    const { amount } = req.body;

      
    const newAmount = Number(amount);

    const result = await pool.query({
      text: `UPDATE tblaccount SET account_balance = (account_balance + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      values: [newAmount, id]
    });

    const accountInformation = result.rows[0];

    const description = accountInformation.account_name + " (Deposit)";

    const transactionQuery = {
      text: `INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      values: [
        userId,
        description,
        "income",
        "completed",
        amount,
        accountInformation.account_name
      ],
    };

    await pool.query(transactionQuery);

    res.status(200).json({
      status: "Success",
      message: "Money added to the account successfully.",
      data: accountInformation
    });


    
  } catch (err) {
    res.status(500).json({
      status: "Failed",
      message: err.message || "An error occurred while adding money to the account."
    });
  }
}


// In your controller (accountController.js)

export const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const user = req.body.user; // ✅ CORRECTED from req.user.userId

  console.log("id", id)
  console.log("user", user)

  try {
    const result = await pool.query({
      text: `DELETE FROM tblaccount WHERE id = $1 AND user_id = $2 RETURNING *`,
      values: [id, userId]
    });

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'Failed',
        message: 'Account not found or not yours'
      });
    }

    res.status(200).json({
      status: 'Success',
      message: 'Account deleted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'Failed',
      message: err.message || 'Error deleting account'
    });
  }
};

