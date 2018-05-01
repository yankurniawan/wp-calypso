/** @format */

/**
 * External dependencies
 */

import { get } from 'lodash';

/**
 * Internal dependencies
 */

import { combineReducers, createReducer } from 'state/utils';
import { errorsSchema, stepSchema, paymentSchema, newCardFormSchema, newCardRawSchema } from './schema';
import { domainWhoisSchema } from 'state/domains/management/schema';

import {
	TRANSACTION_DOMAIN_DETAILS_SET,
	TRANSACTION_PAYMENT_SET,
	TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET,
	TRANSACTION_STEP_SET,
	TRANSACTION_RESET,
} from 'state/action-types';
import { BEFORE_SUBMIT } from 'lib/store-transactions/step-types';

/*

TODO: Handle: `case UpgradesActionTypes.CART_ITEM_REMOVE:` in client/lib/transaction/store.js
Will need to reduxify CartStore as well?
*/

export const domainDetails = createReducer(
	null,
	{
		[ TRANSACTION_DOMAIN_DETAILS_SET ]: ( state, action ) => action.domainDetails,
		[ TRANSACTION_RESET ]: () => null,
	},
	domainWhoisSchema
);

export const errors = createReducer(
	{},
	{
		[ TRANSACTION_STEP_SET ]: ( state, action ) => get( action.step, 'error.message', state ),
		[ TRANSACTION_RESET ]: () => {},
	},
	errorsSchema
);

export const step = createReducer(
	{},
	{
		[ TRANSACTION_STEP_SET ]: ( state, action ) => action.step,
		[ TRANSACTION_RESET ]: () => ( { name: BEFORE_SUBMIT } ),
	},
	stepSchema
);

export const payment = createReducer(
	{},
	{
		[ TRANSACTION_PAYMENT_SET ]: ( state, action ) => action.payment,
		[ TRANSACTION_RESET ]: () => {},
		[ TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET ]: ( state, action ) => {
			if ( state.payment.newCardDetails ) {
				return {
					...state,
					newCardDetails: {
						...state.newCardDetails,
						...action.rawDetails,
					},
				};
			}
			return state;
		},
	},
	paymentSchema
);

export const newCardFormFields = createReducer(
	{},
	{
		[ TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET ]: ( state, action ) => Object.assign( {}, state, action.maskedDetails ),
		[ TRANSACTION_RESET ]: () => {},
	},
	newCardFormSchema
);

export const newCardRawDetails = createReducer(
	{},
	{
		[ TRANSACTION_NEW_CREDIT_CARD_DETAILS_SET ]: ( state, action ) => Object.assign( {}, state, action.rawDetails ),
		[ TRANSACTION_RESET ]: () => {},
	},
	newCardRawSchema
);

export default combineReducers( {
	domainDetails,
	errors,
	step,
	payment,
	newCardFormFields,
	newCardRawDetails,
} );
