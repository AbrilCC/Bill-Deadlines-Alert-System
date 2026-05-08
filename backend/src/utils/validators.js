import dotenv from "dotenv";

dotenv.config();

export function validatePassword(password) {
  // mínimo 8 chars, 1 letra y 1 número
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  return regex.test(password);
}