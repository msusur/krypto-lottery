Krypto-Lottery
=====

A basic lottery game implementation on Ethereum blockchain. Lotteries are heavily regulated by the governments, and aim of this project is to show people how easily you can build a lottery system on blockchain without trusting anyone and without spending millions of dollars for building a secure system.

## How does it work?
You need to deploy the [KriptoLottery](./contracts/KriptoLottery.sol) contract to an Ethereum network then you'll have the following features;
- Anyone can send send money to participate to the lottery as many times as they want.
- Default amount is `0.02 ether` unless you state otherwise in the contract constructor.
- Owner can set a ratio to send some or all of the money to a charity account.
- Owner can set a ratio to send some or all of the money to an affiliate account.
- Owner can call `runLottery` function to select a random winner and transfer the balance to charity, affiliate and to the winner. (See [Only owner can run the lottery section for more details](#Only-owner-can-run-the-lottery))

## What's missing?
### Randomness

[Definition from wikipedia](https://en.wikipedia.org/wiki/Randomness) 
>Randomness is the lack of pattern or predictability in events. A random sequence of events, symbols or steps has no order and does not follow an intelligible pattern or combination.

[From Ethereum yellow paper](http://gavwood.com/paper.pdf)
>Providing random numbers within a deterministic system is, naturally, an impossible task. However, we can approximate with pseudo-random numbers by utilizing data which is generally unknowable at the time of transacting. Such data might include the block’s hash, the block’s timestamp, and the block’s beneficiary address. In order to make it hard for a malicious miner to control those values, one should use the BLOCKHASH operation in order to use hashes of the previous 256 blocks as pseudo-random numbers. For a series of such numbers, a trivial solution would be to add some constant amount and hashing the result.

With the descriptions in mind I've used the [solution described by rolandkofler](https://github.com/rolandkofler/ether-entrophy/blob/master/BlockHash2RNG.sol).

Another solution to the randomness could be using an [off the chain random generator](https://blog.oraclize.it/the-random-datasource-chapter-2-779946e54f49) with an oracle.

### User interface
Contract accepts payments and adds everyone to the list of participants. There is no user interface needed.

### Only owner can run the lottery
As the title states, only owner can run the lottery whereas  in a real **trustless** system anyone should be able to run the lottery. Even though this is very easy to implement, it's not that easy to unit test. Unfortunately, I am leaving this feature out until the tests are ready.

## Building the application
Project is using [truffle](truffleframework.com) to compile and deploy the contracts therefore you need to have Nodejs installed.

Run `npm install` to install the dependencies then you can run `npm test` to run the unit tests.

## Installing the application to an Ethereum network
Truffle commands helps you to install the contracts to a network. In this project it's slightly different but more useful. You can either use `npm run migrate` or alternatively if truffle is installed globally you can `truffle migrate` directly with the following arguments. These configurations can be updated by modifying the `./truffle-config.js`

`--network`: name of the network you want to deploy to. You can use `rinkeby` or `mainnet` depends on which one you would like to deploy the contract.

`--accessToken`: Deployment is using [infura](https://infura.io/) to deploy the contract. In order to deploy the contract you need to create an account, obtain the access token, and pass as an argument.

`--mnemonic`: 12 word mnemonic for the deployment account. Your account must have enough ether to cover the gas cost.

```
npm run migrate -- --network <<network>> --accessToken <<token>> --mnemonic <<12 word mnemonic>>
```

## Contribute

I :heart: to see people contributing to this project in any way they can! Also you can reach out to me from twitter [@Mertsusur](https://twitter.com/MertSusur).

I need help;
- for testing the contract.
- for oraclize the randomness.
- unit testing the trustless `runLottery` function.
- adding extra features or maybe even better math calculations.
