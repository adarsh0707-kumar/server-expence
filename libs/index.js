import bcript from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

export const hashPassword = async (userValue) => {
  const salt = await bcript.genSalt(10);

  const hashedPassword = await bcript.hash(userValue, salt);
  return hashedPassword;
}

export const comparePassword = async (userPassword, password) => {
  try {
    const isMatch = await bcript.compare(userPassword, password);
    return isMatch;
  }
  catch (err) {
    console.error(err);
  }

};


export const createJWT = (id) => {
  return jwt.sign(
    {
      userId: id
    },
      process.env.JWT_SECRET,
    {
      expiresIn: '1d' // Token will expire in 1 day
    },
  );
}


export function getMonthName(index) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[index];
}