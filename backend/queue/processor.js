const { File, User, FileOwner } = require('../models');

const processOwner = async (ownerData) => {
    if (!ownerData || !ownerData.emailAddress || !ownerData.permissionId) return null;

    try {
        const [user, created] = await User.findOrCreate({
            where: { permissionId: ownerData.permissionId },
            defaults: {
                email: ownerData.emailAddress,
                displayName: ownerData.displayName || null,
                photoLink: ownerData.photoLink || null,
            },
        });

        if (!created) {
            const updates = {};
            if (user.email !== ownerData.emailAddress) updates.email = ownerData.emailAddress;
            if (user.displayName !== ownerData.displayName) updates.displayName = ownerData.displayName || null;
            if (user.photoLink !== ownerData.photoLink) updates.photoLink = ownerData.photoLink || null;

            if (Object.keys(updates).length > 0) {
                await user.update(updates);
            }
        }

        return user;
    } catch (error) {
        console.error('Error processing owner:', error);
        return null;
    }
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

const getUniqueUserPermissions = (fileData) => {
    // Combine owners and permissions arrays
    const allPermissions = [...(fileData.owners || []), ...(fileData.permissions || [])];
    
    // Filter for user type permissions and remove duplicates based on permissionId/id
    const uniquePermissions = new Map();
    
    allPermissions.forEach(permission => {
        // Skip non-user permissions
        if (permission.type === 'anyone' || permission.type === 'domain') {
            return;
        }

        // For owners array items
        if (permission.permissionId) {
            uniquePermissions.set(permission.permissionId, {
                permissionId: permission.permissionId,
                emailAddress: permission.emailAddress,
                displayName: permission.displayName,
                photoLink: permission.photoLink,
                role: permission.me ? 'owner' : 'reader' // Default to reader if not owner
            });
        }
        // For permissions array items
        else if (permission.id && permission.type === 'user') {
            uniquePermissions.set(permission.id, {
                permissionId: permission.id,
                emailAddress: permission.emailAddress,
                displayName: permission.displayName,
                photoLink: permission.photoLink,
                role: permission.role
            });
        }
    });

    return Array.from(uniquePermissions.values());
};

const processFiles = async (task) => {
    const { type, files } = task;
    const results = { success: 0, failed: 0, errors: [] };

    for (const fileData of files) {
        try {
            const validation = validateFileData(fileData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const sanitizedData = sanitizeFileData(fileData);
            const [file] = await File.upsert(sanitizedData);

            // Get unique user permissions
            const uniqueUserPermissions = getUniqueUserPermissions(fileData);

            // Process each unique user permission
            for (const permissionData of uniqueUserPermissions) {
                const user = await processOwner(permissionData);
                if (user) {
                    try {
                        await FileOwner.findOrCreate({
                            where: {
                                fileId: file.id,
                                userId: user.id
                            },
                            defaults: {
                                permissionRole: permissionData.role || 'reader'
                            }
                        });
                    } catch (error) {
                        console.warn(`Duplicate file owner entry skipped for file ${file.id} and user ${user.id}`);
                    }
                }
            }

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({ 
                fileId: fileData.id, 
                error: error.message,
                details: error.original ? JSON.stringify(error.original, null, 4) : null
            });
        }
    }
    console.log(JSON.stringify(results, null, 4))
    return results;
};

module.exports = processFiles;