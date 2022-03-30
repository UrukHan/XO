// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Owner.sol";

contract Wallet is Owner {

    event Log(string func, address sender, uint value, bytes data);
    event WalletSet(address indexed oldWallet, address indexed newWallet);

    address payable internal wallet;

    //mapping (address => bool) buyers;

    constructor() {
        wallet = payable(address(this));
        emit WalletSet(address(0), wallet);
    }
    //function getBayers(address _addr) public view isOwner returns(bool) {
    //    return buyers;
    //}
    //function addBayer(address _addr) public isOwner {
    //    buyers[_addr] = true;
    //}

    function getBalance() external view isOwner returns(uint) {
        return wallet.balance;
    }
    function getWallet() external view isOwner returns(address) {
        return address(wallet);
    }
    function setWallet(address newWallet) external isOwner {   // Change wallet
        emit OwnerSet(wallet, newWallet);
        wallet = payable(newWallet);
    }
    function withdraw(address _addr, uint _amount) external isOwner {
        payable(_addr).transfer(_amount);
    }
    // проверить нижние через метамаск

    receive() external virtual payable{
        emit Log('receive', msg.sender, msg.value, "");
    }
}