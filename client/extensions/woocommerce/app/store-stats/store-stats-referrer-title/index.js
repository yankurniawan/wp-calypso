/** @format */

/**
 * External dependencies
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import ErrorPanel from 'my-sites/stats/stats-error';
import { getWidgetPath, formatValue } from 'woocommerce/app/store-stats/utils';
import { getStoreReferrersByDate } from 'state/selectors';

class StoreStatsReferrerTitle extends Component {
	static propTypes = {
		data: PropTypes.array.isRequired,
		query: PropTypes.object.isRequired,
		siteId: PropTypes.number,
		statType: PropTypes.string.isRequired,
		endSelectedDate: PropTypes.string.isRequired,
		unit: PropTypes.string.isRequired,
		queryParams: PropTypes.object.isRequired,
		slug: PropTypes.string.isRequired,
		pageType: PropTypes.string.isRequired,
		selectedIndex: PropTypes.number,
		selectedReferrer: PropTypes.string,
	};

	state = {
		page: 1,
	};

	isPreCollection( date ) {
		const { moment } = this.props;
		return moment( date ).isBefore( moment( '2018-02-01' ) );
	}

	hasNosaraJobRun( date ) {
		const { moment } = this.props;
		const nowUtc = moment().utc();
		const daysOffsetFromUtc = nowUtc.hour() >= 10 ? 1 : 2;
		const lastValidDay = nowUtc.subtract( daysOffsetFromUtc, 'days' );
		return lastValidDay.isAfter( moment( date ) );
	}

	getEmptyDataMessage( date ) {
		const { translate, slug, queryParams, pageType } = this.props;
		if ( ! this.hasNosaraJobRun( date ) ) {
			const href = `/store/stats/${ pageType }${ getWidgetPath( 'week', slug, queryParams ) }`;
			const primary = translate( 'Data is being processed – check back soon' );
			const secondary = translate(
				'Expand to a {{a}}wider{{/a}} view to see your latest referrers',
				{
					components: {
						a: <a href={ href } />,
					},
				}
			);
			return [ primary, <p key="link">{ secondary }</p> ];
		}
		return this.isPreCollection( date )
			? [ translate( 'Referral data isn’t available before Jetpack v5.9 (March 2018)' ) ]
			: [ translate( 'No referral activity on this date' ) ];
	}

	render() {
		const { data, endSelectedDate, translate, selectedReferrer } = this.props;
		if ( data.length === 0 ) {
			const messages = this.getEmptyDataMessage( endSelectedDate );
			return (
				<Card className="store-stats-referrer-title stats-module is-showing-error has-no-data">
					<ErrorPanel message={ messages.shift() }>{ messages }</ErrorPanel>
				</Card>
			);
		}
		const titleData = find( data, {
			referrer: selectedReferrer ? selectedReferrer : data[ 0 ].referrer,
		} );
		if ( titleData ) {
			return (
				<Card className="store-stats-referrer-title">
					<div className="store-stats-referrer-title__stat store-stats-referrer-title__referrer">
						<span className="store-stats-referrer-title__label">{ translate( 'Referrer' ) }</span>
						<span className="store-stats-referrer-title__value">{ titleData.referrer || '' }</span>
					</div>
					<div className="store-stats-referrer-title__stat store-stats-referrer-title__sales">
						<span className="store-stats-referrer-title__label">
							{ translate( 'Gross Sales' ) }
						</span>
						<span className="store-stats-referrer-title__value">
							{ formatValue( titleData.sales, 'currency', titleData.currency ) }
						</span>
					</div>
					<div className="store-stats-referrer-title__stat store-stats-referrer-title__views">
						<span className="store-stats-referrer-title__label">{ translate( 'Views' ) }</span>
						<span className="store-stats-referrer-title__value">
							{ formatValue( titleData.product_views, 'number', 0 ) }
						</span>
					</div>
					<div className="store-stats-referrer-title__stat store-stats-referrer-title__carts">
						<span className="store-stats-referrer-title__label">{ translate( 'Carts' ) }</span>
						<span className="store-stats-referrer-title__value">
							{ formatValue( titleData.add_to_carts, 'number', 0 ) }
						</span>
					</div>
					<div className="store-stats-referrer-title__stat store-stats-referrer-title__purchases">
						<span className="store-stats-referrer-title__label">{ translate( 'Purchases' ) }</span>
						<span className="store-stats-referrer-title__value">
							{ formatValue( titleData.product_purchases, 'number', 0 ) }
						</span>
					</div>
				</Card>
			);
		}
		return null;
	}
}

export default connect( ( state, ownProps ) => {
	const { fetchedData } = ownProps;
	return {
		data: fetchedData || getStoreReferrersByDate( state, ownProps ),
	};
} )( localize( StoreStatsReferrerTitle ) );
