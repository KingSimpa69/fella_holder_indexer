require('dotenv').config()
const {ethers} = require('ethers');
const mongoose = require('mongoose');
const NFTHolderModel = require('./model'); 
const ABI = require('./abi.json');
const contractAddress = '0x217Ec1aC929a17481446A76Ff9B95B9a64F298cF';
const url = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALECHEMY_API_KEY}`;
const provider = new ethers.JsonRpcProvider(url)
const contract = new ethers.Contract(contractAddress, ABI.basedfellas, provider);

const mongoUrl = 'mongodb://127.0.0.1:27017/based_fellas'; 

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    scrapeNFTHolders();
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

async function scrapeNFTHolders() {
  try {
    const totalSupply = await contract.totalSupply();
    const totalSupplyNumber = Number(totalSupply);
    console.log(totalSupplyNumber);

    const batchSize = 25;
    const batchCount = Math.ceil(totalSupplyNumber / batchSize);

    const delayBetweenBatches = 2500;

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, totalSupplyNumber);

      const batchPromises = Array.from({ length: end - start }, (_, index) => {
        const tokenId = start + index;
        return contract.ownerOf(tokenId).then(async (owner) => {
          await NFTHolderModel.updateOne(
            { _id: parseInt(tokenId) },
            { owner: owner },
            { upsert: true }
          );
        });
      });

      await Promise.all(batchPromises);

      if (batchIndex < batchCount - 1) {
        console.log(`${start}-${end} indexed. Waiting for ${delayBetweenBatches / 1000} seconds...`);
        await sleep(delayBetweenBatches);
      }
    }

    console.log('DONE!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = scrapeNFTHolders;