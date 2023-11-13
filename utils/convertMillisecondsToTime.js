function convertMillisecondsToTime(milliseconds) {
  let hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  let minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  let seconds = Math.floor((milliseconds / 1000) % 60);

  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
}

module.exports = { convertMillisecondsToTime };
