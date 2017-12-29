pragma solidity ^0.4.18;

import 'node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract KriptoLottery is Ownable, Pausable {
  // wait for approx. 1 week.
  uint constant NEXT_LOTTERY_WAIT_TIME_IN_BLOCKS = 38117;

  event LotteryRunFinished(address winner, uint256 charityAmount, uint256 affiliateAmount, uint256 jackpot);
  event ApplicationDone(uint applicationNumber);

  uint128 public maxParticipant;
  uint256 public lotteryAmount;
  address public charityAddress;
  address public affiliateAddress;
  uint256 public totalGivenAmount;
  uint256 public totalDonation;
  uint256 public totalAffiliateAmount;
  uint16 public donationRatio;
  uint16 public affiliateRatio;

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

  function KriptoLottery(uint128 _maxParticipant, uint256 _lotteryAmount) public {
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
    charityAddress = msg.sender;
    donationRatio = 100;
    affiliateRatio = 0;
  }

  function() public payable {
    apply();
  }

  function apply() public payable whenNotPaused returns (uint256) {
    // Anyone can apply as much as they want.
    require(lotteries[currentLottery].participants.length + 1 <= maxParticipant);
    require(msg.value == lotteryAmount);

    lotteries[currentLottery].participants.push(Participant(msg.sender));
    ApplicationDone(lotteries[currentLottery].participants.length - 1);
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
    // Balance should be 0 in order to start a new lottery.
    // otherwise you might end up **stealing** others money.
    require(this.balance == 0);
    currentLottery++;
    lotteries[currentLottery].startBlock = block.number;
    lotteries[currentLottery].blockHash = block.blockhash(lotteries[currentLottery].startBlock);
    // Set the next waiting time to apprx. 1 week.
    // This is not working since I couldn't find a good way to unit test this.
    lotteries[currentLottery].endBlock = block.number + NEXT_LOTTERY_WAIT_TIME_IN_BLOCKS;
  }

  function setParticipantsNumber(uint128 newNumber) public onlyOwner {
    maxParticipant = newNumber;
  }

  function setAffiliateRatio(uint16 newRatio) public onlyOwner {
    require(newRatio < 101);
    require(newRatio + donationRatio < 101);
    affiliateRatio = newRatio;
  }

  function setAffiliateAddress(address _newAffiliate) public onlyOwner {
    require(_newAffiliate != address(0));
    affiliateAddress = _newAffiliate;
  }

  function setCharityAddress(address _newCharityAddress) public onlyOwner {
    require(_newCharityAddress != address(0));
    charityAddress = _newCharityAddress;
  }
  
  function setDonationRatio(uint16 newRatio) public onlyOwner {
    require(newRatio < 101);
    require(newRatio + affiliateRatio < 101);
    donationRatio = newRatio;
  }

  function runLottery() public onlyOwner returns (uint256, address) {
    require(charityAddress != address(0));
    require(lotteries[currentLottery].participants.length >= 2);
    // Uncomment the line below, *if* you can find a way to unit test
    //    this logic.
    // require(lotteries[currentLottery].endBlock < block.number);
    paused = true;

    // send money to charity account.
    uint256 charityAmount = (this.balance * donationRatio) / 100;
    charityAddress.transfer(charityAmount);
    totalDonation += charityAmount;

    // send money to an affiliate address to cover the costs.
    uint256 affiliateAmount = (this.balance * affiliateRatio) / 100;
    affiliateAddress.transfer(affiliateAmount);
    totalAffiliateAmount += affiliateAmount;

    // random winner.
    uint256 randomValue = random();
    address winner = lotteries[currentLottery].participants[randomValue].addr;

    // send the rest of the funds to the winner if anything is left.
    uint256 winningPrice = this.balance;
    if (winningPrice > 0) {
      winner.transfer(winningPrice);
    }
    
    lotteries[currentLottery].winner = winner;
    totalGivenAmount += winningPrice;

    // initialise a new one.
    initialise();
    paused = false;
    LotteryRunFinished(winner, charityAmount, affiliateAmount, winningPrice);
    return (randomValue, winner);
  }

  // Helper functions

  function random() internal view returns(uint256) {
    // I know, I know. I should have use a proper off the chain random generator.
    // Why not implement oraclize and send a pull request?
    uint256 r1 = uint256(block.blockhash(block.number-1));
    uint256 r2 = uint256(block.blockhash(lotteries[currentLottery].startBlock));

    uint256 val;

    assembly {
      val := xor(r1, r2)
    }
    return val % lotteries[currentLottery].participants.length;
  }
  
}