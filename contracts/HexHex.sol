//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract HexHex is
    Context,
    Ownable,
    ERC721Enumerable,
    ERC721Pausable,
    ERC721Burnable
{
    using Counters for Counters.Counter;

    Counters.Counter private _nextTokenId;
    string private _baseTokenURI;
    address payable private _treasury;
    IERC721 private _loot;

    bool public isClaimingEnabled;
    mapping(uint256 => bool) public isClaimedByLootId;
    bool public isMintingEnabled;
    uint256 public price = 0.08 ether;
    uint24[6][] public hexCodes;

    event Minted(address indexed minter, uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address payable treasury,
        address loot
    ) ERC721(name, symbol) {
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
        require(_msgSender() == _loot.ownerOf(lootId), 'Not owner');
        require(!isClaimedByLootId[lootId], 'Already claimed');
        isClaimedByLootId[lootId] = true;
        _mint(to, _nextTokenId.current());
        _nextTokenId.increment();
    }

    function enableMinting() public onlyOwner {
        isMintingEnabled = true;
    }

    function disableMinting() public onlyOwner {
        isMintingEnabled = false;
    }

    function mint(address to) payable public {
        require(isMintingEnabled, 'Minting is not enabled');
        require(msg.value >= price, 'Value is not enough');

        uint256 newTokenId = _nextTokenId.current();
        _nextTokenId.increment();

        _mint(to, newTokenId);
        _treasury.transfer(price);

        uint256 refund = msg.value - price;
        if (refund > 0) {
            payable(_msgSender()).transfer(refund);
        }

        emit Minted(_msgSender(), newTokenId);
    }

    // Store hex codes on chain
    // TODO: Generate on-chain would be better?
    function setHexCodes(uint24[6][] memory hexCodes_) public onlyOwner {
        hexCodes = hexCodes_;
    }

    function pauseTransfer() public onlyOwner {
        _pause();
    }

    function unpauseTransfer() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) {
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
