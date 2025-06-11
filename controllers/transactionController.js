// Import necessary modules

import { getMonthName } from "../libs/index.js";
import { pool } from "../libs/database.js";



// Define getTransactions function to fetch transactions

export const getTransactions = async (req, res) => {
  try {
    const today = new Date();

    const _sevenDaysAgo = new Date(today);

    _sevenDaysAgo.setDate(today.getDate() - 7);

    const sevenDaysAgo = _sevenDaysAgo.toISOString().split('T')[0];

    const { df, dt, s } = req.query;

    const { userId } = req.body.user;

    // Logic to get transactions based on date filters and search term

    const startDate = new Date(df || sevenDaysAgo);
    const endDate = new Date(dt || new Date());

    const transactions = await pool.query({
      text: `
        SELECT * FROM tbltransaction 
        WHERE user_id = $1 AND
        created_at BETWEEN $2 AND $3 
        AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC`,
      values: [
        userId,
        startDate,
        endDate,
        s
      ]
    })

    res.status(200).json({
      status: 'success',
      data: {
        transactions: transactions.rows,
      },
    });
  }
  catch (err) {
    console.error(err)
    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
}




// Function to get dashboard information including total income, expense, and available balance

export const getDashboardInformation = async (req, res) => {
  try {
    // Logic to get dashboard information

    const { userId } = req.body.user;

    let totalIncome = 0;
    let totalExpense = 0;


    const transactionsResult = await pool.query({
      text: `SELECT type, SUM(amount) AS total_amount
        FROM tbltransaction 
        WHERE user_id = $1 
        GROUP BY type`,
      values: [userId],
    })

    const transactions = transactionsResult.rows;

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.total_amount);
      if (transaction.type === 'income') {

        totalIncome += amount
      }
      else {
        totalExpense += amount
      }
    });

    const availableBalance = totalIncome - totalExpense;

    // Aggregate transactions to sum by type and group by month

    const year = new Date().getFullYear();

    const start_Date = new Date(year, 0, 1);
    const end_Date = new Date(year, 11, 31, 23, 59, 59);


    const result = await pool.query({
      text: `
        SELECT 
          EXTRACT(MONTH FROM created_at) AS month, 
          type, 
          SUM(amount) AS totalAmount
        FROM
          tbltransaction
        WHERE
          user_id = $1
          AND created_at BETWEEN $2 AND $3
        GROUP BY
          EXTRACT(MONTH FROM created_at), type`,
      values: [userId, start_Date, end_Date],
    })

    // organize the data by month and type

    const data = new Array(12).fill().map((_, index) => {
      const monthNum = index + 1;
      const monthData = result.rows.filter(item => parseInt(item.month) === monthNum);

      const incomeEntry = monthData.find(item => item.type === 'income');
      const expenseEntry = monthData.find(item => item.type === 'expense');

      return {
        label: getMonthName(index),
        income: incomeEntry ? parseFloat(incomeEntry.totalamount) : 0,
        expense: expenseEntry ? parseFloat(expenseEntry.totalamount) : 0
      };
    });

    // fetch the last 5 transactions

    const lastTransactionsResult = await pool.query({
      text: `
        SELECT * FROM tbltransaction 
        WHERE user_id = $1 
        ORDER BY id DESC 
        LIMIT 5`,
      values: [userId],
    });

    const lastTransactions = lastTransactionsResult.rows;

    // fetch the last 5 accounts
    const lastAccountResult = await pool.query({
      text: `
        SELECT * FROM tblaccount 
        WHERE user_id = $1 
        ORDER BY id DESC 
        LIMIT 5`,
      values: [userId],
    });

    const lastAccounts = lastAccountResult.rows;

    res.status(200).json({
      status: 'success',
      totalIncome,
      totalExpense,
      availableBalance,
      lastTransactions,
      lastAccounts,
      chartData: data,
    });


    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
      });
    }
  }






// Define addTransaction function to add a new transaction


export const addTransaction = async (req, res) => {
    try {

      const { account_id } = req.params;
      const { userId } = req.body.user;
      const { description, amount, source } = req.body;

      if (!description || !amount || !source) {
        return res.status(400).json({
          status: 'error',
          message: 'All fields are required',
        });
      }

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Amount should be a greater than 0',
        });
      }

      const result = await pool.query({
        text: `
        SELECT * FROM tblaccount
        WHERE id = $1`,
        values: [account_id],
      });

      const accountInfo = result.rows[0];

      if (!accountInfo) {
        return res.status(404).json({
          status: 'failed',
          message: 'Account not found',
        });
      }

      if (accountInfo.account_balance <= 0 || accountInfo.account_balance < Number(amount)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Insufficient account balance',
        });
      }

      // Start a transaction
      await pool.query("BEGIN");

      await pool.query({
        text: `
        UPDATE tblaccount
        SET account_balance = account_balance - $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        values: [amount, account_id],
      });

      await pool.query({
        text: `
        INSERT INTO tbltransaction (user_id, description, type, status, amount, source)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        values: [userId, description, "expense", "completed", amount, source],
      });


      await pool.query("COMMIT");

      res.status(201).json({
        status: 'success',
        message: 'Transaction added successfully',
      });


    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
      });
    }
  }






//Define transferMoneyToAccount function to transfer money between accounts


  export const transferMoneyToAccount = async (req, res) => {
    try {
      // Logic to transfer money to another account

      const { userId } = req.body.user;
      const { from_account, to_account, amount } = req.body;

      if (!from_account || !to_account || !amount) {
        return res.status(400).json({
          status: 'error',
          message: 'All fields are required',
        });
      }

      const newAmount = Number(amount);

      if (isNaN(newAmount) || newAmount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Amount should be a greater than 0',
        });
      }

      // Check if the from_account exists and has sufficient balance

      const fromAccountResult = await pool.query({
        text: `
        SELECT * FROM tblaccount
        WHERE id = $1`,
        values: [from_account],
      });

      const fromAccount = fromAccountResult.rows[0];

      if (!fromAccount) {
        return res.status(404).json({
          status: 'failed',
          message: 'Account Information not found',
        });
      }

      if (newAmount > fromAccount.account_balance || fromAccount.account_balance <= 0) {
        return res.status(400).json({
          status: 'failed',
          message: 'Insufficient account balance',
        });
      }


      // Begin a transaction
      await pool.query("BEGIN");
      await pool.query({
        text: `
        UPDATE tblaccount
        SET account_balance = account_balance - $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        values: [newAmount, from_account],
      });

      // Check if the to_account exists
      const toAccountResult = await pool.query({
        text: `
        SELECT * FROM tblaccount
        WHERE id = $1`,
        values: [to_account],
      });

      const toAccount = toAccountResult.rows[0];
      if (!toAccount) {
        await pool.query("ROLLBACK");
        return res.status(404).json({
          status: 'failed',
          message: 'Destination account not found',
        });
      }

      // Update the destination account balance
      await pool.query({
        text: `
        UPDATE tblaccount
        SET account_balance = account_balance + $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        values: [newAmount, to_account],
      });

      // Insert a transaction record for the transfer

      const description = `Transfer (${fromAccount.account_name}) to (${toAccount.account_name})`;

      await pool.query({
        text: `
        INSERT INTO tbltransaction (user_id, description, type, status, amount, source)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        values: [
          userId,
          description,
          "expense",
          "completed",
          newAmount,
          fromAccount.account_name
        ],
      });

      const description2 = `Received (${fromAccount.account_name}) from (${toAccount.account_name})`;

      await pool.query({
        text: `
        INSERT INTO tbltransaction (user_id, description, type, status, amount, source)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        values: [
          userId,
          description2,
          "income",
          "completed",
          newAmount,
          toAccount.account_name
        ],
      });

      // Commit the transaction
      await pool.query("COMMIT");

      res.status(200).json({
        status: 'success',
        message: 'Money transferred successfully',
      });


    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error',
      });
    }
  }

