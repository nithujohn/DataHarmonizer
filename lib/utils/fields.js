import { parseDatatype } from './datatypes';

/**
 * Modify a string to match specified case.
 * @param {String} val String to modify.
 * @param {String} capitalize Case to modify string to; one of `'UPPER'`,
 *     `'lower'` or `'Title'`.
 * @return {String} String with modified case.
 */
export function changeCase(val, field) {
  switch (field.structured_pattern.syntax) {
    case '{lower_case}':
      val = val.toLowerCase();
      break;
    case '{UPPER_CASE}':
      val = val.toUpperCase();
      break;
    case '{Title_Case}':
      val = val
        .split(' ')
        .map((w) => w[0].toUpperCase() + w.substr(1).toLowerCase())
        .join(' ');
      break;
  }
  return val;
}

/**
 * Test to see if col's field is followed by [field unit],[field bin] fields
 * @param {Object} fields See `data.js`.
 * @param {Integer} column of numeric field.
 */
export function fieldUnitBinTest(fields, col) {
  return (
    fields.length > col + 2 &&
    fields[col + 1].title == fields[col].title + ' unit' &&
    fields[col + 2].title == fields[col].title + ' bin'
  );
}

export function dataArrayToObject(
  dataArray,
  fields,
  multivalueDelimiter = '; '
) {
  const dataObject = {};
  dataArray.forEach((cell, idx) => {
    if (cell === '' || cell == null) {
      return;
    }
    const field = fields[idx];
    let parsed;
    if (field.multivalued) {
      const split = cell.split(multivalueDelimiter);
      parsed = split
        .map((value) => parseDatatype(value, field.datatype))
        .filter((parsed) => parsed !== undefined);
      if (parsed.length > 0) {
        dataObject[field.name] = parsed;
      }
    } else {
      parsed = parseDatatype(cell, field.datatype);
      if (parsed !== undefined) {
        dataObject[field.name] = parsed;
      }
    }
  });
  return dataObject;
}