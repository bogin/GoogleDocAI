const { File, User, FileOwner } = require('../models');

const processOwner = async (ownerData) => {
    if (!ownerData || !ownerData.emailAddress || !ownerData.permissionId) {
        return null;
    }

    try {
        const [user, created] = await User.findOrCreate({
            where: { permissionId: ownerData.permissionId },
            defaults: {
                email: ownerData.emailAddress,
                displayName: ownerData.displayName || null,
                photoLink: ownerData.photoLink || null
            }
        });

        if (!created && (
            user.email !== ownerData.emailAddress ||
            user.displayName !== ownerData.displayName ||
            user.photoLink !== ownerData.photoLink
        )) {
            await user.update({
                email: ownerData.emailAddress,
                displayName: ownerData.displayName || null,
                photoLink: ownerData.photoLink || null
            });
        }

        return user;
    } catch (error) {
        console.error('Error processing owner:', error);
        return null;
    }
};

const processOwners = async (owners) => {
    if (!Array.isArray(owners)) {
        return [];
    }

    const processedOwners = [];
    for (const ownerData of owners) {
        const user = await processOwner(ownerData);
        if (user) {
            processedOwners.push(user);
        }
    }
    return processedOwners;
};

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
    if (fileData.owners && !Array.isArray(fileData.owners)) {
        errors.push('Invalid owners format: expected array');
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
        validationIssues: [],
        usersProcessed: 0
    };

    try {
        const batchSize = 500;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);

            await Promise.all(batch.map(async (fileData) => {
                try {
                    // Process all owners
                    const processedOwners = await processOwners(fileData.owners || []);
                    if (processedOwners.length > 0) {
                        results.usersProcessed += processedOwners.length;
                    }

                    // Validate file data
                    const validation = validateFileData(fileData);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                    }

                    // Create the file record
                    const [file] = await File.upsert(validation.sanitizedData);

                    // Update owner associations
                    if (processedOwners.length > 0) {
                        await FileOwner.destroy({ where: { fileId: file.id } });
                        await Promise.all(processedOwners.map(owner =>
                            FileOwner.create({
                                fileId: file.id,
                                userId: owner.id,
                                role: 'owner'
                            })
                        ));
                    }

                    // Update user statistics
                    await Promise.all(processedOwners.map(owner => owner.updateStats()));

                    results.success++;

                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        fileId: fileData.id,
                        error: error.message,
                        validationErrors: error.message.includes('Validation failed') ?
                            error.message : null
                    });

                    // Update file with error status
                    await File.upsert({
                        id: fileData.id,
                        metadata: fileData,
                        syncStatus: 'error',
                        lastSyncAttempt: new Date(),
                        errorLog: {
                            error: error.message,
                            timestamp: new Date(),
                            details: error.stack
                        }
                    });
                }
            }));
        }

        console.log('Batch processing completed:', {
            totalProcessed: results.success + results.failed,
            successful: results.success,
            failed: results.failed,
            usersProcessed: results.usersProcessed,
            errors: results.errors.length > 0 ? results.errors : null
        });

        return results;
    } catch (error) {
        console.error('File processing failed:', error);
        throw error;
    }
};

module.exports = processFiles;