// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CrystalReferralManager {

    mapping(string => address) public refToAddress;
    mapping(address => string) public addressToRef;
    mapping(address => uint256) public referrerToReferredAddresses;
    mapping(address => address) public addressToReferrer;
    mapping(address => string) public addressToUsername;
    mapping(string => address) public usernameToAddress;

    event Referral(address indexed referrer, address referee);
    event Username(address indexed caller, string username);

    error RefCodeAlreadyTaken();
    error UsernameAlreadyTaken();

    function setReferral(string memory code) external {
        bytes memory codeBytes = bytes(code);
        for (uint i = 0; i < codeBytes.length; i++) {
            if (codeBytes[i] >= 0x41 && codeBytes[i] <= 0x5A) {
                codeBytes[i] = bytes1(uint8(codeBytes[i]) + 32);
            }
        }
        code = string(codeBytes);
        if (refToAddress[code] != address(0) || bytes(code).length == 0) {
            revert RefCodeAlreadyTaken();
        }
        if (bytes(addressToRef[msg.sender]).length != 0) {
            refToAddress[addressToRef[msg.sender]] = address(0);
        }
        addressToRef[msg.sender] = code;
        refToAddress[code] = msg.sender;
    }

    function setUsedRef(string memory code) external {
        bytes memory codeBytes = bytes(code);
        for (uint i = 0; i < codeBytes.length; i++) {
            if (codeBytes[i] >= 0x41 && codeBytes[i] <= 0x5A) {
                codeBytes[i] = bytes1(uint8(codeBytes[i]) + 32);
            }
        }
        code = string(codeBytes);
        if (addressToReferrer[msg.sender] != address(0)) {
            referrerToReferredAddresses[addressToReferrer[msg.sender]] -= 1;
        }
        address referrer = refToAddress[code];
        if (referrer != address(0) && bytes(code).length != 0) {
            referrerToReferredAddresses[referrer] += 1;
            addressToReferrer[msg.sender] = referrer;
            emit Referral(referrer, msg.sender);
        }
    }

    function setUsername(string memory username) external {
        if (usernameToAddress[username] != address(0) || bytes(username).length == 0) {
            revert UsernameAlreadyTaken();
        }
        if (bytes(addressToUsername[msg.sender]).length != 0) {
            usernameToAddress[addressToUsername[msg.sender]] = address(0);
        }
        addressToUsername[msg.sender] = username;
        usernameToAddress[username] = msg.sender;
        emit Username(msg.sender, username);
    }
}