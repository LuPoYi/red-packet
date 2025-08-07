export const truncateString = (str: string, frontDigits = 7, endDigits = 5) =>
  str.slice(0, frontDigits) + "..." + str.slice(-endDigits)
