//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';

contract HexHex is Context, Ownable, ERC721Enumerable, ERC721Burnable {
    uint256 public nextClaimableTokenId = 1;
    uint256 public nextMintableTokenId = 8001;
    string private _baseTokenURI;
    address payable private _treasury;
    IERC721 private _loot;

    uint256 public price = 0.02 ether;
    uint256 public maxSupplyClaimable = 8000;
    uint256 public maxSupply = 16000;
    bool public isClaimingEnabled;
    mapping(uint256 => bool) public isClaimedByLootId;
    bool public isMintingEnabled;
    uint24[6][] public hexCodes;

    event Claimed(address indexed claimer, uint256 indexed tokenId);
    event Minted(address indexed minter, uint256 indexed tokenId);

    constructor(
        string memory baseTokenURI,
        address payable treasury,
        address loot
    ) ERC721('HexHex', 'HEX') {
        _baseTokenURI = baseTokenURI;
        _treasury = treasury;
        _loot = IERC721(loot);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseTokenURI(string memory baseTokenURI) public onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    function enableClaiming() public onlyOwner {
        isClaimingEnabled = true;
    }

    function disableClaiming() public onlyOwner {
        isClaimingEnabled = false;
    }

    function claim(address to, uint256 lootId) public {
        require(isClaimingEnabled, 'Claiming is not enabled');
        require(
            nextClaimableTokenId <= maxSupplyClaimable,
            'All tokens are claimed'
        );
        require(_msgSender() == _loot.ownerOf(lootId), 'Not owner of the loot');
        require(!isClaimedByLootId[lootId], 'Already claimed');

        isClaimedByLootId[lootId] = true;

        uint256 newTokenId = nextClaimableTokenId;
        ++nextClaimableTokenId;

        _mint(to, newTokenId);

        emit Claimed(_msgSender(), newTokenId);
    }

    function enableMinting() public onlyOwner {
        isMintingEnabled = true;
    }

    function disableMinting() public onlyOwner {
        isMintingEnabled = false;
    }

    function mint(address to) public payable {
        require(isMintingEnabled, 'Minting is not enabled');
        require(nextMintableTokenId <= maxSupply, 'All tokens are minted');
        require(msg.value == price, 'Value is wrong');

        uint256 newTokenId = nextMintableTokenId;
        ++nextMintableTokenId;

        _mint(to, newTokenId);
        _treasury.transfer(price);

        emit Minted(_msgSender(), newTokenId);
    }

    function withdraw() public onlyOwner {
        _treasury.transfer(address(this).balance);
    }

    // Store hex codes on chain
    function setHexCodes(uint24[6][] memory hexCodes_) public onlyOwner {
        hexCodes = hexCodes_;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
