const Lottery = artifacts.require('./Lottery.sol');

module.exports = function(deployer) {
  return deployer.then(() => {
    return deployer.deploy(Lottery).then(instance => {
      confirmationAddress = Lottery.address;
    });
  });
}