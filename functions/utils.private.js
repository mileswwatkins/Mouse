// Source: `General Character Count Guide` section of
// https://support.garmin.com/en-US/?faq=SBFgu4brUwAS4NkL5tNQyA
// "All other symbols or letters will reduce the character
// limit of the message by approximately half due to SMS coding."
// Additionally, assuming the message is sent to just one contact,
// and that contact was pre-entered into the Garmin Explore
// website, then that contact consumes only one character of the
// text message length limit.
// See further explanations of GSM-7 and UCS-2 encodings, eg here:
// https://github.com/nahanil/jquery-smscharcount#why
// https://chadselph.github.io/smssplit/
const maxLengthIfGsm7Encoding = 160 - 1;
const maxLengthIfUcs2Encoding = 80 - 1;
// prettier-ignore
const oneByteGsmCharacters = [
    "!", "'", "#", "$", "%", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "_", "¡", "£", "¥", "§", "¿", "&", "¤",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "Ä", "Å", "Æ", "Ç", "É", "Ñ", "Ø", "ø", "Ü", "ß", "Ö", "à", "ä", "å", "æ", "è", "é", "ì", "ñ", "ò", "ö", "ù", "ü", "Δ", "Φ", "Γ", "Λ", "Ω", "Π", "Ψ", "Σ", "Θ", "Ξ",
    " ", "\n"
]
const twoByteGsmCharacters = ["^", "€", "{", "}", "[", "]", "~", "\\"];

/**
 * Determine the number of bytes in a string, which is
 * useful for some more complex unicode characters, eg 👩‍👩‍👦‍👦
 * https://stackoverflow.com/questions/25994001/how-to-calculate-byte-length-containing-utf8-characters-using-javascript
 */
const getByteLength = (text) => new Blob([str]).size

const hasNonGsm7Characters = (text) =>
  text.some(
    (char) =>
      !oneByteGsmCharacters.includes(char) &&
      !twoByteGsmCharacters.includes(char)
  );

const getGsm7ByteLength = (text) =>
  text.reduce((runningLength, char) => {
    if (oneByteGsmCharacters.includes(char)) {
      return runningLength + 1;
    } else if (twoByteGsmCharacters.includes(char)) {
      return runningLength + 2;
    } else {
      // This message cannot be encoded using GSM-7
      return null;
    }
  });

const isMessageMultipart = (message) => {
  if (hasNonGsm7Characters(message)) {
    return message.length > maxLengthIfUcs2Encoding;
  } else {
    return getGsm7ByteLength(message) > maxLengthIfGsm7Encoding;
  }
};

// TO DO: Deal with emojis and characters that consume more
// than one character in UCS-2-encoded messages
const splitMessage = (message) => {
  if (message.length === 0) {
    return [];
  } else if (!isMessageMultipart) {
    return [message];
  }

  let messages = [];
  const words = message.split(/\s+/).filter((w) => w.length > 0);

  let currentMessage = "(1/XX)";
  words.forEach((word) => {
    const newCurrentMessage = `${currentMessage} ${word}`;
    if (
      (hasNonGsm7Characters(newCurrentMessage) &&
        newCurrentMessage.length > maxLengthIfUcs2Encoding) ||
      (!hasNonGsm7Characters(newCurrentMessage) &&
        getGsm7ByteLength(newCurrentMessage) > maxLengthIfGsm7Encoding)
    ) {
      messages.push(currentMessage);
      currentMessageNumber += 1;
      currentMessage = `(${messages.length + 1}/XX) ${word}`;
    } else {
      currentMessage = newCurrentMessage;
    }
  });
  messages.push(currentMessage);

  messages = messages.map((m) =>
    m.replace(
      /^\((\d+)\/XX\) /,
      (_match, messageNumber) => `(${messageNumber}/${messages.length}) `
    )
  );

  return messages;
};
