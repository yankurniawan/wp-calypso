/** @format */
/**
 * External dependencies
 */
import { defer } from 'lodash';

/**
 * Internal dependencies
 */
import { submit } from 'lib/store-transactions';

import {
	TRANSACTION_CART_ITEM_REMOVE,
	TRANSACTION_DOMAIN_DETAILS_SET,
	TRANSACTION_PAYMENT_SET,
	TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET,
	TRANSACTION_STEP_SET,
	TRANSACTION_RESET,
} from 'state/action-types';

export const setDomainDetails = domainDetails => ( {
	type: TRANSACTION_DOMAIN_DETAILS_SET,
	domainDetails,
} );

export const updateDomainDetailsAfterCartUpdate = () => {
	return {
		type: TRANSACTION_CART_ITEM_REMOVE,
	};
};

export const setPayment = payment => ( {
	type: TRANSACTION_PAYMENT_SET,
	payment,
} );

export const setNewCreditCardDetails = options => {
	const { rawDetails, maskedDetails } = options;
	return {
		type: TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET,
		rawDetails,
		maskedDetails,
	};
};

// TODO: return a promise instead of passing a callback? See: client/lib/upgrades/actions/checkout.js
export const submitTransaction = ( { cart, transaction, successUrl, cancelUrl }, onComplete ) => {
	submit(
		{
			cart: cart,
			payment: transaction.payment,
			domainDetails: transaction.domainDetails,
			successUrl,
			cancelUrl,
		},
		// Execute every step handler in its own event loop tick, so that a complete React
		// rendering cycle happens on each step and `componentWillReceiveProps` of objects
		// like the `TransactionStepsMixin` are called with every step.
		step =>
			defer( () => {
				return {
					type: TRANSACTION_STEP_SET,
					step,
				};

				// TODO: return a promise instead of passing a callback?
				if ( onComplete && step.name === 'received-wpcom-response' ) {
					onComplete( step.error, step.data );
				}
			} )
	);
};

export const resetTransaction = () => ( {
	type: TRANSACTION_RESET,
} );
