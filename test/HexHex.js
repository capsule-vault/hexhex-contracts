const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HexHex', function () {
  let hexHex;
  let admin;
  let treasury;
  let minter;

  beforeEach(async function () {
    [admin, treasury, minter] = await ethers.getSigners();

    const HexHex = await ethers.getContractFactory('HexHex');
    hexHex = await HexHex.deploy(
      'HexHex',
      'HEX',
      '',
      '0x8EB82Be5fc2e64e0b57cEb639dF68610b29864E6',
      '0x79E2d470f950f2Cf78eeF41720E8ff2cf4B3CD78',
    );

    await hexHex.deployed();
  });

  describe('mint', function () {
    it('Should emit Minted event', async function () {
      await hexHex.connect(admin).enableMinting();
      const price = await hexHex.price();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price }),
      )
        .to.emit(hexHex, 'Minted')
        .withArgs(minter.address, 0);
    });

    it('Should revert if minting is not enable', async function () {
      const price = await hexHex.price();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price }),
      ).to.be.revertedWith('Minting is not enabled');
    });

    it('Should revert if value is not enough', async function () {
      await hexHex.connect(admin).enableMinting();
      const price = await hexHex.price();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price.sub(1) }),
      ).to.be.revertedWith('Value is not enough');
    });
  });

  describe('setHexCodes', function () {
    it('Should set hex codes', async function () {
      const hexCodes = [
        [0x1f0d39, 0xca0048, 0x386f5b, 0xe16166, 0x134561, 0x73f7c7],
        [0x9144d3, 0xec0de4, 0xf602e9, 0x557530, 0x0af5b7, 0x236292],
        [0x4359fc, 0x3c829e, 0x0d5460, 0x15437a, 0x7b2430, 0xb8bd69],
      ];
      await hexHex.connect(admin).setHexCodes(hexCodes);
      for (let i = 0; i < hexCodes.length; ++i) {
        for (let j = 0; j < hexCodes[i].length; ++j) {
          await expect(await hexHex.hexCodes(i, j)).to.eq(hexCodes[i][j]);
        }
      }
    });
  });
});
