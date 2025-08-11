/**
 * A class which appears to act like the Date class with customizable timezone
 * offsets.
 * @param {String} iso8601String An ISO-8601 date/time string including a
 *                               timezone offset.
 */
 export function MockDate(iso8601String) {
  // Find the timezone offset (Z or ±hhmm) from the ISO-8601 date string, and
  // then convert that into a number of minutes.
  let parse = /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(Z|[+-]\d{4})/.exec(
    iso8601String
  );
  let tzOffsetStr = parse[1];
  if (tzOffsetStr == "Z") {
    this._tzOffset = 0;
  } else {
    this._tzOffset =
      parseInt(tzOffsetStr.substring(1, 3)) * 60 +
      parseInt(tzOffsetStr.substring(3));
    if (tzOffsetStr[0] == "-") {
      this._tzOffset = -this._tzOffset;
    }
  }

  // To store the offset, we store both the real time in _realDate and a time
  // that is offset by the tzOffset in _shiftedDate. Only the getUTC* methods
  // should be used on these properties, to avoid problems caused by daylight
  // savings time or other timezone effects. This shifting is always legal
  // because ES6 is specified to assume that leap seconds do not exist, so there
  // are always 60 seconds in a minute.
  this._realDate = new Date(iso8601String);
  this._shiftedDate = new Date(
    this._realDate.getTime() + this._tzOffset * 60 * 1000
  );
}
MockDate.prototype = {
  getTimezoneOffset() {
    // This property is reversed from how it's defined in ISO 8601, i.e.,
    // UTC +0100 needs to return -60.
    return -this._tzOffset;
  },
  getTime() {
    return this._realDate.getTime();
  },
};

// Provide an implementation of Date methods that will be need in JSMime. For
// the time being, we only need .get* methods.
for (let name of Object.getOwnPropertyNames(Date.prototype)) {
  // Only copy getters, not setters or x.toString.
  if (!name.startsWith("get")) {
    continue;
  }
  // No redefining any other names on MockDate.
  if (MockDate.prototype.hasOwnProperty(name)) {
    continue;
  }

  if (name.includes("UTC")) {
    // 'name' is already supposed to be freshly bound per newest ES6 drafts, but
    // current ES6 implementations reuse the bindings. Until implementations
    // catch up, use a new let to bind it freshly.
    let boundName = name;
    Object.defineProperty(MockDate.prototype, name, {
      value(...aArgs) {
        return Date.prototype[boundName].call(this._realDate, aArgs);
      },
    });
  } else {
    let newName = "getUTC" + name.substr(3);
    Object.defineProperty(MockDate.prototype, name, {
      value(...aArgs) {
        return Date.prototype[newName].call(this._shiftedDate, aArgs);
      },
    });
  }
}


// A file cache for read_file.
const file_cache = {};
/**
 * Read a file into a string (all line endings become CRLF).
 * @param file  The name of the file to read, relative to the data/ directory.
 * @param start The first line of the file to return, defaulting to 0
 * @param end   The last line of the file to return, defaulting to the number of
 *              lines in the file.
 * @return      Promise<String> The contents of the file as a binary string.
 */
export function read_file(file, start = undefined, end = undefined) {
  if (!(file in file_cache)) {
    var realFile = new Promise(function(resolve, reject) {
      fetch('base/test/data/' + file)
        .then(response => response.ok ? response.arrayBuffer() : reject(new Error('error fetching file')))
        .then(buffer => {
          resolve(new Uint8Array(buffer))
        })
        .catch(err => reject(err))
    });
    var loader = realFile.then(function(contents) {
      var inStrForm = "";
      while (contents.length > 0) {
        inStrForm += String.fromCharCode.apply(
          null,
          contents.subarray(0, 1024)
        );
        contents = contents.subarray(1024);
      }
      return inStrForm.split(/\r\n|[\r\n]/);
    });
    file_cache[file] = loader;
  }
  return file_cache[file].then(function(contents) {
    if (start !== undefined) {
      contents = contents.slice(start - 1, end - 1);
    }
    return contents.join("\r\n");
  });
}

export function read_file_raw(file) {
  return new Promise(function(resolve, reject) {
      fetch('base/test/data/' + file)
        .then(response => response.ok ? response.arrayBuffer() : reject(new Error('error fetching file')))
        .then(buffer => {
          resolve(new Uint8Array(buffer))
        })
        .catch(err => reject(err))
    });
}

export function isFirefox() {
  return navigator.userAgent.toLowerCase().includes('firefox')
}
