// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {SubscriptionPayments} from "../src/SubscriptionPayments.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract SubscriptionPaymentsTest is Test {
    MockUSDC internal usdc;
    SubscriptionPayments internal payments;

    address internal treasury = makeAddr("treasury");
    address internal payer = makeAddr("payer");
    uint256 internal signerKey = 0xA11CE;
    address internal signer;

    bytes32 internal constant INVOICE = keccak256("porto-pay-invoice-1");
    uint256 internal constant AMOUNT = 1_098_900; // 1.0989 USDC (6 decimals)

    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 amount);

    function setUp() public {
        signer = vm.addr(signerKey);
        usdc = new MockUSDC();
        payments = new SubscriptionPayments(IERC20(address(usdc)), treasury, signer);
        usdc.mint(payer, 100e6);
        vm.prank(payer);
        usdc.approve(address(payments), type(uint256).max);
    }

    function _sign(uint256 key, bytes32 invoiceId, uint256 amount, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(abi.encode(payments.QUOTE_TYPEHASH(), invoiceId, amount, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", payments.domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_PaysInvoiceAndForwardsToTreasury() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerKey, INVOICE, AMOUNT, deadline);

        vm.expectEmit(true, true, false, true, address(payments));
        emit InvoicePaid(INVOICE, payer, AMOUNT);
        vm.prank(payer);
        payments.pay(INVOICE, AMOUNT, deadline, sig);

        assertEq(usdc.balanceOf(treasury), AMOUNT);
        assertEq(usdc.balanceOf(address(payments)), 0, "contract must not hold funds");
        assertEq(payments.paidBy(INVOICE), payer);
    }

    function test_RevertsWhenInvoiceAlreadyPaid() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerKey, INVOICE, AMOUNT, deadline);
        vm.prank(payer);
        payments.pay(INVOICE, AMOUNT, deadline, sig);

        vm.expectRevert(abi.encodeWithSelector(SubscriptionPayments.AlreadyPaid.selector, INVOICE));
        vm.prank(payer);
        payments.pay(INVOICE, AMOUNT, deadline, sig);
    }

    function test_RevertsWhenAmountTampered() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerKey, INVOICE, AMOUNT, deadline);
        vm.expectRevert(SubscriptionPayments.InvalidQuoteSignature.selector);
        vm.prank(payer);
        payments.pay(INVOICE, 1, deadline, sig); // pay 0.000001 USDC with a quote for 1.0989
    }

    function test_RevertsWhenSignedByAnotherKey() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(0xBAD, INVOICE, AMOUNT, deadline);
        vm.expectRevert(SubscriptionPayments.InvalidQuoteSignature.selector);
        vm.prank(payer);
        payments.pay(INVOICE, AMOUNT, deadline, sig);
    }

    function test_RevertsWhenQuoteExpired() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerKey, INVOICE, AMOUNT, deadline);
        vm.warp(deadline + 1);
        vm.expectRevert(abi.encodeWithSelector(SubscriptionPayments.QuoteExpired.selector, deadline));
        vm.prank(payer);
        payments.pay(INVOICE, AMOUNT, deadline, sig);
    }

    function test_RevertsOnZeroAmount() public {
        vm.expectRevert(SubscriptionPayments.ZeroAmount.selector);
        payments.pay(INVOICE, 0, block.timestamp, "");
    }

    function test_RevertsWithoutAllowance() public {
        address stranger = makeAddr("stranger");
        usdc.mint(stranger, AMOUNT);
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerKey, INVOICE, AMOUNT, deadline);
        vm.expectRevert(
            abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, address(payments), 0, AMOUNT)
        );
        vm.prank(stranger);
        payments.pay(INVOICE, AMOUNT, deadline, sig);
        assertEq(payments.paidBy(INVOICE), address(0), "failed payment must not mark the invoice paid");
    }

    function test_ConstructorRejectsZeroAddresses() public {
        vm.expectRevert(SubscriptionPayments.ZeroAddress.selector);
        new SubscriptionPayments(IERC20(address(0)), treasury, signer);
    }

    /// Any amount / payer with a valid quote moves exactly `amount` to the treasury.
    function testFuzz_PayMovesExactAmount(uint96 amount, address who, bytes32 invoiceId) public {
        vm.assume(amount > 0 && who != address(0) && who != treasury && who != address(payments));
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(payments), amount);
        uint256 deadline = block.timestamp + 1;
        bytes memory sig = _sign(signerKey, invoiceId, amount, deadline);

        uint256 before = usdc.balanceOf(treasury);
        vm.prank(who);
        payments.pay(invoiceId, amount, deadline, sig);
        assertEq(usdc.balanceOf(treasury) - before, amount);
        assertEq(payments.paidBy(invoiceId), who);
    }
}
