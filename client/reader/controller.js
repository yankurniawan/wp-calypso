/** @format */
/**
 * External Dependencies
 */
import React from 'react';
import page from 'page';
import i18n from 'i18n-calypso';

/**
 * Internal Dependencies
 */
import { abtest } from 'lib/abtest';
import feedLookup from 'lib/feed-lookup';
import { trackPageLoad, setPageTitle, getStartDate } from './controller-helper';
import FeedError from 'reader/feed-error';
import StreamComponent from 'reader/following/main';
import { getPrettyFeedUrl, getPrettySiteUrl } from 'reader/route';
import { recordTrack } from 'reader/stats';
import { preload } from 'sections-helper';
import AsyncLoad from 'components/async-load';
import { getAnalyticsMetaForStream } from 'state/data-layer/wpcom/read/streams/index';

const activeAbTests = [
	// active tests would go here
];
let lastRoute = null;

function userHasHistory( context ) {
	return !! context.lastRoute;
}

function renderFeedError( context, next ) {
	context.primary = React.createElement( FeedError );
	next();
}

const exported = {
	initAbTests( context, next ) {
		// spin up the ab tests that are currently active for the reader
		activeAbTests.forEach( test => abtest( test ) );
		next();
	},

	prettyRedirects( context, next ) {
		// Do we have a 'pretty' site or feed URL?
		let redirect;
		if ( context.params.blog_id ) {
			redirect = getPrettySiteUrl( context.params.blog_id );
		} else if ( context.params.feed_id ) {
			redirect = getPrettyFeedUrl( context.params.feed_id );
		}

		if ( redirect ) {
			return page.redirect( redirect );
		}

		next();
	},

	legacyRedirects( context, next ) {
		const legacyPathRegexes = {
			feedStream: /^\/read\/blog\/feed\/([0-9]+)$/i,
			feedFullPost: /^\/read\/post\/feed\/([0-9]+)\/([0-9]+)$/i,
			blogStream: /^\/read\/blog\/id\/([0-9]+)$/i,
			blogFullPost: /^\/read\/post\/id\/([0-9]+)\/([0-9]+)$/i,
		};

		if ( context.path.match( legacyPathRegexes.feedStream ) ) {
			page.redirect( `/read/feeds/${ context.params.feed_id }` );
		} else if ( context.path.match( legacyPathRegexes.feedFullPost ) ) {
			page.redirect( `/read/feeds/${ context.params.feed_id }/posts/${ context.params.post_id }` );
		} else if ( context.path.match( legacyPathRegexes.blogStream ) ) {
			page.redirect( `/read/blogs/${ context.params.blog_id }` );
		} else if ( context.path.match( legacyPathRegexes.blogFullPost ) ) {
			page.redirect( `/read/blogs/${ context.params.blog_id }/posts/${ context.params.post_id }` );
		}

		next();
	},

	updateLastRoute( context, next ) {
		if ( lastRoute ) {
			context.lastRoute = lastRoute;
		}
		lastRoute = context.path;
		next();
	},

	incompleteUrlRedirects( context, next ) {
		let redirect;
		// Have we arrived at a URL ending in /posts? Redirect to feed stream/blog stream
		if ( context.path.match( /^\/read\/feeds\/([0-9]+)\/posts$/i ) ) {
			redirect = `/read/feeds/${ context.params.feed_id }`;
		} else if ( context.path.match( /^\/read\/blogs\/([0-9]+)\/posts$/i ) ) {
			redirect = `/read/blogs/${ context.params.blog_id }`;
		}

		if ( redirect ) {
			return page.redirect( redirect );
		}

		next();
	},

	preloadReaderBundle( context, next ) {
		preload( 'reader' );
		next();
	},

	sidebar( context, next ) {
		context.secondary = <AsyncLoad require="reader/sidebar" path={ context.path } />;

		next();
	},

	unmountSidebar( context, next ) {
		next();
	},

	following( context, next ) {
		const streamKey = 'following';
		const startDate = getStartDate( context );
		const { mcKey, path, readerView } = getAnalyticsMetaForStream( streamKey );

		trackPageLoad( path, readerView, mcKey );
		recordTrack( 'calypso_reader_following_loaded' );

		setPageTitle( context, i18n.translate( 'Following' ) );

		context.primary = React.createElement( StreamComponent, {
			key: 'following',
			listName: i18n.translate( 'Followed Sites' ),
			streamKey,
			startDate,
			recsStreamKey: 'custom_recs_posts_with_images',
			showPrimaryFollowButtonOnCards: false,
		} );
		next();
	},

	feedDiscovery( context, next ) {
		if ( ! context.params.feed_id.match( /^\d+$/ ) ) {
			feedLookup( context.params.feed_id )
				.then( function( feedId ) {
					page.redirect( `/read/feeds/${ feedId }` );
				} )
				.catch( function() {
					renderFeedError( context );
				} );
		} else {
			next();
		}
	},

	feedListing( context, next ) {
		const feedId = context.params.feed_id;
		const streamKey = 'feed:' + feedId;
		const { mcKey, path, readerView } = getAnalyticsMetaForStream( streamKey );

		trackPageLoad( path, readerView, mcKey );
		recordTrack( 'calypso_reader_blog_preview', { feed_id: feedId } );

		context.primary = (
			<AsyncLoad
				require="reader/feed-stream"
				key={ streamKey }
				streamKey={ streamKey }
				feedId={ +feedId }
				showPrimaryFollowButtonOnCards={ false }
				suppressSiteNameLink={ true }
				showBack={ userHasHistory( context ) }
			/>
		);
		next();
	},

	blogListing( context, next ) {
		const blogId = context.params.blog_id;
		const streamKey = 'site:' + blogId;
		const { mcKey, path, readerView } = getAnalyticsMetaForStream( streamKey );

		trackPageLoad( path, readerView, mcKey );
		recordTrack( 'calypso_reader_blog_preview', { blog_id: blogId } );
		context.primary = (
			<AsyncLoad
				require="reader/site-stream"
				key={ 'site-' + blogId }
				streamKey={ streamKey }
				siteId={ +blogId }
				showPrimaryFollowButtonOnCards={ false }
				suppressSiteNameLink={ true }
				showBack={ userHasHistory( context ) }
			/>
		);
		next();
	},

	readA8C( context, next ) {
		const streamKey = 'a8c';
		const { mcKey, path, readerView } = getAnalyticsMetaForStream( streamKey );

		trackPageLoad( path, readerView, mcKey );
		setPageTitle( context, 'Automattic' );

		/* eslint-disable wpcalypso/jsx-classname-namespace */
		context.primary = (
			<AsyncLoad
				require="reader/team/main"
				key="read-a8c"
				className="is-a8c"
				listName="Automattic"
				streamKey={ streamKey }
				showPrimaryFollowButtonOnCards={ false }
			/>
		);
		/* eslint-enable wpcalypso/jsx-classname-namespace */
		next();
	},
};

export const {
	initAbTests,
	prettyRedirects,
	legacyRedirects,
	updateLastRoute,
	incompleteUrlRedirects,
	preloadReaderBundle,
	sidebar,
	unmountSidebar,
	following,
	feedDiscovery,
	feedListing,
	blogListing,
	readA8C,
} = exported;
