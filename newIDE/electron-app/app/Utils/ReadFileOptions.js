// IPC callers choose the representation, while the main process owns the open mode.
const readFileOptions = options => {
  const encoding =
    typeof options === 'string' ? options : options && options.encoding;
  if (
    encoding != null &&
    (typeof encoding !== 'string' || !Buffer.isEncoding(encoding))
  )
    throw new TypeError('Unsupported file encoding.');
  return { encoding: encoding == null ? null : encoding, flag: 'r' };
};

module.exports = { readFileOptions };
