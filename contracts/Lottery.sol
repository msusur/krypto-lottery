pragma solidity ^0.4.18;

import 'node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract Lottery is Ownable, Pausable {

  uint128 public maxParticipant;
  uint256 public lotteryAmount;
  address public charityAddress;
  address public affiliateAddress;

  mapping(uint => LotteryPlay) public lotteries;
  uint16 public currentLottery;

  struct LotteryPlay {
    uint endBlock;
    uint startBlock;
    bytes32 blockHash;
    address winner;
    Participant[] participants;
  }

  struct Participant {
    address addr;
  }

  function Lottery(uint128 _maxParticipant, uint256 _lotteryAmount) public {
    if (_maxParticipant == 0) {
      maxParticipant = 30;
    } else {
      maxParticipant = _maxParticipant;
    }

    if (_lotteryAmount == 0) {
      lotteryAmount = 0.02 ether;
    } else {
      lotteryAmount = _lotteryAmount;
    }
    paused = true;
    initialise();
    paused = false;
    affiliateAddress = msg.sender;
  }

  function() public payable {
    apply();
  }

  function apply() public payable whenNotPaused returns (uint256) {
    require(lotteries[currentLottery].participants.length + 1 <= maxParticipant);
    require(msg.value == lotteryAmount);

    lotteries[currentLottery].participants.push(Participant(msg.sender));

    return lotteries[currentLottery].participants.length - 1;
  }

  function getCurrentCount() public constant returns (uint256) {
    return lotteries[currentLottery].participants.length;
  }

  function getCurrentLottery() public constant returns(uint endBlock, uint startBlock, bytes32 blockHash, address winner, uint participants) {
    LotteryPlay storage lottery = lotteries[currentLottery];
    return (lottery.endBlock, lottery.startBlock, lottery.blockHash, lottery.winner, lottery.participants.length);
  }

  // Admin tools

  function initialise() public whenPaused onlyOwner {
    require(this.balance == 0);
    currentLottery++;
    lotteries[currentLottery].startBlock = block.number;
    lotteries[currentLottery].blockHash = block.blockhash(lotteries[currentLottery].startBlock);
    lotteries[currentLottery].endBlock = block.number + 38117;
  }

  function setParticipantsNumber(uint128 newNumber) public onlyOwner {
    maxParticipant = newNumber;
  }

  function setCharityAddress(address _newCharityAddress) public onlyOwner {
    require(_newCharityAddress != address(0));
    charityAddress = _newCharityAddress;
  }

  function setAffiliateAddress(address _newAffiliate) public onlyOwner {
    require(_newAffiliate != address(0));
    affiliateAddress = _newAffiliate;
  }

  function runLottery() public onlyOwner returns (uint256, address) {
    require(charityAddress != address(0));
    require(lotteries[currentLottery].participants.length >= 2);
    paused = true;

    charityAddress.transfer(this.balance / 10);

    uint256 randomValue = random();
    address winner = lotteries[currentLottery].participants[randomValue].addr;
    winner.transfer(this.balance);
    lotteries[currentLottery].winner = winner;

    initialise();
    paused = false;

    return (randomValue, winner);
  }

  // Helper functions

  function random() internal view returns(uint256) {
    uint256 r1 = uint256(block.blockhash(block.number-1));
    uint256 r2 = uint256(block.blockhash(lotteries[currentLottery].startBlock));

    uint256 val;

    assembly {
      val := xor(r1, r2)
    }
    return val % lotteries[currentLottery].participants.length;
  }
  
}