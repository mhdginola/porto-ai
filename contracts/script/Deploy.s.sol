// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SubscriptionPayments} from "../src/SubscriptionPayments.sol";

/// Usage (Base Sepolia):
///   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify \
///     --account deployer   # key stored with `cast wallet import deployer --interactive`
/// Env: PAYMENT_TOKEN (default Circle test USDC), PAYMENT_TREASURY, PAYMENT_SIGNER.
contract Deploy is Script {
    address internal constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external returns (SubscriptionPayments payments) {
        address token = vm.envOr("PAYMENT_TOKEN", BASE_SEPOLIA_USDC);
        address treasury = vm.envAddress("PAYMENT_TREASURY");
        address signer = vm.envAddress("PAYMENT_SIGNER");

        vm.startBroadcast();
        payments = new SubscriptionPayments(IERC20(token), treasury, signer);
        vm.stopBroadcast();

        console.log("SubscriptionPayments:", address(payments));
        console.log("token:", token);
        console.log("treasury:", treasury);
        console.log("signer:", signer);
    }
}
