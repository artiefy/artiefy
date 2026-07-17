import 'server-only';

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
] as const;

const startsWith = (bytes: Uint8Array, signature: readonly number[]) =>
  signature.every((value, index) => bytes[index] === value);

function isConservativeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8192));
  if (sample.includes(0)) return false;

  let disallowedControls = 0;
  for (const byte of sample) {
    if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
      disallowedControls += 1;
    }
  }
  if (disallowedControls > Math.max(2, Math.floor(sample.length * 0.01))) {
    return false;
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(sample);
    return true;
  } catch {
    return false;
  }
}

export function hasValidGuidedSubmissionFileSignature(
  file: File,
  bytes: Uint8Array
): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  switch (extension) {
    case 'pdf':
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case 'jpeg':
    case 'jpg':
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case 'png':
      return startsWith(
        bytes,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      );
    case 'webp':
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
      );
    case 'docx':
    case 'pptx':
    case 'xlsx':
    case 'zip':
      return ZIP_SIGNATURES.some((signature) => startsWith(bytes, signature));
    case 'csv':
    case 'txt':
      return isConservativeText(bytes);
    default:
      return false;
  }
}
