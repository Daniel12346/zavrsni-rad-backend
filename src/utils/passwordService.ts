import * as bcrypt from "bcrypt";

export const hashPassword = async (password: string) =>
  await bcrypt.hash(password, 10);
export const comparePasswords = async (password: string, encrypted: string) =>
  await bcrypt.compare(password, encrypted);
