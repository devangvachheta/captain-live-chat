import React, { useState, useEffect } from 'react';
import './canned_replies.scss';
import { __ } from '@wordpress/i18n';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';
import Input from '../../components/input/Input.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

const emptyForm = { shortcut: '', text: '' };

const CannedReplies = () => {
	const [ replies, setReplies ]   = useState( [] );
	const [ form, setForm ]         = useState( emptyForm );
	const [ editId, setEditId ]     = useState( null );
	const [ saving, setSaving ]     = useState( false );
	const [ loading, setLoading ]   = useState( true );
	const [ notice, setNotice ]     = useState( null );

	useEffect( () => {
		ajax( 'captlc_get_canned_replies' ).then( ( res ) => {
			if ( res?.success ) setReplies( res.data.replies || [] );
			setLoading( false );
		} ).catch( () => setLoading( false ) );
	}, [] );

	const showNotice = ( msg, type = 'success' ) => {
		setNotice( { msg, type } );
		setTimeout( () => setNotice( null ), 3500 );
	};

	const handleSave = ( e ) => {
		e.preventDefault();
		if ( ! form.shortcut.trim() || ! form.text.trim() ) return;

		setSaving( true );
		let updated;

		if ( editId !== null ) {
			updated = replies.map( ( r ) => r.id === editId ? { ...r, ...form } : r );
		} else {
			updated = [ ...replies, { id: Date.now(), ...form } ];
		}

		ajax( 'captlc_save_canned_replies', { replies: JSON.stringify( updated ) } )
			.then( ( res ) => {
				if ( res?.success ) {
					setReplies( res.data.replies );
					setForm( emptyForm );
					setEditId( null );
					showNotice( __( 'Saved successfully.', 'captain-live-chat' ) );
				} else {
					showNotice( res?.data?.message || __( 'Save failed.', 'captain-live-chat' ), 'error' );
				}
			} )
			.catch( () => showNotice( __( 'Network error.', 'captain-live-chat' ), 'error' ) )
			.finally( () => setSaving( false ) );
	};

	const handleEdit = ( reply ) => {
		setEditId( reply.id );
		setForm( { shortcut: reply.shortcut, text: reply.text } );
	};

	const handleDelete = ( id ) => {
		if ( ! window.confirm( __( 'Delete this canned reply?', 'captain-live-chat' ) ) ) return;
		const updated = replies.filter( ( r ) => r.id !== id );

		ajax( 'captlc_save_canned_replies', { replies: JSON.stringify( updated ) } )
			.then( ( res ) => {
				if ( res?.success ) {
					setReplies( res.data.replies );
					showNotice( __( 'Deleted.', 'captain-live-chat' ) );
				}
			} );
	};

	const cancelEdit = () => { setForm( emptyForm ); setEditId( null ); };

	return (
		<div className="captlc-canned">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Canned Responses', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Type "/" in the chat reply box to quickly insert a canned response.', 'captain-live-chat' ) }</p>
				</div>
			</div>

			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` }>{ notice.msg }</div>
			) }

			{ /* ── Add / Edit form ── */ }
			<div className="captlc-card">
				<h2 className="captlc-card__title">
					{ editId !== null ? __( 'Edit Canned Reply', 'captain-live-chat' ) : __( 'Add New Canned Reply', 'captain-live-chat' ) }
				</h2>

				<form onSubmit={ handleSave } className="captlc-canned__form">
					<div className="captlc-field">
						<label className="captlc-field__label" htmlFor="captlc-canned-shortcut">
							{ __( 'Shortcut', 'captain-live-chat' ) }
							<span className="captlc-field__hint-inline">{ __( '(e.g. hello, thanks, bye)', 'captain-live-chat' ) }</span>
						</label>
						<div className="captlc-canned__shortcut-wrap">
							<span className="captlc-canned__slash">/</span>
							<Input
								id="captlc-canned-shortcut"
								placeholder="hello"
								value={ form.shortcut }
								onChange={ ( e ) => setForm( ( f ) => ( { ...f, shortcut: e.target.value.replace( /\s/g, '' ) } ) ) }
							/>
						</div>
					</div>

					<div className="captlc-field">
						<label className="captlc-field__label" htmlFor="captlc-canned-text">{ __( 'Reply text', 'captain-live-chat' ) }</label>
						<textarea
							id="captlc-canned-text"
							className="captlc-textarea"
							rows="3"
							placeholder={ __( 'Hi! How can I help you today?', 'captain-live-chat' ) }
							value={ form.text }
							onChange={ ( e ) => setForm( ( f ) => ( { ...f, text: e.target.value } ) ) }
						/>
					</div>

					<div className="captlc-canned__form-actions">
						<Primary_button
							type="submit"
							text={ editId !== null ? __( 'Update', 'captain-live-chat' ) : __( 'Add Reply', 'captain-live-chat' ) }
							loader={ saving }
						/>
						{ editId !== null && (
							<button type="button" className="captlc-secondary-button" onClick={ cancelEdit }>
								{ __( 'Cancel', 'captain-live-chat' ) }
							</button>
						) }
					</div>
				</form>
			</div>

			{ /* ── Replies list ── */ }
			<div className="captlc-card">
				<h2 className="captlc-card__title">{ __( 'Saved Replies', 'captain-live-chat' ) }</h2>

				{ loading && <div className="captlc-canned__loading">{ __( 'Loading…', 'captain-live-chat' ) }</div> }

				{ ! loading && replies.length === 0 && (
					<div className="captlc-canned__empty">
						{ __( 'No canned replies yet. Add one above.', 'captain-live-chat' ) }
					</div>
				) }

				{ replies.map( ( reply ) => (
					<div key={ reply.id } className="captlc-canned__item">
						<div className="captlc-canned__item-shortcut">
							<span className="captlc-canned__slash">/</span>{ reply.shortcut }
						</div>
						<div className="captlc-canned__item-text">{ reply.text }</div>
						<div className="captlc-canned__item-actions">
							<button
								type="button"
								className="captlc-canned__action-btn captlc-canned__action-btn--edit"
								onClick={ () => handleEdit( reply ) }
							>{ __( 'Edit', 'captain-live-chat' ) }</button>
							<button
								type="button"
								className="captlc-canned__action-btn captlc-canned__action-btn--delete"
								onClick={ () => handleDelete( reply.id ) }
							>{ __( 'Delete', 'captain-live-chat' ) }</button>
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default CannedReplies;
