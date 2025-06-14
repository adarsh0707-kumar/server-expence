// Import necessary modules

import { pool } from "../libs/database.js";
import { comparePassword, createJWT, hashPassword } from "../libs/index.js";



// signupUser function to handle user registration
export const signupUser = async (req, res) => {
  try {
    
    const { firstName, lastName, email, password } = req.body;
    // Validate input

    if (!firstName || !email || !password) {
      return res.status(404).json({
        status: "failed",
        message: "Please provide all required fields!",
      });
    }

    // Check if user already exists

    const userExists = await pool.query({
      text: "SELECT EXISTS (SELECT * FROM tbluser WHERE email = $1)",
      values: [email],

    });

    if (userExists.rows[0].userExists) {
      return res.status(409).json({
        status: "failed",
        message: "User already exists with this email!",
      });
    }

    // hash the password
    const hashedPassword = await hashPassword(password);

    // Insert new user into the database

    const user = await pool.query({
      text: `INSERT INTO tbluser (firstname,lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING *`,
      values: [firstName,lastName, email, hashedPassword],
    });

    user.rows[0].password = undefined; // Remove password from response

    // Respond with success message and user data
    res.status(201).json({
      status: "success",
      message: "User created successfully!",
      data: user.rows[0],
  
    });

  }  catch (err) {
    console.error(err)
    res.status(500).json({
      status: "failed",
      message: err.message || "An error occurred during signup",
    });
  };
};





// loginUser function to handle user login
export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const result = await pool.query({
      text: "SELECT * FROM tbluser WHERE email = $1",
      values: [email],
    });

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found!",
      });
    }

    // Compare password
    const isMatch = await comparePassword(password, user?.password);
    if (!isMatch) {
      return res.status(404).json({
        status: "failed",
        message: "Invalid Email or password!",
      });
    }

    // Create JWT token
    const token = createJWT(user.id);
    user.password = undefined; // Remove password from response
    res.status(200).json({
      status: "success",
      message: "Login successful!",
      data: {
        user,
        token,
      },
    });




  }
  catch (err) {
    console.error(err)
    res.status(500).json({
      status: "failed",
      message: err.message || "An error occurred during signup",
    });
  }
}