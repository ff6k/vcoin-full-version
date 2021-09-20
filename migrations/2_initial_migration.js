var vegascoin = artifacts.require("./TokenMintERC20MintableToken.sol");

const name = "VegasCoins.io"
const symbol = 'VCoins'
const decimals = 18
const initialSupply = 3000000000000
const feeReceiver = '0x1eeaa3A034725fd932EeD8165A20b5F43AE631a1'
const tokenOwnerAddress = '0x3f223D8681eAf9b2EaAf0006E037d49D069B9277'
//wallet address that was used to deploy the contract
//0x3f223D8681eAf9b2EaAf0006E037d49D069B9277

module.exports = function(deployer) {
  deployer.deploy(vegascoin, name, symbol, decimals, initialSupply, feeReceiver, tokenOwnerAddress); // 3T total supply 
};

function fundContractVcoins() {
  
}