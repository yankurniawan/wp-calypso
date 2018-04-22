/** @format */

/**
 * External dependencies
 */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import {
	debounce,
	filter,
	first,
	flow,
	get,
	has,
	isEmpty,
	last,
	map,
	partial,
	throttle,
} from 'lodash';
import { localize } from 'i18n-calypso';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import { getPostRevision, getPostRevisionsDiffView } from 'state/selectors';
import TextDiff from 'components/text-diff';
import scrollTo from 'lib/scroll-to';
import { recordTracksEvent } from 'state/analytics/actions';
import { isWithinBreakpoint } from 'lib/viewport';

const getCenterOffset = node => get( node, 'offsetTop', 0 ) + get( node, 'offsetHeight', 0 ) / 2;

class EditorDiffViewer extends PureComponent {
	static propTypes = {
		postId: PropTypes.number.isRequired,
		selectedRevisionId: PropTypes.number,
		siteId: PropTypes.number.isRequired,
		diff: PropTypes.shape( {
			post_content: PropTypes.array,
			post_title: PropTypes.array,
			totals: PropTypes.object,
		} ).isRequired,
		diffView: PropTypes.string,

		// connected to dispatch
		recordTracksEvent: PropTypes.func.isRequired,

		// localize
		translate: PropTypes.func.isRequired,
	};

	state = {
		changeOffsets: [],
		scrollTop: 0,
		viewportHeight: 0,
	};

	isBigViewport = false;

	componentDidMount() {
		this.tryScrollingToFirstChangeOrTop();
		if ( typeof window !== 'undefined' ) {
			window.addEventListener( 'resize', this.debouncedRecomputeChanges );
			this.isBigViewport = isWithinBreakpoint( '>1040px' );
		}
	}

	componentWillUnmount() {
		if ( typeof window !== 'undefined' ) {
			window.removeEventListener( 'resize', this.debouncedRecomputeChanges );
		}
	}

	componentDidUpdate() {
		this.tryScrollingToFirstChangeOrTop();
	}

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.selectedRevisionId !== this.props.selectedRevisionId ) {
			this.setState( { changeOffsets: [] } );
		}
		if ( nextProps.diffView !== this.props.diffView ) {
			this.recomputeChanges( null );
		}
	}

	lastScolledRevisionId = null;

	tryScrollingToFirstChangeOrTop = () => {
		if (
			! this.props.selectedRevisionId ||
			this.props.selectedRevisionId === this.lastScolledRevisionId
		) {
			return;
		}

		// save revisionId so we don't scroll again, unless it changes
		this.lastScolledRevisionId = this.props.selectedRevisionId;

		this.recomputeChanges( () => {
			this.centerScrollingOnOffset( this.state.changeOffsets[ 0 ] || 0, false );
		} );
	};

	recomputeChanges = callback => {
		const changeNodes = this.getChangeNodes();
		this.setState(
			{
				changeOffsets: map( changeNodes, getCenterOffset ),
				viewportHeight: get( this.node, 'offsetHeight', 0 ),
				scrollTop: get( this.node, 'scrollTop', 0 ),
			},
			callback
		);
	};

	getChangeNodes = () => {
		const postTitleChangeNodes = this.getNodes( this.diff.post_title );
		const postContentChangeNodes = this.getNodes( this.diff.post_content );
		return [ ...postTitleChangeNodes, ...postContentChangeNodes ];
	};

	getNodes = diff => {
		return diff.reduce( ( nodes, change ) => {
			if ( change.ref && change.ref.current ) {
				nodes.push( change.ref.current );
			}
			return nodes;
		}, [] );
	};

	debouncedRecomputeChanges = debounce( () => {
		this.isBigViewport = isWithinBreakpoint( '>1040px' );
		partial( this.recomputeChanges, null )();
	}, 500 );

	centerScrollingOnOffset = ( offset, animated = true ) => {
		const nextScrollTop = Math.max( 0, offset - this.state.viewportHeight / 2 );

		if ( ! animated ) {
			this.node.scrollTop = nextScrollTop;
			return;
		}

		scrollTo( {
			container: this.node,
			x: 0,
			y: nextScrollTop,
		} );
	};

	handleScroll = e => {
		this.setState( {
			scrollTop: get( e.target, 'scrollTop', 0 ),
		} );
	};

	throttledScrollHandler = throttle( this.handleScroll, 100 );

	handleScrollableRef = node => {
		if ( node ) {
			this.node = node;
			this.node.addEventListener( 'scroll', this.throttledScrollHandler );
		} else {
			this.node.removeEventListener( 'scroll', this.throttledScrollHandler );
			this.node = null;
		}
	};

	scrollAbove = () => {
		this.centerScrollingOnOffset( last( this.changesAboveViewport ) );
		this.props.recordTracksEvent( 'calypso_editor_post_revisions_scroll_hint_used', {
			direction: 'above',
		} );
	};

	scrollBelow = () => {
		this.centerScrollingOnOffset( first( this.changesBelowViewport ) );
		this.props.recordTracksEvent( 'calypso_editor_post_revisions_scroll_hint_used', {
			direction: 'below',
		} );
	};

	addRefs = diff => {
		const diffWithRefs = {};

		if ( ! isEmpty( diff.post_title ) ) {
			diffWithRefs.post_title = map( diff.post_title, this.createRef );
		}

		if ( ! isEmpty( diff.post_content ) ) {
			diffWithRefs.post_content = map( diff.post_content, this.createRef );
		}

		return diffWithRefs;
	};

	createRef = change => {
		if ( change.op === 'del' || change.op === 'add' ) {
			change.ref = React.createRef();
		}

		return change;
	};

	render() {
		const { diff, diffView } = this.props;
		this.diff = this.addRefs( diff );
		const classes = classNames( 'editor-diff-viewer', {
			'is-loading': ! has( this.diff, 'post_content' ) && ! has( this.diff, 'post_title' ),
			'is-split': diffView === 'split',
		} );

		const bottomBoundary = this.state.scrollTop + this.state.viewportHeight;

		// saving to `this` so we can access if from `scrollAbove` and `scrollBelow`
		this.changesAboveViewport = filter(
			this.state.changeOffsets,
			offset => offset < this.state.scrollTop
		);
		this.changesBelowViewport = filter(
			this.state.changeOffsets,
			offset => offset > bottomBoundary
		);

		const showHints = this.state.viewportHeight > 470;
		const countAbove = this.changesAboveViewport.length;
		const countBelow = this.changesBelowViewport.length;

		return (
			<div className={ classes }>
				<div className="editor-diff-viewer__scrollable" ref={ this.handleScrollableRef }>
					<div className="editor-diff-viewer__main-pane">
						<h1 className="editor-diff-viewer__title">
							<TextDiff operations={ this.diff.post_title } />
						</h1>
						<pre className="editor-diff-viewer__content">
							<TextDiff operations={ this.diff.post_content } splitLines />
						</pre>
					</div>
					{ diffView === 'split' && (
						<div className="editor-diff-viewer__secondary-pane">
							<h1 className="editor-diff-viewer__title">
								<TextDiff operations={ this.diff.post_title } />
							</h1>
							<pre className="editor-diff-viewer__content">
								<TextDiff operations={ this.diff.post_content } splitLines />
							</pre>
						</div>
					) }
				</div>
				{ showHints &&
					countAbove > 0 && (
						<div className="editor-diff-viewer__hint-above" onClick={ this.scrollAbove }>
							<Gridicon className="editor-diff-viewer__hint-icon" size={ 18 } icon="arrow-up" />
							{ this.props.translate( '%(numberOfChanges)d change', '%(numberOfChanges)d changes', {
								args: { numberOfChanges: countAbove },
								count: countAbove,
							} ) }
						</div>
					) }
				{ showHints &&
					countBelow > 0 && (
						<div className="editor-diff-viewer__hint-below" onClick={ this.scrollBelow }>
							<Gridicon className="editor-diff-viewer__hint-icon" size={ 18 } icon="arrow-down" />
							{ this.props.translate( '%(numberOfChanges)d change', '%(numberOfChanges)d changes', {
								args: { numberOfChanges: countBelow },
								count: countBelow,
							} ) }
						</div>
					) }
			</div>
		);
	}
}

export default flow(
	localize,
	connect(
		( state, { siteId, postId, selectedRevisionId } ) => ( {
			revision: getPostRevision( state, siteId, postId, selectedRevisionId, 'display' ),
			diffView: getPostRevisionsDiffView( state ),
		} ),
		{ recordTracksEvent }
	)
)( EditorDiffViewer );
