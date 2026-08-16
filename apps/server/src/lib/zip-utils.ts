// Pure-Buffer ZIP manipulation — no external deps.
// Appends STORED (uncompressed) entries to an existing ZIP.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosNow(): { time: number; date: number } {
  const d = new Date();
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export interface ZipEntry {
  name: string;
  content: Buffer;
}

/**
 * Appends one or more STORED (uncompressed) entries to an existing ZIP buffer.
 * Does not modify any existing entries.
 */
export function appendToZip(zipBuffer: Buffer, entries: ZipEntry[]): Buffer {
  // Locate End of Central Directory (signature 0x06054b50, scanning backwards)
  let eocdOffset = -1;
  for (let i = zipBuffer.length - 22; i >= 0; i--) {
    if (
      zipBuffer[i] === 0x50 && zipBuffer[i + 1] === 0x4b &&
      zipBuffer[i + 2] === 0x05 && zipBuffer[i + 3] === 0x06
    ) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error("Not a valid ZIP: EOCD not found");

  const cdOffset    = zipBuffer.readUInt32LE(eocdOffset + 16);
  const cdSize      = zipBuffer.readUInt32LE(eocdOffset + 12);
  const existingCount = zipBuffer.readUInt16LE(eocdOffset + 10);

  const localData = zipBuffer.subarray(0, cdOffset);         // local file records
  const existingCd = zipBuffer.subarray(cdOffset, cdOffset + cdSize); // existing central dir

  const { time, date } = dosNow();
  const newLocals: Buffer[] = [];
  const newCdEntries: Buffer[] = [];
  let nextOffset = localData.length;

  for (const entry of entries) {
    const name    = Buffer.from(entry.name, "utf8");
    const data    = entry.content;
    const crc     = crc32(data);
    const size    = data.length;

    // Local file header (30 bytes + filename)
    const lh = Buffer.alloc(30 + name.length);
    lh.writeUInt32LE(0x04034b50, 0);  // signature
    lh.writeUInt16LE(20, 4);           // version needed
    lh.writeUInt16LE(0, 6);            // flags
    lh.writeUInt16LE(0, 8);            // method: STORED
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(size, 18);        // compressed
    lh.writeUInt32LE(size, 22);        // uncompressed
    lh.writeUInt16LE(name.length, 26);
    lh.writeUInt16LE(0, 28);           // extra field length
    name.copy(lh, 30);

    newLocals.push(lh, data);

    // Central directory entry (46 bytes + filename)
    const cd = Buffer.alloc(46 + name.length);
    cd.writeUInt32LE(0x02014b50, 0);   // signature
    cd.writeUInt16LE(20, 4);            // version made by
    cd.writeUInt16LE(20, 6);            // version needed
    cd.writeUInt16LE(0, 8);             // flags
    cd.writeUInt16LE(0, 10);            // method: STORED
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(size, 20);         // compressed
    cd.writeUInt32LE(size, 24);         // uncompressed
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt16LE(0, 30);            // extra field length
    cd.writeUInt16LE(0, 32);            // comment length
    cd.writeUInt16LE(0, 34);            // disk number start
    cd.writeUInt16LE(0, 36);            // internal attrs
    cd.writeUInt32LE(0, 38);            // external attrs
    cd.writeUInt32LE(nextOffset, 42);   // local header offset
    name.copy(cd, 46);

    newCdEntries.push(cd);
    nextOffset += 30 + name.length + size;
  }

  const newLocalSection = Buffer.concat([localData, ...newLocals]);
  const newCd           = Buffer.concat([existingCd, ...newCdEntries]);
  const newCdOffset     = newLocalSection.length;
  const totalEntries    = existingCount + entries.length;

  // End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);   // signature
  eocd.writeUInt16LE(0, 4);             // disk number
  eocd.writeUInt16LE(0, 6);             // central dir disk
  eocd.writeUInt16LE(totalEntries, 8);
  eocd.writeUInt16LE(totalEntries, 10);
  eocd.writeUInt32LE(newCd.length, 12);
  eocd.writeUInt32LE(newCdOffset, 16);
  eocd.writeUInt16LE(0, 20);            // comment length

  return Buffer.concat([newLocalSection, newCd, eocd]);
}
