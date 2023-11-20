function convertMillisecondsToTime(milliseconds, custom = false) {
  let hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  let minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  let seconds = Math.floor((milliseconds / 1000) % 60);

  return custom
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    : `${hours} h ${minutes} m ${seconds} s`;
}

module.exports = { convertMillisecondsToTime };
