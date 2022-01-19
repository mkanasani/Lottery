
   
const Lotto = artifacts.require("Lotto.sol");

module.exports = function(deployer) {
  deployer.deploy(Lotto, 2);
};