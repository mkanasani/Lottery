pragma solidity ^0.8.11;

/// @title A lottery that accepts bets in ETH and run the random lotto, picks winner & transfers the winnings.

contract Lotto {
    
    enum State {
        IDLE,
        BETTING
    }

    address payable[] public players;
    State public currentState= State.IDLE;
    uint public betCount;
    uint public betSize;
    uint public houseFee;
    address public owner;

    modifier Status(State state) {
        require(state == currentState, 'Not allowed');
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'only owner is allowed');
        _;
    }

    constructor(uint fee) {
        require(fee > 1 && fee < 99, 'House fee must be in between 1 - 99');
        fee = houseFee;
    }

    function createBet(uint count, uint size) external Status(State.IDLE) onlyOwner {
        betCount = count;
        betSize = size;
        currentState = State.BETTING;
    }

    function bet() external payable Status(State.BETTING) {
        require(msg.value == betSize, 'must match the bet size');
        players.push(payable(msg.sender));
        if(players.length == betCount ) {
            uint winner = _randomModulo(betCount);
            players[winner].transfer((betSize * betCount) * (100 - houseFee) / 100);
            currentState = State.IDLE;
            delete players;
        }
    }
    
    function cancel() external Status(State.BETTING) onlyOwner() {
        for(uint i = 0; i < players.length; i++) {
            players[i].transfer(betSize);
        }
        delete players;
        currentState = State.IDLE;
    }
    
    function _randomModulo(uint modulo) view internal returns(uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % modulo;
    }

}