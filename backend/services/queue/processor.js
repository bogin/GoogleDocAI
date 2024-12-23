const filesRepository = require('../../repo/files.repository');
const userRepository = require('../../repo/user.repository');
const fileOwnerRepository = require('../../repo/fileOwner.repository');

class FileProcessorService {
    async processFiles(task) {
        const { files } = task;
        const results = { success: 0, failed: 0, errors: [] };
        const updatedUsers = new Set();

        for (const fileData of files) {
            let item;
            try {
                const validation = this.validateFileData(fileData);
                if (!validation.isValid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }

                const sanitizedData = this.sanitizeFileData(fileData);
                item = sanitizedData;
                const [file] = await filesRepository.upsert(sanitizedData);
                await this.processFilePermissions(file, fileData, updatedUsers);

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

        await this.updateUserStats(updatedUsers);
        return results;
    }

    async processFilePermissions(file, fileData, updatedUsers) {
        const uniqueUserPermissions = this.getUniqueUserPermissions(fileData);

        for (const permissionData of uniqueUserPermissions) {
            const user = await this.processOwner(permissionData);
            if (user) {
                try {
                    await fileOwnerRepository.findOrCreate({
                        fileId: file.id,
                        userId: user.id,
                        permissionRole: permissionData.role || 'reader'
                    });
                    updatedUsers.add(user.id);
                } catch (error) {
                    console.warn(`Duplicate file owner entry skipped for file ${file.id} and user ${user.id}`);
                }
            }
        }
    }

    async processOwner(ownerData) {
        if (!ownerData?.emailAddress || !ownerData?.permissionId) return null;

        try {
            const userData = {
                permissionId: ownerData.permissionId,
                email: ownerData.emailAddress,
                displayName: ownerData.displayName || null,
                photoLink: ownerData.photoLink || null,
            };

            const [user, created] = await userRepository.findOrCreate(userData);

            if (!created) {
                const updates = this.getUpdatedUserFields(user, ownerData);
                if (Object.keys(updates).length > 0) {
                    await userRepository.update(user.id, updates);
                }
            }

            await userRepository.updateStats(user.id);
            return user;
        } catch (error) {
            console.error('Error processing owner:', error);
            return null;
        }
    }

    async updateUserStats(userIds) {
        try {
            const users = await userRepository.findByIds(Array.from(userIds));
            await Promise.all(users.map(user => userRepository.updateStats(user.id)));
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    getUpdatedUserFields(user, ownerData) {
        const updates = {};
        if (user.email !== ownerData.emailAddress) updates.email = ownerData.emailAddress;
        if (user.displayName !== ownerData.displayName) updates.displayName = ownerData.displayName || null;
        if (user.photoLink !== ownerData.photoLink) updates.photoLink = ownerData.photoLink || null;
        return updates;
    }

    validateFileData = (fileData) => {
        const errors = [];
        const warnings = [];

        const requiredFields = ['id', 'name', 'mimeType'];
        requiredFields.forEach(field => {
            if (!fileData[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        if (fileData.id && typeof fileData.id !== 'string') {
            errors.push(`Invalid id type: expected string, got ${typeof fileData.id}`);
        }

        if (fileData.size && isNaN(Number(fileData.size))) {
            errors.push(`Invalid size format: ${fileData.size}`);
        }

        ['createdTime', 'modifiedTime'].forEach(dateField => {
            if (fileData[dateField]) {
                const date = new Date(fileData[dateField]);
                if (date.toString() === 'Invalid Date') {
                    errors.push(`Invalid ${dateField} format: ${fileData[dateField]}`);
                }
            }
        });

        ['shared', 'trashed'].forEach(boolField => {
            if (fileData[boolField] !== undefined && typeof fileData[boolField] !== 'boolean') {
                errors.push(`Invalid ${boolField} type: expected boolean, got ${typeof fileData[boolField]}`);
            }
        });

        ['iconLink', 'webViewLink'].forEach(urlField => {
            if (fileData[urlField] && typeof fileData[urlField] !== 'string') {
                errors.push(`Invalid ${urlField} type: expected string URL, got ${typeof fileData[urlField]}`);
            }
        });

        if (fileData.owners && !Array.isArray(fileData.owners)) {
            errors.push('Invalid owners format: expected array');
        }

        if (fileData.lastModifyingUser && typeof fileData.lastModifyingUser !== 'object') {
            errors.push('Invalid lastModifyingUser format: expected object');
        }

        if (fileData.permissions && !Array.isArray(fileData.permissions)) {
            errors.push('Invalid permissions format: expected array');
        }

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
            sanitizedData: this.sanitizeFileData(fileData)
        };
    };

    sanitizeFileData = (fileData) => {
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

    getUniqueUserPermissions = (fileData) => {
        const allPermissions = [...(fileData.owners || []), ...(fileData.permissions || [])];

        const uniquePermissions = new Map();

        allPermissions.forEach(permission => {
            if (permission.type === 'anyone' || permission.type === 'domain') {
                return;
            }

            if (permission.permissionId) {
                uniquePermissions.set(permission.permissionId, {
                    permissionId: permission.permissionId,
                    emailAddress: permission.emailAddress,
                    displayName: permission.displayName,
                    photoLink: permission.photoLink,
                    role: permission.me ? 'owner' : 'reader'
                });
            }
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
}

module.exports = new FileProcessorService();
