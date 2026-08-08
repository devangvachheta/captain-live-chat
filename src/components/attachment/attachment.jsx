import React, { useRef, useState } from 'react';
import './attachment.scss';

const ALLOWED_TYPES = [
	'image/jpeg', 'image/png', 'image/gif', 'image/webp',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_MB = 5;

// Paperclip icon SVG.
const IconPaperclip = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
		<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
	</svg>
);

const AttachmentUpload = ( { threadId, nonce, ajaxUrl, onUploadSuccess, onError } ) => {
	const fileInputRef = useRef( null );
	const [ uploading, setUploading ] = useState( false );

	const handleFileChange = ( e ) => {
		const file = e.target.files[ 0 ];
		if ( ! file ) return;

		// Client-side validation.
		if ( ! ALLOWED_TYPES.includes( file.type ) ) {
			onError( 'File type not allowed. Use JPG, PNG, GIF, WEBP, PDF, DOC or DOCX.' );
			e.target.value = '';
			return;
		}

		if ( file.size > MAX_SIZE_MB * 1024 * 1024 ) {
			onError( `File too large. Maximum size is ${ MAX_SIZE_MB } MB.` );
			e.target.value = '';
			return;
		}

		setUploading( true );

		const formData = new FormData();
		formData.append( 'action', 'captlc_upload_attachment' );
		formData.append( 'nonce', nonce );
		formData.append( 'thread_id', threadId );
		formData.append( 'captlc_file', file );

		fetch( ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: formData,
		} )
			.then( ( res ) => {
				if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
				return res.json();
			} )
			.then( ( res ) => {
				if ( res?.success ) {
					onUploadSuccess( res.data );
				} else {
					onError( res?.data?.message || 'Upload failed. Please try again.' );
				}
			} )
			.catch( () => onError( 'Network error — upload failed.' ) )
			.finally( () => {
				setUploading( false );
				e.target.value = '';
			} );
	};

	return (
		<div className="captlc-attachment">
			<input
				type="file"
				ref={ fileInputRef }
				className="captlc-attachment__input"
				accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
				onChange={ handleFileChange }
				tabIndex={ -1 }
				aria-hidden="true"
			/>
			<button
				type="button"
				className={ `captlc-attachment__btn${ uploading ? ' is-uploading' : '' }` }
				onClick={ () => fileInputRef.current?.click() }
				disabled={ uploading }
				title="Attach file"
				aria-label="Attach file"
			>
				{ uploading ? (
					<span className="captlc-attachment__spinner"></span>
				) : (
					<IconPaperclip />
				) }
			</button>
		</div>
	);
};

export default AttachmentUpload;
