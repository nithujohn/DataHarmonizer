/**
 * @fileOverview Utility functions that support exporting a template to a
 * given format of export file.
 */

/**
 * Get a dictionary of source field names pointing to column index
 * @param {Object} fields A flat version of data.js.
 * @return {Dictionary<Integer>} Dictionary of all fields.
 */
const getFieldNameMap = (fields) => {
  const fieldNameMap = {};
  for (const [fieldIndex, field] of fields.entries()) {
    fieldNameMap[field.fieldName] = fieldIndex;
  }
  return fieldNameMap;
}

/**
 * Modifies exportHeaders map of fields so that each field contains an array
 * of one or more source fields by name that are used to compose it.
 * This code works on exportHeaders as either a Map or an array of
 * [['field_name',[fields],...] 
 * @param {Array} exportHeaders See `export.js`.
 * @param {Array<Object>} array of all source fields.
 * @param {String} export column prefix
 */
const getHeaderMap = (exportHeaders, fields, prefix) => {
	var headerMap = {};
    if (exportHeaders instanceof Map) {
    	exportHeaders.forEach( (headerIndex, headerValue) => {
    		headerMap[headerValue] = headerIndex;
    	});

    }
    else {
    	// Array version: handles case where two columns have same name
		for (const [headerIndex, headerItem] of exportHeaders.entries()) {
			// Set mapping only for first instance of name. Access to
			// subsequent identical fields is handled in export.js loop. 
			if (!(headerItem[0] in headerMap)) {
				headerMap[headerItem[0]] = headerIndex;
			}
		}
    }

    let field_message = [];
    let field_export_message = [];

	for (const [fieldIndex, field] of fields.entries()) {
		if (field.exportField && prefix in field.exportField) {
			for (const target of field.exportField[prefix]) {
				if ('field' in target) {
					var sources;
					if (exportHeaders instanceof Map) {
						if (target.field in headerMap) {
							field_export_message.push(target.field);
						}
						else {
							if (!exportHeaders.has(target.field)) {
								field_message.push(target.field);
								// Issue: all template driven exportHeader fields are showing AFTER export.js mentioned ones.
								headerMap[target.field] = exportHeaders.length;
								exportHeaders.set(target.field, []);
							}
						}
						let sources = exportHeaders.get(target.field);
						// If given field isn't already mapped, add it.
						if (sources.indexOf(field.fieldName) == -1) {
							sources.push(field.fieldName);
						};
						exportHeaders.set(target.field, sources);
					}
					else { // Save to array
						if (target.field in headerMap) {
							field_export_message.push(target.field);
						}
						else {
							// Add field to exportHeaders
							// Issue: can this handle many-to-one mapping?
							field_message.push(target.field);
							headerMap[target.field] = exportHeaders.length;
							exportHeaders.push(target.field, []);
						}
						sources = exportHeaders[headerMap[target.field]][1];
						// As above
						if (sources.indexOf(field.fieldName) == -1) {
							sources.push(field.fieldName);
						};
						exportHeaders[headerMap[target.field]][1] = sources;
					};

				};
			};
		};
    };
    // This will output a list of fields added to exportHeaders by way of template specification which haven't been included in export.js
    if (field_message)
    	console.log('Export fields added by template:', field_message)
    if (field_export_message)
    	console.log('Export fields stated in export.js):', field_export_message)
};

const getMappedField = (sourceRow, sourceFieldNames, fieldNameMap, delimiter) => {
	// This provides an export field composed of one or more more input
	// fields, separated by a ';' delimiter if not null.
	const mappedCell = [];
	for (const fieldName of sourceFieldNames) {
		const mappedCellVal = sourceRow[fieldNameMap[fieldName]];
		if (!mappedCellVal) continue;
		mappedCell.push(mappedCellVal);
	};
	return mappedCell.join(delimiter);
}

/**
 * Get a dictionary of empty arrays for each ExportHeader field
 * FUTURE: enable it to work with hierarchic vocabulary lists
 *
 * @param {Array<String>} sourceRow array of values to be exported.
 * @param {Array<String>} sourceFields list of source fields to examine for mappings.
 * @param {Array<Array>} RuleDB list of export fields modified by rules.
 * @param {Array<Array>} fields list of export fields modified by rules.
 * @param {Array<Integer>} fieldNameMap map of field names to column index.
 * @param {String} prefix of export format to examine.
 * @return {Array<Object>} fields Dictionary of all fields.
 */

const getRowMap = (sourceRow, sourceFields, RuleDB, fields, fieldNameMap, prefix) => {
  for (const fieldName of sourceFields) {
  	const sourceIndex = fieldNameMap[fieldName];
    let value = sourceRow[sourceIndex]; // All text values.
    // Sets source field to data value so that rules can reference it easily.
    RuleDB[fieldName] = value;
    // Check to see if value is in vocabulary of given select field, and if it
    // has a mapping for export to a GRDI target field above, then set target
    // to value.
    if (value && value.length > 0) {
      const vocabulary = fields[sourceIndex].vocabulary;
      if (value in vocabulary) { 
        const term = vocabulary[value];
        // Looking for term.exportField['GRDI'] for example:
        if ('exportField' in term && prefix in term.exportField) {
          for (let mapping of term.exportField[prefix]) {
            // Here mapping involves a value substitution
            if ('value' in mapping) {
              value = mapping.value;
              // Changed on a copy of data, not handsongrid table
              sourceRow[sourceIndex] = value;
            };
            if ('field' in mapping && mapping['field'] in RuleDB) {
                RuleDB[mapping['field']] = value;
            };
          };
        };
      };
    };
  };
};
