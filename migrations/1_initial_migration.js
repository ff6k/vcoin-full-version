// const Migrations = artifacts.require("Migrations");

// module.exports = function (deployer) {
//   deployer.deploy(Migrations);
// };

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

var vegascoin = artifacts.require("./TokenMintERC20MintableToken.sol");

const name = "VegasCoins.io"
const symbol = 'VCoins'
const decimals = 18
const initialSupply = 3000000000000
const feeReceiver = '0x5807c6ecb0AB413816f7C90f0e5C2974bDF89fc3'
const tokenOwnerAddress = '0x3f223D8681eAf9b2EaAf0006E037d49D069B9277'
// const tokenOwnerAddress = '0x753f1d496C84a12fddAD8B46C0Fea6846521E95d'

module.exports = async function (deployer) {
  deployer.deploy(vegascoin, name, symbol, decimals, initialSupply, feeReceiver, tokenOwnerAddress); // 1M total supply 
};