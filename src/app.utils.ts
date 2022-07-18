var bcrypt = require('bcryptjs');

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 8);
};

export const checkPassword = async (password: string, hash: string) => {
  bcrypt.compareSync(password, hash);
};
