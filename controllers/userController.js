// Import necessary modules

import { text } from "express";
import { pool } from "../libs/database.js";
import { comparePassword, hashPassword } from "../libs/index.js";


// getUser function to handle fetching user data
export const getUser = async (req, res) => {
  try {

    // Logic to fetch user data
    
    const { userId } = req.body.user;

    const userExists = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId]
    });

    const user = userExists.rows[0];

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    user.password = undefined; // Remove password from response

    res.status(201).json({
      status: "success",
      message: "User fetched successfully",
      data: user,
    });
    
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failed",
      message: err.message || "Internal Server Error",
    });
  }
}


// updateUser function to handle changing user password
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { firstName, lastName, country, currency, contact } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: "failed",
        message: "User ID is missing from request",
      });
    }
    
    // Validate required fields
    if (!firstName) {
      return res.status(400).json({
        status: "failed",
        message: "First name is required",
      });
    }

    const userExists = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId]
    });


    const user = userExists.rows[0];
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    // Update user data - use existing values for fields not provided
    const updatedUser = await pool.query({
      text: `UPDATE tbluser SET 
             firstname = COALESCE($1, firstname), 
             lastname = COALESCE($2, lastname), 
             country = COALESCE($3, country), 
             currency = COALESCE($4, currency), 
             contact = COALESCE($5, contact), 
             updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6 RETURNING *`,
      values: [firstName, lastName, country, currency, contact, userId]
    });

    // Remove password from response
    updatedUser.rows[0].password = undefined;

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failed",
      message: err.message || "Internal Server Error",
    });
  }
}



// changePassword function to handle updating user data
export const changePassword = async (req, res) => {
  try {
    // Logic to change password
    const { userId } = req.body.user;

    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    const userExists = await pool.query({
      text: `SELECT * FROM tbluser WHERE id = $1`,
      values: [userId]
    });

    const user = userExists.rows[0];
    
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: "failed",
          message: "password do not match",
        });
    }
    
    const isMatch = await comparePassword(currentPassword, user?.password);

    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        message: "Current password is incorrect",
      });
    }
    // Logic to update password
      
    const hashedPassword = await hashPassword(newPassword);

    await pool.query({
      text: `UPDATE tbluser SET password = $1 WHERE id = $2`,
      values: [hashedPassword, userId]
    });

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });



  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failed",
      message: err.message || "Internal Server Error",
    });
  }
}


// 
// export const getAllUser = async (req, res) => {
//   try {
// 
//     // Logic to fetch user data
//     
//     // const { userId } = req.body.user;
// 
//     const Alluser = await pool.query({
//       text: `SELECT * FROM tbluser`,
//       values: []
//     });
// 
//     const user = Alluser.rows;
// 
//     if (!user) {
//       return res.status(404).json({
//         status: "failed",
//         message: "User not found",
//       });
//     }
// 
//     user.password = undefined; // Remove password from response
// 
//     res.status(201).json({
//       status: "success",
//       message: "User fetched successfully",
//       data: user,
//     });
//     
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: "failed",
//       message: err.message || "Internal Server Error",
//     });
//   }
// }