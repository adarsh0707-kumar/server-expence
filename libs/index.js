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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[index];
}


export function getDays(index) {
  const Days = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
  ];
  return Days[index];
}