function timeFromSeconds(seconds) {
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let sec = Math.ceil(seconds % 60);
    return String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0')
        + ":" + String(sec).padStart(2, '0')
}

module.exports = { timeFromSeconds };