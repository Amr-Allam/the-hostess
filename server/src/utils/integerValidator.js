// Money is stored as integers in the smallest currency unit.
export const integerValidator = {
  validator: Number.isInteger,
  message: "{PATH} must be an integer",
};
