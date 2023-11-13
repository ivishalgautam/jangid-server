function convertMillisecondsToTime(milliseconds) {
  return `${new Date(milliseconds).getHours()}hours ${new Date(
    milliseconds
  ).getMinutes()}minutes ${new Date(milliseconds).getSeconds()}seconds`;
}

module.exports = { convertMillisecondsToTime };
