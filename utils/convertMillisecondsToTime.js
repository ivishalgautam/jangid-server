function convertMillisecondsToTime(milliseconds) {
  var seconds = Math.floor((milliseconds / 1000) % 60);
  var minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  var hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);

  return `${hours} hours ${minutes} minutes ${seconds} seconds`;
}

module.exports = { convertMillisecondsToTime };
