
/**
 * Decode a quoted-printable buffer into a binary string.
 *
 * @param buffer {BinaryString} The string to decode.
 * @returns {Array(BinaryString, BinaryString)} The first element of the array
 *          is the decoded string. The second element is always the empty
 *          string.
 */
export  function decode_qp(buffer) {
  // Unlike base64, quoted-printable isn't stateful across multiple lines, so
  // there is no need to buffer input, so we can always ignore more.
  let decoded = buffer.replace(
    // Replace either =<hex><hex> or =<wsp>CRLF
    /=([0-9A-F][0-9A-F]|[ \t]*(\r\n|[\r\n]|$))/gi,
    function(match, param) {
      // If trailing text matches [ \t]*CRLF, drop everything, since it's a
      // soft line break.
      if (param.trim().length == 0) {
        return "";
      }
      return String.fromCharCode(parseInt(param, 16));
    }
  );
  return [decoded, ""];
}

/**
 * Decode a base64 buffer into a binary string. Unlike window.atob, the buffer
 * may contain non-base64 characters that will be ignored.
 *
 * @param buffer {BinaryString} The string to decode.
 * @param more   {Boolean}      If true, we expect that this function could be
 *                              called again and should retain extra data. If
 *                              false, we should flush all pending output.
 * @returns {Array(BinaryString, BinaryString)} The first element of the array
 *          is the decoded string. The second element contains the data that
 *          could not be decoded and needs to be retained for the next call.
 */
export function decode_base64(buffer, more) {
  // Drop all non-base64 characters
  let sanitize = buffer.replace(/[^A-Za-z0-9+/=]/g, "");
  // Remove harmful `=' chars in the middle.
  sanitize = sanitize.replace(/=+([A-Za-z0-9+/])/g, "$1");
  // We need to encode in groups of 4 chars. If we don't have enough, leave the
  // excess for later. If there aren't any more, drop enough to make it 4.
  let excess = sanitize.length % 4;
  if (excess != 0 && more) {
    buffer = sanitize.slice(-excess);
  } else {
    buffer = "";
  }
  sanitize = sanitize.substring(0, sanitize.length - excess);
  // Delete all unnecessary '====' in padding.
  sanitize = sanitize.replace(/(====)+$/g, "");
  // Use the atob function we (ought to) have in global scope.
  return [atob(sanitize), buffer];
}

/**
 * Converts a binary string into a Uint8Array buffer.
 *
 * @param buffer {BinaryString} The string to convert.
 * @returns {Uint8Array} The converted data.
 */
export function stringToTypedArray(buffer) {
  var typedarray = new Uint8Array(buffer.length);
  for (var i = 0; i < buffer.length; i++) {
    typedarray[i] = buffer.charCodeAt(i);
  }
  return typedarray;
}

/**
 * Converts a Uint8Array buffer to a binary string.
 *
 * @param buffer {Uint8Array} The Uint8Array to convert.
 * @returns {string} The converted string.
 */
export function typedArrayToString(buffer) {
  var string = "";
  for (let i = 0; i < buffer.length; i += 100) {
    string += String.fromCharCode.apply(
      undefined,
      buffer.subarray(i, i + 100)
    );
  }
  return string;
}

/** A list of month names for Date parsing. */
export const kMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
