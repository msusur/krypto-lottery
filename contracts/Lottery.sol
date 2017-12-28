pragma solidity ^0.4.18;

import 'node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract Lottery is Ownable, Pausable {
  uint128 public maxParticipant;
  uint256 public lotteryAmount;
  address public charityAddress;

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

  function getCurrentCount() public constant returns (uint256) {
    return lotteries[currentLottery].participants.length;
  }

  function getCurrentLottery() public constant returns(uint endBlock, uint startBlock, bytes32 blockHash, address winner, uint participants) {
    LotteryPlay storage lottery = lotteries[currentLottery];
    return (lottery.endBlock, lottery.startBlock, lottery.blockHash, lottery.winner, lottery.participants.length);
  }

  function runLottery() public onlyOwner returns (uint256) {
    paused = true;

    charityAddress.transfer(this.balance / 10);
    // TODO RANDOMNESS.
    msg.sender.transfer(this.balance);
    initialise();
    paused = false;
    return 0;
  }
  
}