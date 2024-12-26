const mongoose = require('mongoose');

const fileContentSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
    },
    lastSync: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });


fileContentSchema.index({ content: 'text' });

const FileContent = mongoose.model('FileContent', fileContentSchema);

module.exports = FileContent;
