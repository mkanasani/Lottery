const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Lotto = artifacts.require('Lotto.sol');

const balances = async addresses => {
  const balanceResults = await Promise.all(addresses.map(address =>
    web3.eth.getBalance(address)
  ));
  return balanceResults.map(balance => web3.utils.toBN(balance));
};

contract('Lotto', (accounts) => {
  let lotto;
  beforeEach(async () => {
    lotto = await Lotto.new(2);
  });
  
  it('Should NOT create bet if not owner', async () => {
    await expectRevert(
      lotto.createBet(5, 5, {from: accounts[1]}),
      'only owner is allowed'
    );
  });

  it('Should NOT create bet if state not idle', async () => {
    await lotto.createBet(5, 5),
    await expectRevert(
      lotto.createBet(5, 5),
      'Not allowed'
    );
  });

  it('Should create a bet', async () => {
    await lotto.createBet(10, 20);
    const betCount = await lotto.betCount();
    const betSize = await lotto.betSize();
    const currentState = await lotto.currentState();
    assert(betCount.toNumber() === 10);
    assert(betSize.toNumber() === 20);
    assert(currentState.toNumber() === 1);
  });

  it('Should NOT bet if not in state BETTING', async () => {
    await expectRevert( 
      lotto.bet({value: 100, from: accounts[1]}),
      'Not allowed'
    );
  });

  it('Should NOT bet if not sending exact bet amount', async () => {
    await lotto.createBet(3, 20);
    await expectRevert( 
      lotto.bet({value: 100, from: accounts[1]}),
      'must match the bet size'
    );
    await expectRevert( 
      lotto.bet({value: 15, from: accounts[2]}),
      'must match the bet size'
    );
  });

  it('Should bet', async () => {
    const players = [accounts[1], accounts[2], accounts[3]];
    await lotto.createBet(3, web3.utils.toWei('1', 'ether'));

    const balancesBefore = await balances(players); 
    const txs = await Promise.all(players.map(player => lotto.bet({
      value: web3.utils.toWei('1', 'ether'), 
      from: player,
      gasPrice: 1
    })))
    const balancesAfter = await balances(players); 
    const result = players.some((_player, i) => {
      const gasUsed = web3.utils.toBN(txs[i].receipt.gasUsed);
      const expected = web3.utils.toBN(web3.utils.toWei('1.94', 'ether'));
      return balancesAfter[i].sub(balancesBefore[i]).add(gasUsed).eq(expected);
    });
    assert(result === true);
  });

  it('Should NOT cancel if not betting', async () => {
    await expectRevert(
      lotto.cancel({from: accounts[1]}),
      'Not allowed'
    );
  });

  it('Should NOT cancel if not admin', async () => {
    await lotto.createBet(3, 100);
    await expectRevert(
      lotto.cancel({from: accounts[1]}),
      'only owner is allowed'
    );
  });

  it('Should cancel', async () => {
    await lotto.createBet(3, 100);
    await lotto.cancel();
    const state = await lotto.currentState();
    assert(state.toNumber() === 0);
  });
});