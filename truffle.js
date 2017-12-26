const yargs = require('yargs');
var provider, address;

if (yargs.argv.network == 'rinkeby' || yargs.argv.network == 'mainnet') {
  var providerURL = `https://${yargs.argv.network}.infura.io/${yargs.argv.accessToken}`;
  var HDWalletProvider = require('truffle-hdwallet-provider');
  var mnemonic = yargs.argv.mnemonic;

  provider = new HDWalletProvider(mnemonic, providerURL, 0);
  address = "0x" + provider.wallet.getAddress().toString("hex");
  console.log('Provider address', address);
  console.log('Deploying to ', providerURL);
}

module.exports = {
  networks: {
    rinkeby: {
      gasPrice: 800000000000, // 80 gwei,
      provider: provider,
      network_id: 3,
      from: address
    },
    mainnet: {
      gas: 2550000,
      gasPrice: 1000000000, // 1 gwei
      provider: provider,
      network_id: 1,
      from: address
    }
  }
};