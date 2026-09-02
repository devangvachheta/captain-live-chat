import React, { useState, useEffect, useCallback } from 'react';
import './history.scss';
import { __ } from '@wordpress/i18n';
import Input from '../../components/input/Input.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

const STATUS_OPTIONS = [
	{ value: '',       label: 'All' },
	{ value: 'open',   label: 'Open' },
	{ value: 'closed', label: 'Closed' },
];

const History = () => {
	const [ threads, setThreads ]     = useState( [] );
	const [ loading, setLoading ]     = useState( true );
	const [ search, setSearch ]       = useState( '' );
	const [ status, setStatus ]       = useState( '' );
	const [ dateFrom, setDateFrom ]   = useState( '' );
	const [ dateTo, setDateTo ]       = useState( '' );
	const [ expanded, setExpanded ]   = useState( null );
	const [ messages, setMessages ]   = useState( {} );
	const [ msgLoading, setMsgLoading ] = useState( false );
	const [ hasMoreMsgs, setHasMoreMsgs ] = useState( {} ); // thread.id => bool
	const [ loadingOlder, setLoadingOlder ] = useState( false );
	const [ exporting, setExporting ] = useState( false );
	const [ page, setPage ]           = useState( 1 );
	const [ totalPages, setTotalPages ] = useState( 1 );
	const [ deletingId, setDeletingId ] = useState( null );

	const PER_PAGE = 20;

	const load = useCallback( () => {
		setLoading( true );
		ajax( 'captlc_get_history', {
			search,
			status,
			date_from: dateFrom,
			date_to:   dateTo,
			page,
			per_page:  PER_PAGE,
		} ).then( ( res ) => {
			if ( res?.success ) {
				setThreads( res.data.threads );
				setTotalPages( res.data.total_pages || 1 );
			}
		} ).catch( () => {} ).finally( () => setLoading( false ) );
	}, [ search, status, dateFrom, dateTo, page ] );

	useEffect( () => { load(); }, [ load ] );

	// Reset to page 1 when filters change.
	useEffect( () => { setPage( 1 ); }, [ search, status, dateFrom, dateTo ] );

	const toggleThread = ( thread ) => {
		if ( expanded === thread.id ) {
			setExpanded( null );
			return;
		}

		setExpanded( thread.id );

		if ( messages[ thread.id ] ) return;

		setMsgLoading( true );
		ajax( 'captlc_get_thread_messages', { thread_id: thread.id } )
			.then( ( res ) => {
				if ( res?.success ) {
					setMessages( ( prev ) => ( { ...prev, [ thread.id ]: res.data.messages } ) );
					setHasMoreMsgs( ( prev ) => ( { ...prev, [ thread.id ]: !! res.data.has_more } ) );
				}
			} )
			.catch( () => {} )
			.finally( () => setMsgLoading( false ) );
	};

	const loadOlderMessages = ( thread ) => {
		const current = messages[ thread.id ] || [];
		if ( ! current.length || loadingOlder ) return;

		setLoadingOlder( true );
		ajax( 'captlc_get_older_thread_messages', { thread_id: thread.id, before_id: current[ 0 ].id } )
			.then( ( res ) => {
				if ( res?.success ) {
					setMessages( ( prev ) => ( { ...prev, [ thread.id ]: [ ...res.data.messages, ...current ] } ) );
					setHasMoreMsgs( ( prev ) => ( { ...prev, [ thread.id ]: !! res.data.has_more } ) );
				}
			} )
			.catch( () => {} )
			.finally( () => setLoadingOlder( false ) );
	};

	const exportCSV = () => {
		setExporting( true );
		ajax( 'captlc_export_history', { search, status, date_from: dateFrom, date_to: dateTo } )
			.then( ( res ) => {
				if ( res?.success && res.data.csv ) {
					const blob = new Blob( [ res.data.csv ], { type: 'text/csv;charset=utf-8;' } );
					const url  = URL.createObjectURL( blob );
					const a    = document.createElement( 'a' );
					a.href     = url;
					a.download = 'chat-history-' + new Date().toISOString().slice( 0, 10 ) + '.csv';
					a.click();
					URL.revokeObjectURL( url );
				}
			} )
			.catch( () => {} )
			.finally( () => setExporting( false ) );
	};

	const permanentlyDelete = ( thread, e ) => {
		e.stopPropagation();
		if ( ! window.confirm( __( 'Permanently erase this conversation? This removes it from History for good and cannot be undone.', 'captain-live-chat' ) ) ) return;

		setDeletingId( thread.id );
		ajax( 'captlc_permanently_delete_thread', { thread_id: thread.id } )
			.then( ( res ) => {
				if ( res?.success ) {
					setThreads( ( prev ) => prev.filter( ( t ) => t.id !== thread.id ) );
					if ( expanded === thread.id ) setExpanded( null );
				} else {
					window.alert( res?.data?.message || __( 'Could not delete the conversation.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => window.alert( __( 'Network error — could not delete the conversation.', 'captain-live-chat' ) ) )
			.finally( () => setDeletingId( null ) );
	};

	return (
		<div className="captlc-history">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Chat History', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Browse, search and export past conversations.', 'captain-live-chat' ) }</p>
				</div>
				<button
					type="button"
					className="captlc-secondary-button"
					onClick={ exportCSV }
					disabled={ exporting }
				>
					{ exporting ? __( 'Exporting…', 'captain-live-chat' ) : __( '⬇ Export CSV', 'captain-live-chat' ) }
				</button>
			</div>

			{ /* ── Filters ── */ }
			<div className="captlc-card captlc-history__filters">
				<div className="captlc-history__filter-row">
					<div className="captlc-field captlc-field--grow">
						<label className="captlc-field__label" htmlFor="captlc-history-search">{ __( 'Search', 'captain-live-chat' ) }</label>
						<Input
							id="captlc-history-search"
							placeholder={ __( 'Visitor name or email…', 'captain-live-chat' ) }
							value={ search }
							onChange={ ( e ) => setSearch( e.target.value ) }
						/>
					</div>

					<div className="captlc-field">
						<label className="captlc-field__label" htmlFor="captlc-history-status">{ __( 'Status', 'captain-live-chat' ) }</label>
						<select
							id="captlc-history-status"
							className="captlc-select"
							value={ status }
							onChange={ ( e ) => setStatus( e.target.value ) }
						>
							{ STATUS_OPTIONS.map( ( o ) => (
								<option key={ o.value } value={ o.value }>{ o.label }</option>
							) ) }
						</select>
					</div>

					<div className="captlc-field">
						<label className="captlc-field__label" htmlFor="captlc-history-from">{ __( 'From', 'captain-live-chat' ) }</label>
						<input
							id="captlc-history-from"
							type="date"
							className="captlc-input-field"
							value={ dateFrom }
							onChange={ ( e ) => setDateFrom( e.target.value ) }
						/>
					</div>

					<div className="captlc-field">
						<label className="captlc-field__label" htmlFor="captlc-history-to">{ __( 'To', 'captain-live-chat' ) }</label>
						<input
							id="captlc-history-to"
							type="date"
							className="captlc-input-field"
							value={ dateTo }
							onChange={ ( e ) => setDateTo( e.target.value ) }
						/>
					</div>
				</div>
			</div>

			{ /* ── Thread table ── */ }
			<div className="captlc-card captlc-history__table-wrap">
				{ loading && (
					<div className="captlc-history__state">{ __( 'Loading…', 'captain-live-chat' ) }</div>
				) }

				{ ! loading && threads.length === 0 && (
					<div className="captlc-history__state">{ __( 'No conversations found.', 'captain-live-chat' ) }</div>
				) }

				{ ! loading && threads.length > 0 && (
					<>
						<table className="captlc-history__table">
							<thead>
								<tr>
									<th>{ __( 'Visitor', 'captain-live-chat' ) }</th>
									<th>{ __( 'Email', 'captain-live-chat' ) }</th>
									<th>{ __( 'Status', 'captain-live-chat' ) }</th>
									<th>{ __( 'Device', 'captain-live-chat' ) }</th>
									<th>{ __( 'Date', 'captain-live-chat' ) }</th>
									<th>{ __( 'Messages', 'captain-live-chat' ) }</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{ threads.map( ( t ) => (
									<React.Fragment key={ t.id }>
										<tr
											className={ `captlc-history__row${ expanded === t.id ? ' is-expanded' : '' }` }
											onClick={ () => toggleThread( t ) }
										>
											<td className="captlc-history__name">{ t.visitor_name || __( 'Visitor', 'captain-live-chat' ) }</td>
											<td>{ t.visitor_email || '—' }</td>
											<td>
												<span className={ `captlc-history__badge captlc-history__badge--${ t.status }` }>
													{ t.status }
												</span>
												{ t.deleted_at && (
													<span className="captlc-history__badge captlc-history__badge--removed">
														{ __( 'Removed from Inbox', 'captain-live-chat' ) }
													</span>
												) }
											</td>
											<td>{ [ t.browser, t.device ].filter( Boolean ).join( ' / ' ) || '—' }</td>
											<td>{ t.created_at ? t.created_at.slice( 0, 10 ) : '—' }</td>
											<td>{ t.message_count }</td>
											<td>
												<span className="captlc-history__chevron">
													{ expanded === t.id ? '▲' : '▼' }
												</span>
											</td>
										</tr>

										{ expanded === t.id && (
											<tr className="captlc-history__detail-row">
												<td colSpan="7">
													<div className="captlc-history__messages">
														{ msgLoading && ! messages[ t.id ] && (
															<div className="captlc-history__state">{ __( 'Loading messages…', 'captain-live-chat' ) }</div>
														) }
														{ ! msgLoading && hasMoreMsgs[ t.id ] && (
															<button
																type="button"
																className="captlc-history__load-more"
																onClick={ ( e ) => { e.stopPropagation(); loadOlderMessages( t ); } }
																disabled={ loadingOlder }
															>
																{ loadingOlder ? __( 'Loading…', 'captain-live-chat' ) : __( '↑ Load earlier messages', 'captain-live-chat' ) }
															</button>
														) }
														{ ( messages[ t.id ] || [] ).map( ( msg, i ) => (
															<div key={ i } className={ `captlc-msg captlc-msg--${ msg.sender_type }` }>
																{ msg.message }
																{ msg.attachment_url && (
																	/\.(jpe?g|png|gif|webp)$/i.test( msg.attachment_url )
																		? <img src={ msg.attachment_url } alt="" style={ { maxWidth: '120px', display: 'block', marginTop: '4px', borderRadius: '6px' } } />
																		: <a href={ msg.attachment_url } target="_blank" rel="noopener noreferrer" style={ { display: 'block', marginTop: '4px', fontSize: '12px' } }>📎 { msg.attachment_url.split( '/' ).pop() }</a>
																) }
															</div>
														) ) }
													</div>

													<div className="captlc-history__detail-actions">
														<button
															type="button"
															className="captlc-history__delete-btn"
															onClick={ ( e ) => permanentlyDelete( t, e ) }
															disabled={ deletingId === t.id }
														>
															🗑 { deletingId === t.id ? __( 'Deleting…', 'captain-live-chat' ) : __( 'Delete Permanently', 'captain-live-chat' ) }
														</button>
													</div>
												</td>
											</tr>
										) }
									</React.Fragment>
								) ) }
							</tbody>
						</table>

						{ /* ── Pagination ── */ }
						{ totalPages > 1 && (
							<div className="captlc-history__pagination">
								<button
									type="button"
									className="captlc-secondary-button"
									disabled={ page <= 1 }
									onClick={ () => setPage( ( p ) => p - 1 ) }
								>
									<span className="captlc-dir-arrow" aria-hidden="true">←</span> { __( 'Prev', 'captain-live-chat' ) }
								</button>

								<span className="captlc-history__page-info">
									{ page } / { totalPages }
								</span>

								<button
									type="button"
									className="captlc-secondary-button"
									disabled={ page >= totalPages }
									onClick={ () => setPage( ( p ) => p + 1 ) }
								>
									{ __( 'Next', 'captain-live-chat' ) } <span className="captlc-dir-arrow" aria-hidden="true">→</span>
								</button>
							</div>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default History;
