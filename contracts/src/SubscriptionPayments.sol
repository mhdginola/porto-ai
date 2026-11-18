// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title SubscriptionPayments
/// @notice Pays subscription invoices in an ERC-20 stablecoin (USDC).
/// @dev The billing server signs an EIP-712 quote {invoiceId, amount, deadline}.
///      The contract only accepts payments carrying that signature, so the amount
///      is fixed on-chain, expired quotes are rejected and every invoice can be
///      paid exactly once. Funds go straight to the treasury — the contract never
///      holds tokens.
contract SubscriptionPayments is EIP712 {
    using SafeERC20 for IERC20;

    bytes32 public constant QUOTE_TYPEHASH =
        keccak256("Quote(bytes32 invoiceId,uint256 amount,uint256 deadline)");

    IERC20 public immutable token;
    address public immutable treasury;
    /// @notice Address whose signatures authorise quotes (the billing server).
    address public immutable signer;

    /// @notice invoiceId => payer (zero address = unpaid).
    mapping(bytes32 invoiceId => address payer) public paidBy;

    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error QuoteExpired(uint256 deadline);
    error AlreadyPaid(bytes32 invoiceId);
    error InvalidQuoteSignature();

    constructor(IERC20 token_, address treasury_, address signer_) EIP712("SubscriptionPayments", "1") {
        if (address(token_) == address(0) || treasury_ == address(0) || signer_ == address(0)) {
            revert ZeroAddress();
        }
        token = token_;
        treasury = treasury_;
        signer = signer_;
    }

    /// @notice Pay an invoice. The caller must have approved `amount` of `token` first.
    function pay(bytes32 invoiceId, uint256 amount, uint256 deadline, bytes calldata signature) external {
        if (amount == 0) revert ZeroAmount();
        if (block.timestamp > deadline) revert QuoteExpired(deadline);
        if (paidBy[invoiceId] != address(0)) revert AlreadyPaid(invoiceId);

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(QUOTE_TYPEHASH, invoiceId, amount, deadline)));
        if (ECDSA.recover(digest, signature) != signer) revert InvalidQuoteSignature();

        // Effects before the external call (checks-effects-interactions).
        paidBy[invoiceId] = msg.sender;
        token.safeTransferFrom(msg.sender, treasury, amount);

        emit InvoicePaid(invoiceId, msg.sender, amount);
    }

    /// @notice EIP-712 domain separator, exposed for off-chain signers and tests.
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
