const KriptoLottery = artifacts.require('./KriptoLottery.sol');

module.exports = function(deployer) {
  return deployer.then(() => {
    return deployer.deploy(KriptoLottery).then(instance => {
      confirmationAddress = KriptoLottery.address;
    });
  });
}