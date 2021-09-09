require('dotenv').config();

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HexHex', function () {
  const claimedLootIds = new Array(7777)
    .fill(null)
    .map((_, idx) => 1 + idx)
    .slice(0, 7);
  const ownerClaimedLootIds = new Array(223)
    .fill(null)
    .map((_, idx) => 7778 + idx)
    .slice(0, 7);

  let hexHex;
  let admin;
  let treasury;
  let minter;
  let claimer;

  beforeEach(async function () {
    [admin, treasury, minter, claimer] = await ethers.getSigners();

    const Loot = await ethers.getContractFactory('Loot');
    const loot = await Loot.deploy();
    await loot.deployed();
    await Promise.all(
      claimedLootIds.map((id) => loot.connect(claimer).claim(id)),
    );
    await Promise.all(
      ownerClaimedLootIds.map((id) => loot.connect(admin).ownerClaim(id)),
    );

    const HexHex = await ethers.getContractFactory('HexHex');
    hexHex = await HexHex.deploy(
      process.env.BASE_TOKEN_URI,
      treasury.address,
      loot.address,
    );
    await hexHex.deployed();
  });

  describe('claim', function () {
    it('Should emit Claimed event', async function () {
      const nextClaimableTokenId = await hexHex.nextClaimableTokenId();
      await hexHex.connect(admin).enableClaiming();
      await expect(
        hexHex.connect(claimer).claim(claimer.address, claimedLootIds[0]),
      )
        .to.emit(hexHex, 'Claimed')
        .withArgs(claimer.address, nextClaimableTokenId);
    });

    it('Should revert if claiming is not enabled', async function () {
      await expect(
        hexHex.connect(claimer).claim(claimer.address, claimedLootIds[0]),
      ).to.be.revertedWith('Claiming is not enabled');
      await hexHex.connect(admin).enableClaiming();
      await hexHex.connect(admin).disableClaiming();
      await expect(
        hexHex.connect(claimer).claim(claimer.address, claimedLootIds[0]),
      ).to.be.revertedWith('Claiming is not enabled');
    });

    it('Should revert if claimer is not the owner of given loot', async function () {
      await hexHex.connect(admin).enableClaiming();
      await expect(
        hexHex.connect(claimer).claim(claimer.address, ownerClaimedLootIds[0]),
      ).to.be.revertedWith('Not owner of the loot');
    });

    it('Should revert if token is already claimed by given loot', async function () {
      await hexHex.connect(admin).enableClaiming();
      await hexHex.connect(claimer).claim(claimer.address, claimedLootIds[0]),
        await expect(
          hexHex.connect(claimer).claim(claimer.address, claimedLootIds[0]),
        ).to.be.revertedWith('Already claimed');
    });
  });

  describe('mint', function () {
    it('Should emit Minted event', async function () {
      const price = await hexHex.price();
      const nextMintableTokenId = await hexHex.nextMintableTokenId();
      await hexHex.connect(admin).enableMinting();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price }),
      )
        .to.emit(hexHex, 'Minted')
        .withArgs(minter.address, nextMintableTokenId);
    });

    it('Should transfer value to the treasury', async function () {
      const price = await hexHex.price();
      await hexHex.connect(admin).enableMinting();
      await expect(
        await hexHex.connect(minter).mint(minter.address, { value: price }),
      ).to.changeEtherBalances([treasury, minter], [price, price.mul(-1)]);
    });

    it('Should revert if minting is not enabled', async function () {
      const price = await hexHex.price();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price }),
      ).to.be.revertedWith('Minting is not enabled');
      await hexHex.connect(admin).enableMinting();
      await hexHex.connect(admin).disableMinting();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price }),
      ).to.be.revertedWith('Minting is not enabled');
    });

    it('Should revert if value is wrong', async function () {
      const price = await hexHex.price();
      await hexHex.connect(admin).enableMinting();
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price.sub(1) }),
      ).to.be.revertedWith('Value is wrong');
      await expect(
        hexHex.connect(minter).mint(minter.address, { value: price.add(1) }),
      ).to.be.revertedWith('Value is wrong');
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
