/** @format */

/*export const transactionSchema = {
	type: [ 'object', 'null' ],
	properties: {
		errors: { type: 'object' },
		newCardFormFields: { type: 'object' },
		newCardRawDetails: { type: 'object' },
		step: { type: 'object' },
		domainDetails: { type: [ 'object', 'null' ] },
	},
};*/

//TODO: complete properties

export const errorsSchema = {
	type: 'object',
	properties: {},
};

export const stepSchema = {
	type: 'object',
	properties: {},
};

export const paymentSchema = {
	type: 'object',
	properties: {
		newCardDetails: { type: 'object' },
	},
};

export const newCardFormFields = {
	type: 'object',
	properties: {},
};

export const newCardRawDetails = {
	type: 'object',
	properties: {},
};


