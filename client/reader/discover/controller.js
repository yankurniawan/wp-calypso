/** @format */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import config from 'config';
import { recordTrack } from 'reader/stats';
import { trackPageLoad } from 'reader/controller-helper';
import { getAnalyticsMetaForStream } from 'state/data-layer/wpcom/read/streams/index';
import AsyncLoad from 'components/async-load';

export function discover( context, next ) {
	const blogId = config( 'discover_blog_id' );
	const streamKey = `site:${ blogId }`;
	const featuredStreamKey = `featured:${ blogId }`;
	const { path, readerView } = getAnalyticsMetaForStream( streamKey );
	const mcKey = 'discover';

	trackPageLoad( path, readerView, mcKey );
	recordTrack( 'calypso_reader_discover_viewed' );

	/* eslint-disable wpcalypso/jsx-classname-namespace */
	context.primary = (
		<AsyncLoad
			require="reader/site-stream"
			key={ 'site-' + blogId }
			streamKey={ streamKey }
			featuredStreamKey={ featuredStreamKey }
			siteId={ +blogId }
			title="Discover"
			suppressSiteNameLink={ true }
			showPrimaryFollowButtonOnCards={ false }
			isDiscoverStream={ true }
			showBack={ false }
			className="is-discover-stream is-site-stream"
		/>
	);
	/* eslint-enable wpcalypso/jsx-classname-namespace */
	next();
}
