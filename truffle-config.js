var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = "flee sadness churn mixture harbor hurry helmet grid valve frame seat voice";

module.exports = {
  rpc: {
    host: "127.0.0.1",
    port: '7545'
  },
  networks: {
    kovan: {
      provider: () => new HDWalletProvider(mnemonic, "https://kovan.infura.io/v3/6fd2fd8e1b334661b0c38556bd48b257"),
      network_id: 42,
      gas: 4000000,
      skipDryRun: true,
    },
    ganache_cli: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ganache_ui: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
  },
  mocha: {
    useColors: true
  },
  compilers: {
      solc: {
        version: "0.5.0",
      }
  }
};
