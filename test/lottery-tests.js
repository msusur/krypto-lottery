const KriptoLottery = artifacts.require("KriptoLottery");

const isRevertError = (error) => {
  const invalidOpcode = error.message.search('invalid opcode') >= 0;
  const outOfGas = error.message.search('out of gas') >= 0;
  const revert = error.message.search('revert') >= 0;
  return invalidOpcode || outOfGas || revert;
}

contract('KriptoLottery', accounts => {
  let lottery;
  const owner = accounts[0],
    someone = accounts[1],
    someone2 = accounts[2],
    charity = accounts[3],
    affiliate = accounts[4];

  describe('constructor', () => {
    it('should set the participant number 30 by default', async() => {
      lottery = await KriptoLottery.new();

      const maxCount = await lottery.maxParticipant.call();

      assert.equal(30, maxCount);
    });

    it('should set the participant count if value exists', async() => {
      lottery = await KriptoLottery.new(100, 0);

      const maxCount = await lottery.maxParticipant.call();

      assert.equal(100, maxCount);
    });

    it('should set the owner', async() => {
      lottery = await KriptoLottery.new();

      const ownerAddress = await lottery.owner.call();

      assert.equal(owner, ownerAddress);
    });

    it('should set the lottery amount to 0.02 eth by default', async() => {
      lottery = await KriptoLottery.new();

      const amount = await lottery.lotteryAmount.call();

      assert.equal(web3.toWei(0.02, 'ether'), amount);
    });

    it('should set the lottery amount if the value exists', async() => {
      lottery = await KriptoLottery.new(10, web3.toWei(1, 'ether'));

      const amount = await lottery.lotteryAmount.call();

      assert.equal(web3.toWei(1, 'ether'), amount);
    });

    it('should set the current lottery to one', async() => {
      lottery = await KriptoLottery.new(10, web3.toWei(1, 'ether'));

      const amount = await lottery.currentLottery.call();

      assert.equal(1, amount);
    });

    it('should initialise the first lottery', async() => {
      lottery = await KriptoLottery.new();

      const currentLottery = await lottery.getCurrentLottery();

      assert.ok(currentLottery[0] > 0);
    });

    it('should set the affiliate address as owner', async() => {
      lottery = await KriptoLottery.new();

      const affiliateAddress = await lottery.affiliateAddress.call();

      assert.equal(owner, affiliateAddress);
    });

    it('should set the charity address as owner', async() => {
      lottery = await KriptoLottery.new();

      const charityAddress = await lottery.charityAddress.call();

      assert.equal(owner, charityAddress);
    });

    it('should initialise the donation ratio to 100%', async() => {
      lottery = await KriptoLottery.new();

      const ratio = await lottery.donationRatio.call();

      assert.equal(100, ratio);
    });

    it('should initialise the affiliate ratio to 0', async() => {
      lottery = await KriptoLottery.new();

      const ratio = await lottery.affiliateRatio.call();

      assert.equal(0, ratio);
    });
  });

  describe('lottery functions', () => {
    beforeEach(async() => {
      lottery = await KriptoLottery.new(30, 0);
    });

    describe('setMaxParticipants', () => {
      it('should increase the max number of people', async() => {
        await lottery.setParticipantsNumber(500);

        const newMax = await lottery.maxParticipant.call();

        assert.equal(500, newMax);
      });

      it('should not set the max number of people if it was not the owner', async() => {
        try {
          await lottery.setParticipantsNumber(500, { from: someone });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }

        // Fail
        assert.fail('Failed');
      });
    });

    describe('apply function', () => {
      it('should not work when paused', async() => {
        await lottery.pause();

        try {
          await lottery.apply();
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }

        // Fail
        assert.fail('Failed');
      });

      it('should increase the balance by lottery payment amount', async() => {
        await lottery.apply({ value: web3.toWei(0.02, 'ether') });

        const balance = web3.eth.getBalance(lottery.address).toNumber();

        assert.equal(web3.toWei(0.02, 'ether'), balance);
      });

      it('should increase the currentCount by 1', async() => {
        await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: someone });

        const currentCount = await lottery.getCurrentCount();

        assert.equal(1, currentCount);
      });

      it('should allow multiple application from the same person', async() => {
        await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: someone });
        await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: someone });

        const currentCount = await lottery.getCurrentCount();

        assert.equal(2, currentCount);
      });

      it('should not work when max number of people exceeds', async() => {
        lottery = await KriptoLottery.new(2, 0);

        await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: someone });
        await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: someone2 });

        try {
          await lottery.apply({ value: web3.toWei(0.02, 'ether'), from: owner });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }

        // Fail
        assert.fail('Failed');
      });

      it('should not work when the payment is less than the deposit', async() => {

        try {
          await lottery.apply({ value: web3.toWei(0.0199, 'ether') });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }

        // Fail
        assert.fail('Failed');
      });

      it('should not work when the payment is more than the deposit', async() => {

        try {
          await lottery.apply({ value: web3.toWei(0.3, 'ether') });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }

        // Fail
        assert.fail('Failed');
      });
    });

    describe('setAffiliateAddress', () => {
      it('should only run by owner', async() => {
        try {
          await lottery.setAffiliateAddress(affiliate, { from: someone });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should require the address is not null', async() => {
        try {
          await lottery.setAffiliateAddress(null, { from: someone });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should set affiliate address', async() => {
        await lottery.setAffiliateAddress(affiliate, { from: owner });

        const affiliateAddress = await lottery.affiliateAddress.call();

        assert.equal(affiliate, affiliateAddress);
      });
    });

    describe('default function', () => {
      it('should accept payment and increase participants by one', async() => {
        await lottery.sendTransaction({ value: web3.toWei(0.02, 'ether'), from: someone });

        const currentCount = await lottery.getCurrentCount();
        const balance = web3.eth.getBalance(lottery.address).toNumber();

        assert.equal(1, currentCount);
        assert.equal(web3.toWei(0.02, 'ether'), balance);
      });
    });

    describe('run lottery', () => {
      it('should only run by owner', async() => {
        try {
          await lottery.runLottery({ from: someone });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });

      it('should require charity address not null', async() => {
        try {
          await lottery.runLottery({ from: owner });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should not run with less than two participant', async() => {
        try {
          // try with zero participant
          await lottery.runLottery({ from: owner });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }

        await lottery.apply({ value: web3.toWei(0.02, 'ether') });
        try {
          // try with one participant
          await lottery.runLottery({ from: owner });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should unpause the contract', async() => {
        await lottery.setCharityAddress(charity, { from: owner });
        await lottery.apply({ value: web3.toWei(0.02, 'ether') });
        await lottery.apply({ value: web3.toWei(0.02, 'ether') });
        await lottery.apply({ value: web3.toWei(0.02, 'ether') });

        await lottery.runLottery({ from: owner });

        const paused = await lottery.paused.call();

        assert.ok(!paused);
      });

      it('should get 10% cut to charity account', async() => {

        lottery = await KriptoLottery.new(5, web3.toWei(5, 'ether'));

        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });

        const balance = web3.eth.getBalance(lottery.address).toNumber();
        const ownerBalance = web3.eth.getBalance(charity).toNumber();

        await lottery.setCharityAddress(charity, { from: owner });
        await lottery.runLottery({ from: owner });

        const newBalance = web3.eth.getBalance(charity).toNumber();

        assert.ok(newBalance > ownerBalance);
      });

      it('should initialise a new lottery', async() => {
        lottery = await KriptoLottery.new(5, web3.toWei(5, 'ether'));

        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });

        await lottery.setCharityAddress(charity, { from: owner });
        await lottery.runLottery({ from: owner });

        const currentLottery = await lottery.currentLottery.call();

        assert.equal(2, currentLottery);
      });

      it('should not send affiliate to affiliate account by default', async() => {
        lottery = await KriptoLottery.new(5, web3.toWei(5, 'ether'));

        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });

        await lottery.setCharityAddress(charity);
        await lottery.setAffiliateAddress(affiliate);

        const affiliateInitialBalance = web3.eth.getBalance(affiliate).toNumber();

        await lottery.runLottery({ from: owner });

        const newBalance = web3.eth.getBalance(affiliate).toNumber();

        assert.ok(newBalance == affiliateInitialBalance);
      });

      it('should send affiliate amount to affiliate account', async() => {
        lottery = await KriptoLottery.new(5, web3.toWei(5, 'ether'));

        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });

        await lottery.setCharityAddress(charity);
        await lottery.setAffiliateAddress(affiliate);
        await lottery.setDonationRatio(0);
        await lottery.setAffiliateRatio(90);

        const affiliateInitialBalance = web3.eth.getBalance(affiliate).toNumber();


        await lottery.runLottery({ from: owner });

        const newBalance = web3.eth.getBalance(affiliate).toNumber();

        assert.ok(newBalance > affiliateInitialBalance);
      });

      it('should update the total prize fields', async() => {
        lottery = await KriptoLottery.new(5, web3.toWei(5, 'ether'));

        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });
        await lottery.apply({ value: web3.toWei(5, 'ether') });

        await lottery.setCharityAddress(charity);
        await lottery.setAffiliateAddress(affiliate);
        await lottery.setDonationRatio(30);
        await lottery.setAffiliateRatio(30);

        await lottery.runLottery({ from: owner });

        const totalMoneyWon = await lottery.totalGivenAmount.call();
        assert.ok(totalMoneyWon > 0);

        const totalDonation = await lottery.totalDonation.call();
        assert.ok(totalDonation > 0);

        const totalAffiliateWon = await lottery.totalAffiliateAmount.call();
        assert.ok(totalAffiliateWon > 0);
      });
    });

    describe('initialise new lottery', () => {
      it('should not run by non-owner', async() => {
        await lottery.pause({ from: owner });
        try {
          await lottery.initialise({ from: someone });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should not run unpaused', async() => {
        try {
          await lottery.initialise({ from: owner });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should create a new lottery and increase the number', async() => {
        await lottery.pause();

        await lottery.initialise();

        const currentLottery = await lottery.currentLottery.call();

        assert.equal(2, currentLottery);
      });

      it('should not run if there is money left in the contract', async() => {
        await lottery.apply({ value: web3.toWei(0.02, 'ether') });

        await lottery.pause();

        try {
          await lottery.initialise();
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }

        assert.fail('failed');
      });
    });

    describe('set charity account', () => {
      it('should not run by non-owner', async() => {
        try {
          await lottery.setCharityAddress(charity, { from: someone });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should not allow set empty address', async() => {
        try {
          await lottery.setCharityAddress(null, { from: owner });
        } catch (error) {
          assert.ok(isRevertError(error));
          return;
        }
        assert.fail('failed');
      });

      it('should set the new address', async() => {
        await lottery.setCharityAddress(charity, { from: owner });

        const charityAddress = await lottery.charityAddress.call();

        assert.equal(charity, charityAddress);
      });

      // it('should set the new address', async() => {
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });
      //   await lottery.apply({ value: web3.toWei(0.02, 'ether') });


      //   const random = await lottery.runLottery();

      //   console.log(random[0], random[1]);
      // });
    });

    describe('setAffiliateRatio', () => {
      it('should only run by owner', async() => {
        try {
          await lottery.setAffiliateRatio(10, { from: someone });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });

      it('should not be more than 100', async() => {
        try {
          await lottery.setAffiliateRatio(110, { from: owner });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });

      it('should set the ratio', async() => {
        await lottery.setDonationRatio(10, { from: owner });

        await lottery.setAffiliateRatio(10, { from: owner });

        const ratio = await lottery.affiliateRatio.call();

        assert(10, ratio);
      });

      it('should be aware of total distribution ratio', async() => {
        await lottery.setDonationRatio(100, { from: owner });
        try {
          await lottery.setAffiliateRatio(10, { from: owner });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });
    });

    describe('setDonationRatio', () => {
      it('should only run by owner', async() => {
        try {
          await lottery.setDonationRatio(10, { from: someone });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });

      it('should set the ratio', async() => {
        await lottery.setDonationRatio(10, { from: owner });

        const ratio = await lottery.donationRatio.call();

        assert(10, ratio);
      });

      it('should not be more than 100', async() => {
        try {
          await lottery.setDonationRatio(110, { from: owner });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });

      it('should be aware of total distribution ratio', async() => {
        await lottery.setDonationRatio(0, { from: owner });

        await lottery.setAffiliateRatio(100, { from: owner });
        try {
          await lottery.setDonationRatio(10, { from: owner });
        } catch (error) {
          assert.equal(isRevertError(error), true);
          return;
        }
        assert.fail('failed');
      });
    });
  });
});