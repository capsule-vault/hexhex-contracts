// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const HexHex = await hre.ethers.getContractFactory('HexHex');
  const hexHex = await HexHex.deploy(
    'HexHex',
    'HEX',
    '',
    '0x8EB82Be5fc2e64e0b57cEb639dF68610b29864E6',
    '0x79E2d470f950f2Cf78eeF41720E8ff2cf4B3CD78',
  );

  await hexHex.deployed();

  console.log('HexHex deployed to:', hexHex.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
