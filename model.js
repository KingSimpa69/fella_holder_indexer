const mongoose = require('mongoose');

const nftDataSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
      },
    owner: {
      type: String,
      required: true,
    },
});

const NFTHolders = mongoose.model('NFTHolders', nftDataSchema);

module.exports = NFTHolders;