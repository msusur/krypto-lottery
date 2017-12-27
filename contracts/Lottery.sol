pragma solidity ^0.4.18;

import 'node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract Lottery is Ownable, Pausable {
  uint128 public maxParticipant;
  uint256 public lotteryAmount;
  // address public charityAddress;
  Participant[] private participants;

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

    owner = msg.sender;
  }

  function() public payable {
    apply();
  }

  function apply() public payable whenNotPaused returns (uint256) {
    require(participants.length + 1 <= maxParticipant);
    require(msg.value == lotteryAmount);

    participants.push(Participant(msg.sender));

    return participants.length - 1;
  }

  function setParticipantsNumber(uint128 newNumber) public onlyOwner {
    maxParticipant = newNumber;
  }

  // function setCharityAddress(address _newCharityAddress) public onlyOwner {
  //   charityAddress = _newCharityAddress;
  // }

  function getCurrentCount() public constant returns (uint256) {
    return participants.length;
  }

  function runLottery() public onlyOwner returns (uint256) {
    paused = true;

    msg.sender.transfer(this.balance / 10);
    // TODO RANDOMNESS.

    return 0;
  }
  
}