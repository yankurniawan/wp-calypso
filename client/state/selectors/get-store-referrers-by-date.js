/** @format */

/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { getSiteStatsNormalizedData } from 'state/stats/lists/selectors';
import { sortBySales } from 'woocommerce/app/store-stats/referrers/helpers';

export default function( state, { siteId, statType, query, endSelectedDate, limit, paginate } ) {
	const rawData = getSiteStatsNormalizedData( state, siteId, statType, query );
	const allRaw = rawData.map( row => {
		if ( row.data.length > 0 && ! find( row.data, d => d.referrer === 'All' ) ) {
			row.data.unshift(
				row.data.reduce(
					( all, r ) =>
						Object.assign( all, {
							add_to_carts: all.add_to_carts + r.add_to_carts,
							product_purchases: all.product_purchases + r.product_purchases,
							product_views: all.product_views + r.product_views,
							sales: all.sales + r.sales,
							currency: r.currency,
						} ),
					{
						referrer: 'All',
						category: 'All',
						add_to_carts: 0,
						product_purchases: 0,
						product_views: 0,
						sales: 0,
					}
				)
			);
		}
		return row;
	} );
	const selectedData = find( allRaw, d => d.date === endSelectedDate ) || { data: [] };
	return sortBySales( selectedData.data, limit && ! paginate ? limit : null );
}
