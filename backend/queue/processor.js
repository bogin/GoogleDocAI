const { File } = require('../models');
const validateFileData = (fileData) => {
    const errors = [];
    const warnings = [];

    // Required fields validation
    const requiredFields = ['id', 'name', 'mimeType'];
    requiredFields.forEach(field => {
        if (!fileData[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    // Type validations
    if (fileData.id && typeof fileData.id !== 'string') {
        errors.push(`Invalid id type: expected string, got ${typeof fileData.id}`);
    }

    if (fileData.size && isNaN(Number(fileData.size))) {
        errors.push(`Invalid size format: ${fileData.size}`);
    }

    // Date validations
    ['createdTime', 'modifiedTime'].forEach(dateField => {
        if (fileData[dateField]) {
            const date = new Date(fileData[dateField]);
            if (date.toString() === 'Invalid Date') {
                errors.push(`Invalid ${dateField} format: ${fileData[dateField]}`);
            }
        }
    });

    // Boolean validations
    ['shared', 'trashed'].forEach(boolField => {
        if (fileData[boolField] !== undefined && typeof fileData[boolField] !== 'boolean') {
            errors.push(`Invalid ${boolField} type: expected boolean, got ${typeof fileData[boolField]}`);
        }
    });

    // URL validations
    ['iconLink', 'webViewLink'].forEach(urlField => {
        if (fileData[urlField] && typeof fileData[urlField] !== 'string') {
            errors.push(`Invalid ${urlField} type: expected string URL, got ${typeof fileData[urlField]}`);
        }
    });

    // Object validations
    if (fileData.owner && typeof fileData.owner !== 'object') {
        errors.push('Invalid owner format: expected object');
    }

    if (fileData.lastModifyingUser && typeof fileData.lastModifyingUser !== 'object') {
        errors.push('Invalid lastModifyingUser format: expected object');
    }

    // Array validations
    if (fileData.permissions && !Array.isArray(fileData.permissions)) {
        errors.push('Invalid permissions format: expected array');
    }

    // Optional fields presence warnings
    const optionalFields = ['iconLink', 'webViewLink', 'size', 'version'];
    optionalFields.forEach(field => {
        if (!fileData[field]) {
            warnings.push(`Missing optional field: ${field}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedData: sanitizeFileData(fileData)
    };
};

const sanitizeFileData = (fileData) => {
    try {
        return {
            id: String(fileData.id),
            name: String(fileData.name),
            mimeType: String(fileData.mimeType),
            iconLink: fileData.iconLink ? String(fileData.iconLink) : null,
            webViewLink: fileData.webViewLink ? String(fileData.webViewLink) : null,
            size: fileData.size ? String(fileData.size) : null,
            shared: Boolean(fileData.shared),
            trashed: Boolean(fileData.trashed),
            createdTime: fileData.createdTime ? new Date(fileData.createdTime) : null,
            modifiedTime: fileData.modifiedTime ? new Date(fileData.modifiedTime) : null,
            version: fileData.version ? String(fileData.version) : null,
            owner: fileData.owners?.[0] || null,
            lastModifyingUser: fileData.lastModifyingUser || null,
            permissions: Array.isArray(fileData.permissions) ? fileData.permissions : [],
            capabilities: fileData.capabilities || null,
            metadata: fileData,
            syncStatus: 'success',
            lastSyncAttempt: new Date()
        };
    } catch (error) {
        throw new Error(`Failed to sanitize file data: ${error.message}`);
    }
};

const processFiles = async (task) => {
    const { type, files } = task;
    const results = {
        success: 0,
        failed: 0,
        errors: [],
        validationIssues: []
    };

    try {
        const batchSize = 500;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);

            await Promise.all(batch.map(async (fileData) => {
                try {
                    // Validate file data
                    const validation = validateFileData(fileData);

                    // Log validation results
                    if (validation.warnings.length > 0) {
                        console.log(`Validation warnings for file ${fileData.id}:`, {
                            warnings: validation.warnings
                        });
                    }

                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }

                    // Use sanitized data for upsert
                    await File.upsert(validation.sanitizedData);
                    results.success++;

                } catch (error) {
                    results.failed++;

                    const errorInfo = {
                        fileId: fileData.id,
                        error: error.message,
                        validationErrors: error.message.includes('Validation failed') ?
                            error.message : null
                    };

                    results.errors.push(errorInfo);
                    console.error('File processing error:', errorInfo);

                    // Update file with error status
                    await File.upsert({
                        id: fileData.id,
                        metadata: fileData,
                        syncStatus: 'error',
                        lastSyncAttempt: new Date(),
                        errorLog: {
                            error: error.message,
                            timestamp: new Date(),
                            details: error.stack,
                            validationErrors: errorInfo.validationErrors
                        }
                    });
                }
            }));
        }

        // Log final results
        console.log('Batch processing completed:', {
            totalProcessed: results.success + results.failed,
            successful: results.success,
            failed: results.failed,
            errors: results.errors.length > 0 ? results.errors : null
        });

        return results;
    } catch (error) {
        console.error('File processing failed:', error);
        throw error;
    }
};

module.exports = processFiles;